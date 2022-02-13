#!/usr/bin/env node
var shell = require('shelljs');
var colors = require('colors/safe');
var tokenTypes = require('../src/types');
var rbInstance = require('./rbInstance');
var fs = require('fs');

if (require.main !== module) {
  throw new Error('This file should not be required');
}

var fileName = process.argv[2];
if (!fileName) {
  console.error('Must specify a file');
  shell.exit(1);
}

// Parse the script file and begin type inference
var script = shell.cat(fileName).toString();

// Load in the specified types
tokenTypes.load(JSON.parse(fs.readFileSync(fileName + 't'))); // load JSON

var typeMap = {
  'string': colors.red.bold,
  'int': colors.blue.bold,
  'float': colors.yellow.bold,
  'bool': colors.white.bold,
  'list': colors.green.bold,
  'dict': colors.magenta.bold,
};

// Parse and infer types
try {
  var m = rbInstance.g.match(script);
  if (m.succeeded()) {
    var returnType = tokenTypes.result || 'unknown';
    if (returnType) {
      var result = rbInstance.s(m).rb();
      console.log((typeof typeMap[returnType] === 'function') &&
                  typeMap[returnType](result));
    }
  } else {
    console.error(m.message);
  }
} catch (e) {
  console.error(e);
}
