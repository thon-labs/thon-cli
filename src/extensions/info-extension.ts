import { GluegunToolbox } from 'gluegun';

const { version } = require('../../package.json');

module.exports = (toolbox: GluegunToolbox) => {
  toolbox.info = async () => {
    toolbox.print.highlight(`Thon CLI (v${version})`);
  };
};
