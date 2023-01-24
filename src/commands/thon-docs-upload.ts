import { GluegunToolbox } from 'gluegun';
import ConfigurationService from '../services/configuration-service';
import glob from 'glob';
import fs from 'fs-extra';
import ApiService from '../services/api-service';
import { zipDir } from '../helpers/zip-dir';

module.exports = {
  name: 'deploy',
  description: 'Create a new release and deploy the documentation',
  alias: ['d'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.info();

    ConfigurationService.checkSourceExistence(toolbox);
    ConfigurationService.checkExtensionsExistence(toolbox);

    const { extensions, sourceDir, componentsFolders } =
      ConfigurationService.getConfiguration();

    toolbox.print.info(`Found the source dir: ${sourceDir}`);
    toolbox.print.info(`Found the extensions: ${extensions}\n`);

    if (componentsFolders.length === 0) {
      toolbox.print.error(
        'ERROR: You must set one or more folders where the components are located. Use the "componentsFolders" property on configuration file.',
      );
      process.exit();
    }

    const spinner = toolbox.print.spin('Deploying the markdown files...');
    await toolbox.system.run('sleep 1');

    const fullSrcDir = ConfigurationService.getFullSourceDir();

    const globPattern = `${fullSrcDir}/**/*.${
      extensions.length > 1 ? `+(${extensions.join('|')})` : extensions[0]
    }.{js,ts,jsx,tsx}`;
    let files = glob.sync(globPattern);

    if (files.length === 0) {
      spinner.warn('\nNo file has been found. Deploy aborted.');
      process.exit();
    }

    const { id: releaseId, number } = await ApiService.createRelease();
    const sourcePath = process.cwd();

    const folderName = `${sourcePath}/.TL-deploy_${number}_${releaseId}`;

    fs.mkdirSync(folderName);

    // Move .thon to deploy folder
    fs.copySync(fullSrcDir, `${folderName}/${sourceDir}`);

    // Move components to deploy folder
    componentsFolders.forEach((componentFolder) => {
      fs.copySync(
        `${sourcePath}/${componentFolder}`,
        `${folderName}/${componentFolder}`,
      );
    });

    const zipName = `${folderName.replace('.TL-deploy', 'TL-deploy')}.zip`;

    await zipDir(folderName, zipName);

    fs.rmSync(folderName, { recursive: true, force: true });

    spinner.succeed(
      `Successfully deployed - Document Release Number: ${number}`,
    );

    process.exit();
  },
};
