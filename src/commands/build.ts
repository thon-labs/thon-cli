import { GluegunToolbox } from 'gluegun';
import chokidar from 'chokidar';
import ConfigurationService from '../services/configuration-service';

type Params = {
  watch: boolean;
};

module.exports = {
  name: 'build',
  description: 'Build all markdown files to be prepared to use on application',
  alias: ['b'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.info();

    let { watch } = toolbox.parameters.options as Params;

    if (watch) {
      const { fullSourceDir } = ConfigurationService.getConfiguration();

      await toolbox.build();
      toolbox.print.info('\nWaiting for changes...');

      chokidar
        .watch(fullSourceDir, {
          ignored: /^.*\.[tj]s?$/,
          ignoreInitial: true,
        })
        .on('all', async () => {
          await toolbox.build();
          toolbox.print.info('\nWaiting for changes...');
        });
    } else {
      await toolbox.build();
      process.exit();
    }
  },
};
