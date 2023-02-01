import { GluegunToolbox } from 'gluegun';
import ConfigurationService from '../services/configuration-service';
import glob from 'glob';
import ApiService from '../services/api-service';
import * as fs from 'fs';
import frontMatter from 'front-matter';

module.exports = {
  name: 'deploy',
  description: 'Deploy all the document sources and groups from .thon folder',
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

    try {
      await ApiService.createDocumentSourcesAndGroups(payload, params);
    } catch (e) {
      toolbox.print.error(`\n\nERROR: ${e.response.data.error}`);
      process.exit();
    }

    spinner.succeed(`Successfully deployed`);

    process.exit();
  },
};

function createDocumentSourcesPayload({ payload, fullSrcDir, toolbox }): any {
  let dirItems = fs
    .readdirSync(fullSrcDir)
    .filter((item) => item !== 'index.js' && item !== '__metadata__');

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
      const metadata = getMetadata({
        fileName: `${fullSrcDir}/${item}/__metadata__`,
        toolbox,
      });

      payload.push({
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
    const allowedKeys = ['title', 'slug'];
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
