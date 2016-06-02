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

function doTest(expr, type, val, setup) {
  tokenTypes.refresh(true);
  if (setup)
    setup();
  var m = es5.match(expr);
  assert.ok(m.succeeded());
  assert.strictEqual(s(m).ti(), type);
  if (val !== null)
    assert.strictEqual(s(m).rb(), val);
}


//
// Valids
//

doTest('3 + 4', 'int', 7);
doTest('-2 + 4', 'int', 2);

doTest('0 + 4', 'int', 4);

doTest('0 % 4 - 5 * 6 / 8 - 5', 'int', -8);

doTest('3. + 4', 'float', 7);

doTest('0 % ((4 - 5.2) + 4)', 'float', 0);

doTest('true', 'bool', true);

doTest('false;', 'bool', false);

// m = es5.match('"hello";');
// assert.strictEqual(s(m).ti(), 'string');

doTest('"hello" + 5', 'string', 'hello5');

doTest("'hello' + 5.3", 'string', 'hello5.3');

doTest("x = 'hello'", 'string', 'hello');

doTest("x = {}", 'dict', null);

doTest("({foo: true})", 'dict', null);

m = es5.match("({foo: true, bar: 0})");
assert.strictEqual(s(m).ti(), 'dict');

m = es5.match("({foo: true, bar: 0,})");
assert.strictEqual(s(m).ti(), 'dict');

tokenTypes.setVal('foo', 'int');
doTest("foo = 1", 'int', 1);
doTest("foo = 1; foo = 2", 'int', 2);
// tokenTypes.setVal('foo', 'int');
// doTest("foo = 1; foo++", 'int', 1);
// tokenTypes.setVal('foo', 'int');
// doTest("foo = 1; foo--", 'int', 1);
// tokenTypes.setVal('foo', 'int');
// doTest("foo = 1; ++foo", 'int', 2);
// tokenTypes.setVal('foo', 'int');

doTest("foo + 7", 'int', null, () => {tokenTypes.setVal('foo', 'int'); });

tokenTypes.setVal('foo', 'int');
doTest("foo + 7.3", 'float', null);

tokenTypes.setVal('foo', 'int');
doTest("7.1 + foo", 'float', null);

tokenTypes.setVal('foo', 'fun');
tokenTypes.setVal('foo', 'int');
m = es5.match("foo()");
assert.strictEqual(s(m).ti(), 'int');

tokenTypes.setVal('foo', 'fun');
tokenTypes.setVal('foo', 'int');
m = es5.match("foo(12, 'hi')");
assert.strictEqual(s(m).ti(), 'int');

doTest("x = []", 'list', null);
doTest("[1, 2, 3]", 'list', null);

doTest(
`var a = 0;
while (a < 3)
  a++;
a`, 'int', 3);

doTest(
`var a = 0;
var b = 5;
while (a < 3) {
  a++;
  b--;
}
b`, 'int', 5-3);

doTest(
`var a = 0;
var b = 5;
do {
  a++;
  b--;
} while (a < 3);
b`, 'int', 5-3);

doTest(
`var a = 1;
if (a > 0) {
  a++;
}
a`, 'int', 2);

doTest(
`var a = 0;
if (a == 0) {
  a++;
}
a`, 'int', 1);

doTest(
`var a = 4;
var b = "initial";
if (a == 0) {
  b = "hi";
} else if (a < 4) {
  b = "that";
} else {
  b = "bye";
}
b`, 'string', 'bye');

doTest(
`var a = 4;
var b = "initial";
if (a == 0) {
  b = "hi";
} else if (a <= 4) {
  b = "that";
} else {
  b = "bye";
}
b`, 'string', 'that');

doTest(
`// Recursive fibonacci algorithm
function fib(n) {
  if (n == 0) {
    return 0;
  } else if (n == 1) {
    return 1;
  } else {
    return fib(n-1)+fib(n-2);
  }
}
var output = fib(12);
var msg = "hello world";
output`, 'int', null);

doTest(
`// Recursive fibonacci algorithm
function fib(n) {
  if (n == 0) {
    return 0;
  } else if (n == 1) {
    return 1;
  } else {
    return fib(n-1)+fib(n-2);
  }
}
var output = fib(12);
var msg = "hello world";
msg`, 'string', null);

doTest(
`
var cache = {};
cache`, 'dict', null);

doTest(
`
var cache = {};
function getLength(str) {
  try {
    return cache[str];
  } catch(e) {
    var c = 0;
    while (str[c] != '\0')
      c++;
    cache[str] = c;
    return c;
  }
}
getLength('hi')`, 'int', null);

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
