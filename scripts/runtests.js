#!/usr/bin/env node

'use strict';

var assert = require('assert');
var ohm = require('../lib/ohm/dist/ohm');
var fs = require('fs');
var path = require('path');
var semantics = require('../src/semantics');
require('shelljs/global');
var ohmFile = path.join(__dirname, '..', 'lib', 'ohm', 'examples', 'ecmascript', 'es5.ohm');

set('-e');
config.silent = true;

var contents = fs.readFileSync(ohmFile);
var es5 = ohm.grammars(contents).ES5;
var s = es5.semantics();
s.addOperation(
  'ti()',
  semantics.typeInference);

s.addOperation(
  'rb()',
  semantics.rbInterp);

var m;

global.getEnv = function(x) {
  var g = global.env[x] || {};
  return g.ret || g.type || g;
}

global.setEnv = function(token, value) {
  if (env[token] && env[token].type === 'fun')
    env[token].ret = value;
  else {
    env[token] = {
      type: value,
    };
  }
}

//
// Valids
//

m = es5.match('3 + 4');
assert.equal(s(m).ti(), 'int');
assert.equal(s(m).rb(), '7');

m = es5.match('-2 + 4');
assert.equal(s(m).ti(), 'int');
assert.equal(s(m).rb(), 2);

m = es5.match('0 + 4');
assert.equal(s(m).ti(), 'int');
assert.equal(s(m).rb(), 4);

m = es5.match('0 % 4 - 5 * 6 / 8 - 5');
assert.equal(s(m).ti(), 'int');

m = es5.match('3. + 4');
assert.equal(s(m).ti(), 'float');
assert.equal(s(m).rb(), '7');

m = es5.match('0 % ((4 - 5.2) * 6) / 8 - 5;');
assert.equal(s(m).ti(), 'float');

m = es5.match('true');
assert.equal(s(m).ti(), 'bool');
assert.equal(s(m).rb(), 'true');

m = es5.match('false;');
assert.equal(s(m).ti(), 'bool');
assert.equal(s(m).rb(), 'false');

// m = es5.match('"hello";');
// assert.equal(s(m).ti(), 'string');

m = es5.match('"hello" + 5');
assert.equal(s(m).ti(), 'string');

m = es5.match("'hello' + 5.3");
assert.equal(s(m).ti(), 'string');

m = es5.match("x = 'hello'");
assert.equal(s(m).ti(), 'string');
assert.equal(s(m).rb(), 'hello');

m = es5.match("x = {}");
assert.equal(s(m).ti(), 'dict');

m = es5.match("({foo: true})");
assert.equal(s(m).ti(), 'dict');

m = es5.match("({foo: true, bar: 0})");
assert.equal(s(m).ti(), 'dict');

m = es5.match("({foo: true, bar: 0,})");
assert.equal(s(m).ti(), 'dict');

global.env = { 'foo': { type: 'int' } };
m = es5.match("foo");
assert.equal(s(m).ti(), 'int');

global.env = { 'foo': { type: 'int' } };
m = es5.match("foo + 7");
assert.equal(s(m).ti(), 'int');

global.env = { 'foo': { type: 'int' } };
m = es5.match("foo + 7.3");
assert.equal(s(m).ti(), 'float');

global.env = { 'foo': { type: 'int' } };
m = es5.match("7.1 + foo");
assert.equal(s(m).ti(), 'float');

global.env = {
  'foo': {
    ret: 'int',
    type: 'fun',
    args: [],
  },
};
m = es5.match("foo()");
assert.equal(s(m).ti(), 'int');

global.env = {
  'foo': {
    ret: 'int',
    type: 'fun',
    args: ['int', 'string'],
  },
};
m = es5.match("foo(12, 'hi')");
assert.equal(s(m).ti(), 'int');

m = es5.match("x = []");
assert.equal(s(m).ti(), 'list');

m = es5.match("[1, 2, 3]");
assert.equal(s(m).ti(), 'list');

// set('+e');
// var retStatus = 0;
// cd(path.join(__dirname, '..', 'test'));
// ls().forEach(function (test) {
//   cd(test);
//   if (error())
//     echo(test + 'is not a directory');
//   try {
//     m = es5.match(cat(ls('*.sh')[0]).toString());
//     assert.ok(m.succeeded());
//     assert.equal(s(m).ti(), cat(ls('*.js')[0]));
//   } catch (e) {
//     retStatus = 1;
//     echo('test ' + JSON.stringify(test) + ' failed');
//     echo('actual:   ' + JSON.stringify(e.actual));
//     echo('expected: ' + JSON.stringify(e.expected));
//   }
//   cd('-');
// });

// config.silent = false;

// if (retStatus === 0)
//   echo('All tests passed!');
// else
//   echo('\nSome tests failed');

// exit(retStatus);
