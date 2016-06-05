#!/usr/bin/env node
var shell = require('shelljs');
var tokenTypes = require('../src/types');
var rbInstance = require('./rbInstance');
var fs = require('fs');

var fileName = process.argv[2];
if (!fileName) {
  console.error('Must specify a file');
  shell.exit(1);
}

// Parse the script file and begin type inference
var script = shell.cat(fileName).toString();

// Load in the specified types
tokenTypes.load(JSON.parse(fs.readFileSync(fileName + 't'))); // load JSON
tokenTypes.refresh(); // keep `.selected` values

// Parse and infer types
try {
  var m = rbInstance.g.match(script);
  if (m.succeeded()) {
    var returnType = rbInstance.s(m).ti();
    if (returnType) {
      tokenTypes.result = returnType;
      shell.ShellString(tokenTypes.serialize()).to(fileName + 't');
    }
  } else {
    console.error(m.message);
  }
} catch (e) {
  console.error(e.toString());
}
