// This is a thin wrapper over the ohm submodule so that we can throw an error
// if the submodule is missing.
var colors = require('colors/safe');
try {
  module.exports = require('../lib/ohm/dist/ohm');
} catch (e) {
  console.error(colors.bold.red(
      'Cannot find lib/ohm/dist/ohm; did you forget to pull submodules?\n'
  ));
  console.error(colors.bold.yellow(
      '  git submodule update --init --recursive\n'
  ));
  process.exit(1);
}
