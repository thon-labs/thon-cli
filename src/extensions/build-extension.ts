import { GluegunToolbox } from 'gluegun';
import * as glob from 'glob';
import ConfigurationService from '../services/configuration-service';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import trim from 'lodash/trim';

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((y, f) => f(y), x);

module.exports = (toolbox: GluegunToolbox) => {
  toolbox.build = async () => {
    const spinner = toolbox.print.spin('Building...');
    await toolbox.system.run('sleep 1');

    ConfigurationService.checkSourceExistence(toolbox);
    ConfigurationService.checkExtensionsExistence(toolbox);

    const { extensions, sourceDir, useTypescript } =
      ConfigurationService.getConfiguration();

    const fullSrcDir = ConfigurationService.getFullSourceDir();

    const globPattern = `${fullSrcDir}/**/*.${
      extensions.length > 1 ? `+(${extensions.join('|')})` : extensions[0]
    }.{js,ts,jsx,tsx}`;
    let files = glob.sync(globPattern);

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

    const components = files.map((file) => {
      const splitPath = file.split(`/${sourceDir}/`);
      const folderAndFile = splitPath[splitPath.length - 1];
      const [relativePath] = folderAndFile.split(useTypescript ? '.ts' : '.js');
      const relativePathSplit = folderAndFile.split('/');
      const fileName = relativePathSplit[relativePathSplit.length - 1];
      let componentName = null;

      for (let i = 0; i < extensions.length; i++) {
        const fileNameSplit = fileName.split(`.${extensions[i]}.`);

        if (fileNameSplit.length > 1) {
          componentName = pipe(camelCase, upperFirst, trim)(fileNameSplit[0]);
          break;
        }
      }

      return {
        componentName,
        relativePath,
      };
    });

    await toolbox.template.generate({
      template: `build-react-modules-export-${useTypescript ? 'ts' : 'js'}.ejs`,
      target: `${fullSrcDir}/index.${useTypescript ? 'ts' : 'js'}`,
      props: {
        components,
      },
    });

    spinner.succeed('Successfully builded');
  };
};
