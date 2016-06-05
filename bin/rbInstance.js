#!/usr/bin/env node
var shell = require('shelljs');
var ohm = require('../lib/ohm/dist/ohm');
var tokenTypes = require('../src/types');
var inference = require('../src/inference');
var interp = require('../src/interp');
var fs = require('fs');
var path = require('path');

// Instantiate the Ohm grammar for Rainbows
var contents = fs.readFileSync(path.resolve(__dirname, '../src/rainbows.ohm'));
var Rainbows = ohm.grammar(contents);

var s = Rainbows.semantics();
s.addOperation(
  'ti()',
  inference.typeInference);
s.addOperation(
  'rb()',
  interp.rbInterp);

module.exports.g = Rainbows;
module.exports.s = s;
