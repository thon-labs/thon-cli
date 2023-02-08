import { GluegunToolbox } from 'gluegun';
import * as glob from 'glob';
import ConfigurationService from '../services/configuration-service';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import trim from 'lodash/trim';
import frontMatter from 'front-matter';
import * as fs from 'fs';

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
      // Replace cases like "./src/.thon-docs" -> "/src/.thon-docs"
      // since the full path not has the relative path
      const normalizedSourceDir = sourceDir.replace('./', '/');
      const splitPath = file.split(`/${normalizedSourceDir}/`);
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

    let structure = [];
    createThonDocsMetadata({ structure, fullSrcDir, toolbox });

    console.log(JSON.stringify(structure, null, 2));

    await toolbox.template.generate({
      template: `build-react-modules-export.ejs`,
      target: `${fullSrcDir}/index.${useTypescript ? 'ts' : 'js'}`,
      props: {
        components,
        structure,
      },
    });

    spinner.succeed('Successfully builded');
  };
};

function createThonDocsMetadata({ structure, fullSrcDir, toolbox }): any {
  let dirItems = fs
    .readdirSync(fullSrcDir)
    .filter((item) => item !== 'index.js' && item !== '__metadata__');

  let files = [];
  dirItems.forEach((item) => {
    const isFolder = fs.lstatSync(`${fullSrcDir}/${item}`).isDirectory();

    if (isFolder) {
      files = createThonDocsMetadata({
        structure,
        fullSrcDir: `${fullSrcDir}/${item}`,
        toolbox,
      });
    }

    if (isFolder) {
      const metadata = getMetadata({
        fileName: `${fullSrcDir}/${item}/__metadata__`,
        toolbox,
      });

      structure.push({
        ...metadata,
        title: metadata?.title ? metadata.title : item,
        slug: metadata?.slug ? metadata.slug : item,
        files,
      });
    } else if (item.endsWith('.md')) {
      const metadata = getMetadata({
        fileName: `${fullSrcDir}/${item}`,
        toolbox,
      });

      files.push({
        ...metadata,
        title: metadata?.title ? metadata.title : item.replace('.md', ''),
        slug: metadata?.slug ? metadata.slug : item.replace('.md', ''),
      });
    }
  });

  return files;
}

function getMetadata({ fileName, toolbox }) {
  try {
    const { attributes } = frontMatter<{
      title: string;
      slug: string;
    }>(
      fs.readFileSync(fileName, {
        encoding: 'utf-8',
      }),
    );
    const hasAttributes = Object.keys(attributes).length > 0;
    const allowedKeys = ['title', 'slug', 'description', 'keywords', 'ogImage'];
    const hasWrongKeys = Object.keys(attributes).some(
      (key) => !allowedKeys.includes(key),
    );

    if (hasAttributes && hasWrongKeys) {
      toolbox.print.error(
        `\n\nERROR: Wrong metadata on "${fileName}". Allowed properties are: ${allowedKeys.join(
          ', ',
        )}`,
      );
      process.exit();
    }

    return hasAttributes ? attributes : null;
  } catch {
    // Ignore error and use title from above
  }

  return null;
}
