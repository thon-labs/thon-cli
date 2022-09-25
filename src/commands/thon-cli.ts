import { GluegunCommand } from 'gluegun';

const command: GluegunCommand = {
  name: 'thon',
  run: async (toolbox) => {
    toolbox.info();
    toolbox.print.printHelp(toolbox);
  },
};

module.exports = command;
