import { GluegunToolbox } from 'gluegun';
import ConfigurationService from '../services/configuration-service';
import glob from 'glob';
import ApiService from '../services/api-service';
import * as fs from 'fs';

module.exports = {
  name: 'deploy',
  description: 'Create a new release and deploy the documentation',
  alias: ['d'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.info();

    let params = toolbox.parameters.options as {
      appId: string;
      secretKey: string;
      clientId: string;
    };

    ConfigurationService.checkKeysExistence(params, toolbox);
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

    const spinner = toolbox.print.spin(
      'Creating document sources and groups from ".thon" data...',
    );

    const fullSrcDir = ConfigurationService.getFullSourceDir();

    const componentsGlobPattern = `${fullSrcDir}/**/*.${
      extensions.length > 1 ? `+(${extensions.join('|')})` : extensions[0]
    }.{js,ts,jsx,tsx}`;
    const markdownsGlobPattern = `${fullSrcDir}/**/*.md`;
    let files = [
      ...glob.sync(componentsGlobPattern),
      ...glob.sync(markdownsGlobPattern),
    ];

    if (files.length === 0) {
      spinner.warn('\nNo file has been found. Deploy aborted.');
      process.exit();
    }

    let payload = [];
    createDocumentSourcesPayload({ payload, fullSrcDir, toolbox });

    await ApiService.createDocumentSourcesAndGroups(payload, params);

    spinner.succeed(`Successfully deployed`);

    process.exit();
  },
};

function createDocumentSourcesPayload({ payload, fullSrcDir, toolbox }): any {
  let dirItems = fs
    .readdirSync(fullSrcDir)
    .filter((item) => item !== 'index.js');

  let files = [];
  dirItems.forEach((item) => {
    const isFolder = fs.lstatSync(`${fullSrcDir}/${item}`).isDirectory();

    if (isFolder) {
      files = createDocumentSourcesPayload({
        payload,
        fullSrcDir: `${fullSrcDir}/${item}`,
        toolbox,
      });
    }

    if (isFolder) {
      payload.push({
        title: item,
        files,
      });
    } else if (item.endsWith('.md')) {
      // console.log(files, item);
      files.push({
        title: item.replace('.md', ''),
      });
    }
  });

  return files;
}
