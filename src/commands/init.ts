/*
  Configuration File Example //TODO: remove it after create the package

  {
    sourceDir: './thon',
    extension: 'thon',
    useTypescript: false,
  }
*/

import ConfigurationService from '../services/configuration-service';
import { GluegunToolbox } from 'gluegun';

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

    // Generates RC File
    const useTypescript = ConfigurationService.projectUsingTypescript();

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

    spinner.succeed('Successfully initialized');

    toolbox.print.info(
      `\nYou can create new components. Use the following command:`,
    );
    toolbox.print.printCommands(toolbox, ['generate']);
    console.log('\n');

    await toolbox.build();

    process.exit();
  },
};
