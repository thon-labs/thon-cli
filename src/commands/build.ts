import { GluegunToolbox } from 'gluegun';

module.exports = {
  name: 'build',
  alias: ['b'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.print.highlight(`Thon CLI (v0.0.0)\n`);

    await toolbox.build();

    process.exit();
  },
};
