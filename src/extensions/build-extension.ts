import { GluegunToolbox } from 'gluegun';
import * as fs from 'fs';
import * as glob from 'glob';
import ConfigurationService from '../services/configuration-service';
import { exec } from 'child_process';

module.exports = (toolbox: GluegunToolbox) => {
  toolbox.build = async () => {
    const spinner = toolbox.print.spin('Building...');
    await toolbox.system.run('sleep 1');

    // Installing necessary packages
    // exec('yarn install marked');

    /*
      1. Verificar se o source path existe
      2. Selecionar todos os arquivos com as extensoes dentro do array no source path
      3. Gerar um arquivo index (ts ou js) que exporta todos esses arquivos
    */

    ConfigurationService.checkSourceExistence(toolbox);
    ConfigurationService.checkExtensionsExistence(toolbox);

    const { extensions, sourceDir, useTypescript } =
      ConfigurationService.getConfiguration();

    const fullSrcDir = ConfigurationService.getFullSourceDir();

    let files = glob.sync(
      `${fullSrcDir}/**/*.${
        extensions.length > 1 ? `{${extensions.join(',')}}` : extensions[0]
      }.{js,ts,jsx,tsx}`,
    );

    if (files.length === 0) {
      spinner.warn(
        'No file has been found. Check the "extensions" on configuration file.',
      );
      process.exit();
    }

    spinner.stop();

    toolbox.print.info(
      `Found ${files.length} file${files.length > 1 ? 's' : ''}\n`,
    );

    spinner.start();
    await toolbox.system.run('sleep 1');

    files = files.map((file) => {
      const splitPath = file.split(`/${sourceDir}/`);
      const [relativePath] = splitPath[splitPath.length - 1].split(
        useTypescript ? '.ts' : '.js',
      );

      if (useTypescript) {
        return `import './${relativePath}';`;
      }

      return `require('./${relativePath}');`;
    });

    const requires = files.join('\n');

    fs.writeFileSync(
      `${fullSrcDir}/index.${useTypescript ? 'ts' : 'js'}`,
      requires,
    );

    spinner.succeed('Successfully builded');
  };
};
