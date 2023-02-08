import ConfigurationService from '../services/configuration-service';
import { GluegunToolbox } from 'gluegun';
import boxen from 'boxen';
import fs from 'fs';

module.exports = {
  name: 'init',
  description: 'Initializes the project to start documenting your components',
  alias: ['i'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.info();

    // Get root folder of project
    let { root } = toolbox.parameters.options as { root: string };

    if (!root) {
      const sourcePath = process.cwd();
      const hasSrcFolder = fs.existsSync(`${sourcePath}/src`);

      const response = await toolbox.prompt.ask({
        type: 'input',
        name: 'root',
        message: `Where you want to create the thon files? (default: "./${
          hasSrcFolder ? 'src' : ''
        }")`,
      });

      if (!response.root) {
        root = hasSrcFolder ? 'src' : '';
      } else {
        root = response.root.replace('./', '');
      }

      if (root.charAt(root.length - 1) === '/') {
        root = root.substring(0, root.length - 1);
      }
    }

    const spinner = toolbox.print.spin('Initializing...');
    await toolbox.system.run('sleep 1');

    spinner.clear();

    const useNext = ConfigurationService.projectUsingNext();

    if (useNext) {
      toolbox.print.info(
        `\nFound a nextjs.config.js file. Installing the development packages to run thon correctly.\n`,
      );

      spinner.text = 'Installing...';
      await toolbox.system.run('sleep 1');

      await toolbox.packageManager.add('raw-loader', {
        dev: true,
        dryRun: false,
      });

      spinner.succeed('Installation done');
    }

    // Generates RC File
    const useTypescript = ConfigurationService.projectUsingTypescript();

    if (useTypescript) {
      spinner.clear();

      toolbox.print.info(
        `\nFound a tsconfig file. Preparing the files to accept Typescript.`,
      );
    }

    await toolbox.template.generate({
      template: 'core-thonrc.ejs',
      target: `thon-docs.json`,
      props: {
        sourceDir: `${root != '' ? `${root}/` : ''}.thon-docs`,
        useTypescript,
      },
    });

    // Generates Initial Example Files
    const config = ConfigurationService.getConfiguration();

    await toolbox.template.generate({
      template: 'init-react-markdown.ejs',
      target: `${config.sourceDir}/components/button.md`,
    });
    await toolbox.template.generate({
      template: 'init-react-modules.ejs',
      target: `${config.sourceDir}/components/button.${config.extensions[0]}.${
        config.useTypescript ? 'tsx' : 'jsx'
      }`,
    });
    await toolbox.template.generate({
      template: 'init-react-components-metadata.ejs',
      target: `${config.sourceDir}/components/__metadata__.md`,
    });

    console.log('');
    spinner.succeed('Successfully initialized');

    await toolbox.build();

    toolbox.print.warning(
      `\nYou may need to fix some imports according the disposition of the components`,
    );

    // toolbox.print.info(
    //   `\nIt\'s possible to create new components. Use the following command:`,
    // );
    // toolbox.print.printCommands(toolbox, ['generate']);

    if (useNext) {
      toolbox.print.warning(
        `\nYou need to update the next config to run thon correctly.`,
      );

      console.log('');
      console.log(
        boxen(
          `const { withThonDocs } = require('@thonlabs/docs/plugins/next');

const nextConfig = { ... };

module.exports = withThonDocs(nextConfig);`,
          {
            title: 'next.config.js',
            padding: 1,
            borderColor: 'blue',
            borderStyle: 'bold',
          },
        ),
      );
    }

    process.exit();
  },
};
