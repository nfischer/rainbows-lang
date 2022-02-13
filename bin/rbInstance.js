var ohm = require('../src/ohm');
var inference = require('../src/inference');
var interp = require('../src/interp');
var fs = require('fs');
var path = require('path');

if (require.main === module) {
  throw new Error('This file should only be required, not itself executed');
}

// Instantiate the Ohm grammar for Rainbows
var contents = fs.readFileSync(path.resolve(__dirname, '../src/rainbows.ohm'));
var Rainbows = ohm.grammar(contents);

var s = Rainbows.createSemantics();
s.addOperation(
  'ti()',
  inference.typeInference
);
s.addOperation(
  'rb()',
  interp.rbInterp
);

module.exports.g = Rainbows;
module.exports.s = s;
