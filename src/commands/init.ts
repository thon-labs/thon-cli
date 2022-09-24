import ConfigurationService from '../services/configuration-service';
import { GluegunToolbox } from 'gluegun';
import { execSync } from 'child_process';
import boxen from 'boxen';

module.exports = {
  name: 'init',
  alias: ['i'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.print.highlight(`Thon CLI (v0.0.0)\n`);

    // Get root folder of project
    let { root } = toolbox.parameters.options as { root: string };

    if (!root) {
      const response = await toolbox.prompt.ask({
        type: 'input',
        name: 'root',
        message: 'Where you want to create the thon files? (default: "./")',
      });

      root = response.root.replace('./', '');

      if (root.charAt(root.length - 1) === '/') {
        root = root.substring(0, root.length - 1);
      }
    }

    const spinner = toolbox.print.spin('Initializing...');
    await toolbox.system.run('sleep 1');

    console.log('');

    const useNext = ConfigurationService.projectUsingNext();

    if (useNext) {
      toolbox.print.info(
        `\nFound a nextjs.config.js file. Installing the development packages to run thon correctly.`,
      );

      const useYarn = ConfigurationService.projectUsingYarn();

      spinner.text = 'Installing...';
      await toolbox.system.run('sleep 1');

      console.log('\n');
      execSync(useYarn ? 'yarn add -D raw-loader' : 'npm i -D raw-loader');
    }

    // Generates RC File
    const useTypescript = ConfigurationService.projectUsingTypescript();

    if (useTypescript) {
      toolbox.print.info(
        `\nFound a tsconfig file. Preparing the files to accept Typescript.`,
      );
    }

    await toolbox.template.generate({
      template: 'core-thonrc.ejs',
      target: `.thonrc`,
      props: {
        sourceDir: `${root != '' ? `${root}/` : ''}.thon`,
        useTypescript,
      },
    });

    // Generates Initial Example Files
    const config = ConfigurationService.getConfiguration();

    await toolbox.template.generate({
      template: 'init-react-markdown.ejs',
      target: `${config.sourceDir}/button/button.md`,
    });
    await toolbox.template.generate({
      template: 'init-react-modules.ejs',
      target: `${config.sourceDir}/button/button.${config.extensions[0]}.${
        config.useTypescript ? 'tsx' : 'jsx'
      }`,
    });

    console.log('');
    spinner.succeed('Successfully initialized');

    console.log('');
    await toolbox.build();

    toolbox.print.warning(
      `\nYou may need to fix some imports according the disposition of the components`,
    );

    // toolbox.print.info(
    //   `\nIt\'s possible to create new components. Use the following command:`,
    // );
    // toolbox.print.printCommands(toolbox, ['generate']);

    if (useNext) {
      toolbox.print.info(
        `\nYou need to update the next config to run thon correctly.`,
      );

      console.log('');
      console.log(
        boxen(
          `const { withThon } = require('thon/build/next');

const nextConfig = { ... };

module.exports = withThon(nextConfig);`,
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
