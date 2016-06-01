#!/usr/bin/env node

'use strict';

var assert = require('assert');
var ohm = require('../lib/ohm/dist/ohm');
var fs = require('fs');
var path = require('path');
var inference = require('../src/inference');
var tokenTypes = require('../src/types');
var interp = require('../src/interp');
require('shelljs/global');
var ohmFile = path.join(__dirname, '..', 'lib', 'ohm', 'examples', 'ecmascript', 'es5.ohm');

set('-e');
config.silent = true;

var contents = fs.readFileSync(ohmFile);
var es5 = ohm.grammars(contents).ES5;
var s = es5.semantics();
s.addOperation(
  'ti()',
  inference.typeInference);

s.addOperation(
  'rb()',
  interp.rbInterp);

var m;

//
// Valids
//

m = es5.match('3 + 4');
assert.strictEqual(s(m).ti(), 'int');
assert.strictEqual(s(m).rb(), 7);

m = es5.match('-2 + 4');
assert.strictEqual(s(m).ti(), 'int');
assert.strictEqual(s(m).rb(), 2);

m = es5.match('0 + 4');
assert.strictEqual(s(m).ti(), 'int');
assert.strictEqual(s(m).rb(), 4);

m = es5.match('0 % 4 - 5 * 6 / 8 - 5');
assert.strictEqual(s(m).ti(), 'int');

m = es5.match('3. + 4');
assert.strictEqual(s(m).ti(), 'float');
assert.strictEqual(s(m).rb(), 7);

m = es5.match('0 % ((4 - 5.2) * 6) / 8 - 5;');
assert.strictEqual(s(m).ti(), 'float');

m = es5.match('true');
assert.strictEqual(s(m).ti(), 'bool');
assert.strictEqual(s(m).rb(), true);

m = es5.match('false;');
assert.strictEqual(s(m).ti(), 'bool');
assert.strictEqual(s(m).rb(), false);

// m = es5.match('"hello";');
// assert.strictEqual(s(m).ti(), 'string');

m = es5.match('"hello" + 5');
assert.strictEqual(s(m).ti(), 'string');

m = es5.match("'hello' + 5.3");
assert.strictEqual(s(m).ti(), 'string');

m = es5.match("x = 'hello'");
assert.strictEqual(s(m).ti(), 'string');
assert.strictEqual(s(m).rb(), 'hello');

m = es5.match("x = {}");
assert.strictEqual(s(m).ti(), 'dict');

m = es5.match("({foo: true})");
assert.strictEqual(s(m).ti(), 'dict');

m = es5.match("({foo: true, bar: 0})");
assert.strictEqual(s(m).ti(), 'dict');

m = es5.match("({foo: true, bar: 0,})");
assert.strictEqual(s(m).ti(), 'dict');

tokenTypes.setVal('foo', 'int');
m = es5.match("foo");
assert.strictEqual(s(m).ti(), 'int');

tokenTypes.setVal('foo', 'int');
m = es5.match("foo + 7");
assert.strictEqual(s(m).ti(), 'int');

tokenTypes.setVal('foo', 'int');
m = es5.match("foo + 7.3");
assert.strictEqual(s(m).ti(), 'float');

tokenTypes.setVal('foo', 'int');
m = es5.match("7.1 + foo");
assert.strictEqual(s(m).ti(), 'float');

tokenTypes.setVal('foo', 'fun');
tokenTypes.setVal('foo', 'int');
m = es5.match("foo()");
assert.strictEqual(s(m).ti(), 'int');

tokenTypes.setVal('foo', 'fun');
tokenTypes.setVal('foo', 'int');
m = es5.match("foo(12, 'hi')");
assert.strictEqual(s(m).ti(), 'int');

m = es5.match("x = []");
assert.strictEqual(s(m).ti(), 'list');

m = es5.match("[1, 2, 3]");
assert.strictEqual(s(m).ti(), 'list');

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
//     assert.strictEqual(s(m).ti(), cat(ls('*.js')[0]));
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
