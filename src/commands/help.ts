import { GluegunToolbox } from 'gluegun';

module.exports = {
  name: 'help',
  description: 'Get all information about the existence commands',
  alias: ['h'],
  run: async (toolbox: GluegunToolbox) => {
    toolbox.info();
    toolbox.print.printHelp(toolbox);
  },
};
