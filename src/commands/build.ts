import { GluegunToolbox } from 'gluegun';

module.exports = {
  name: 'build',
  description: 'Build all markdown files to be prepared to use on application',
  alias: ['b'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.info();

    await toolbox.build();

    process.exit();
  },
};
