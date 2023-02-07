import * as fs from 'fs';
import glob from 'glob';
import { GluegunToolbox } from 'gluegun';

export type ConfigurationFile = {
  sourceDir: string;
  extensions: string[];
  useTypescript: boolean;
};

const ALLOWED_FILES = ['.thonrc', 'thonrc.json', 'thon.config.js'];

const defaultConfiguration: ConfigurationFile = {
  sourceDir: './thon',
  extensions: ['thon'],
  useTypescript: false,
};

function getConfiguration(): ConfigurationFile {
  let configFile = {} as ConfigurationFile;
  const sourcePath = process.cwd();

  for (let i = 0; i < ALLOWED_FILES.length; i++) {
    const path = `${sourcePath}/${ALLOWED_FILES[i]}`;
    const fileExists = fs.existsSync(path);

    if (fileExists) {
      const file = fs.readFileSync(path, 'utf-8');
      configFile = JSON.parse(file);
      break;
    }
  }

  if (!configFile) {
    console.log('\n');
    throw new Error('Configuration file not found.');
  }

  return { ...defaultConfiguration, ...configFile };
}

function checkSourceExistence(toolbox: GluegunToolbox): void {
  const config = getConfiguration();
  const sourcePath = process.cwd();
  const sourcePathExists = fs.existsSync(`${sourcePath}/${config.sourceDir}`);

  if (!sourcePathExists) {
    toolbox.print.error(
      '\nERROR: The source directory was not found. Check the "sourceDir" on configuration file.',
    );
    process.exit();
  }
}

function checkExtensionsExistence(toolbox: GluegunToolbox): void {
  const config = getConfiguration();

  if (!config.extensions || config.extensions?.length === 0) {
    toolbox.print.error(
      '\nERROR: You must set extensions for build files. Check the "extensions" on configuration file.',
    );
    process.exit();
  }
}

function getFullSourceDir(): string {
  const { sourceDir } = getConfiguration();
  const sourcePath = process.cwd();

  return `${sourcePath}/${sourceDir}`;
}

function projectUsingTypescript() {
  const basePath = `${process.cwd()}/{,!(node_modules)/**/}`;

  let files = glob.sync(`${basePath}/tsconfig.json`);

  // For monorepos and other projects that use base configs
  if (files.length == 0) {
    files = glob.sync(`${basePath}/tsconfig.*.json`);
  }

  return files.length > 0;
}

function projectUsingNext() {
  const basePath = `${process.cwd()}/{,!(node_modules)/**/}`;

  let files = glob.sync(`${basePath}/next.config.js`);

  return files.length > 0;
}

function projectUsingYarn() {
  const basePath = `${process.cwd()}/{,!(node_modules)/**/}`;

  let files = glob.sync(`${basePath}/yarn.lock`);

  return files.length > 0;
}

function getKeys(params) {
  return {
    appId: params.appId || process.env.THON_LABS_APP_ID,
    clientId: params.clientId || process.env.THON_LABS_CLIENT_ID,
    secretKey: params.secretKey || process.env.THON_LABS_SECRET_KEY,
  };
}

function checkKeysExistence(params, toolbox) {
  const { appId, clientId, secretKey } = getKeys(params);

  if (toolbox && (!appId || !clientId || !secretKey)) {
    toolbox.print.error('ERROR: Missing access configuration keys.');
    process.exit();
  }
}

const ConfigurationService = {
  getConfiguration,
  checkSourceExistence,
  checkExtensionsExistence,
  getFullSourceDir,
  projectUsingTypescript,
  projectUsingNext,
  projectUsingYarn,
  getKeys,
  checkKeysExistence,
};

export default ConfigurationService;
