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
        '\nNo file has been found. Check the "extensions" on configuration file.',
      );
      process.exit();
    }

    spinner.clear();

    toolbox.print.info(
      `\nFound ${files.length} file${
        files.length > 1 ? 's' : ''
      } with allowed extensions: ${extensions.join(', ')}\n`,
    );

    await toolbox.system.run('sleep 1');

    const components = files.map((file) => {
      const splitPath = file.split(`/${sourceDir}/`);
      const folderAndFile = splitPath[splitPath.length - 1];
      const [relativePath] = folderAndFile.split(useTypescript ? '.ts' : '.js');
      const relativePathSplit = folderAndFile.split('/');
      const fileName = relativePathSplit[relativePathSplit.length - 1];
      let componentName = null;
      let markdownPath = null;

      for (let i = 0; i < extensions.length; i++) {
        const fileNameSplit = fileName.split(`.${extensions[i]}.`);

        if (fileNameSplit.length > 1) {
          componentName = pipe(camelCase, upperFirst, trim)(fileNameSplit[0]);
          markdownPath = relativePath.replace(`.${extensions[i]}`, '.md');
          break;
        }
      }

      return {
        componentName,
        relativePath,
        markdownPath,
      };
    });

    await toolbox.template.generate({
      template: `build-react-modules-export.ejs`,
      target: `${fullSrcDir}/index.${useTypescript ? 'ts' : 'js'}`,
      props: {
        components,
      },
    });

    spinner.succeed('Successfully builded');
  };
};
