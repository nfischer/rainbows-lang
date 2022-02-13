#!/usr/bin/env node

/* globals config, set, describe, it, beforeEach, before */

'use strict';

require('shelljs/global');

// Note: to get debugging output, use test.log()

var assert = require('assert');
var ohm;
/* istanbul ignore next */
try {
  ohm = require('../src/ohm');
} catch (e) {
  console.error(e);
  console.error();
  console.error();
  console.error('******************************************');
  console.error('* Make sure you download git submodules! *');
  console.error('******************************************');
  process.exit(1);
}
var fs = require('fs');
var path = require('path');
var inference = require('../src/inference');
var tokenTypes = require('../src/types');
var interp = require('../src/interp');
var builtins = require('../src/builtins');
var ohmFile = path.join(__dirname, '..', 'lib', 'ohm', 'examples', 'ecmascript', 'es5.ohm');

set('-e');
config.silent = true;

var contents = fs.readFileSync(ohmFile);
var es5 = ohm.grammars(contents).ES5;
var s = es5.createSemantics();
s.addOperation('ti()', inference.typeInference);

s.addOperation('rb()', interp.rbInterp);

var logOutput;

function doTest(expr, type, val) {
  var m = es5.match(expr);
  assert.ok(m.succeeded());
  assert.strictEqual(s(m).ti(), type);
  if (val !== null) assert.strictEqual(s(m).rb(), val);
}

describe('rainbows', function () {
  this.timeout(3000);
  before(function () {
    builtins.print = function () {
      var args = Array(arguments.length);
      for (var _key = 0; _key < arguments.length; _key++) {
        args[_key] = arguments[_key];
      }

      logOutput = logOutput.concat(args);
    };
  });

  beforeEach(function () {
    // Refresh things
    tokenTypes.refresh(true);
    logOutput = [];
  });

  describe('int arith', function () {
    it('simple add', function (done) {
      doTest('3 + 4', 'int', 7);
      done();
    });

    it('negative int', function (done) {
      doTest('-2 + 4', 'int', 2);
      done();
    });

    it('add 0', function (done) {
      doTest('0 + 4', 'int', 4);
      done();
    });

    it('bunch of stuff', function (done) {
      doTest('0 % 4 - 5 * 6 / 8 - 5', 'int', -8);
      done();
    });
  });

  describe('float arith', function () {
    it('add', function (done) {
      doTest('3. + 4', 'float', 7);
      done();
    });

    it('bunch of stuff', function (done) {
      doTest('0 % ((4 - 5.2) + 4)', 'float', 0);
      done();
    });
  });

  describe('bool literals', function () {
    it('true', function (done) {
      doTest('true', 'bool', true);
      done();
    });
    it('false', function (done) {
      doTest('false;', 'bool', false);
      done();
    });
  });

  it('string add 1', function (done) {
    doTest('"hello" + 5', 'string', 'hello5');
    done();
  });

  it('string add 2', function (done) {
    doTest("'hello' + 5.3", 'string', 'hello5.3');
    done();
  });

  it('string assignment', function (done) {
    doTest("x = 'hello'", 'string', 'hello');
    done();
  });

  describe('dict', function () {
    it('assignment', function (done) {
      doTest('x = {}', 'dict', null);
      done();
    });

    it('literal 1 member', function (done) {
      doTest('({foo: true})', 'dict', null);
      done();
    });

    it('literal 2 members', function (done) {
      doTest('({foo: true, bar: 0})', 'dict', null);
      done();
    });
  });

  describe('assignment', function () {
    it('simple', function (done) {
      doTest('foo = 1', 'int', 1);
      done();
    });
    it('chain has value of second', function (done) {
      doTest('foo = 1; foo = 2', 'int', 2);
      done();
    });
    it('post-fix increment', function (done) {
      doTest('var foo = 1; foo++;', 'int', 1);
      done();
    });
    it('post-fix decrement', function (done) {
      doTest('var foo = 1; foo--', 'int', 1);
      done();
    });
    it('pre-fix increment', function (done) {
      doTest('var foo = 1; ++foo', 'int', 2);
      done();
    });
    it('pre-fix decrement', function (done) {
      doTest('var foo = 1; --foo', 'int', 0);
      done();
    });
  });

  it('float + int', function (done) {
    doTest('var foo = 7; 7.1 + foo', 'float', 14.1);
    done();
  });

  it('int + float', function (done) {
    doTest('var foo = 7; foo + 7.1', 'float', 14.1);
    done();
  });

  describe('list', function () {
    it('empty', function (done) {
      doTest('x = []', 'list', null);
      done();
    });
    it('values', function (done) {
      doTest('[1, 2, 3]', 'list', null);
      done();
    });
  });

  describe('function', function () {
    it('no args', function (done) {
      doTest('function foo() { return 1; }; foo()', 'int', 1);
      done();
    });
    it('int args', function (done) {
      doTest('function foo(a, b) { return 1; }; foo(1, 2)', 'int', 1);
      done();
    });
  });
  describe('while', function () {
    it('simple', function (done) {
      doTest('var a = 0;\n' +
      'while (a < 3)\n' +
      '  a++;\n' +
      'a\n', 'int', 3);
      done();
    });

    it('two vars', function (done) {
      doTest('var a = 0;\n' +
      'var b = 5;\n' +
      'while (a < 3) {\n' +
      '  a++;\n' +
      '  b--;\n' +
      '}\n' +
      'b\n', 'int', 5 - 3);
      done();
    });
  });

  it('dowhile', function (done) {
    doTest('var a = 0;\n' +
    'var b = 5;\n' +
    'do {\n' +
    '  a++;\n' +
    '  b--;\n' +
    '} while (a < 3);\n' +
    'b\n', 'int', 5 - 3);
    done();
  });

  describe('if', function () {
    it('greater than', function (done) {
      doTest('var a = 1;\n' +
      'if (a > 0) {\n' +
      '  a++;\n' +
      '}\n' +
      'a\n', 'int', 2);
      done();
    });
    it('equal', function (done) {
      doTest('var a = 0;\n' +
      'if (a == 0) {\n' +
      '  a++;\n' +
      '}\n' +
      'a\n', 'int', 1);
      done();
    });

    it('else if 1', function (done) {
      doTest('var a = 4;\n' +
      'var b = "initial";\n' +
      'if (a == 0) {\n' +
      '  b = "hi";\n' +
      '} else if (a < 4) {\n' +
      '  b = "that";\n' +
      '} else {\n' +
      '  b = "bye";\n' +
      '}\n' +
      'b\n', 'string', 'bye');
      done();
    });

    it('else if 2', function (done) {
      doTest('var a = 4;\n' +
      'var b = "initial";\n' +
      'if (a == 0) {\n' +
      '  b = "hi";\n' +
      '} else if (a <= 4) {\n' +
      '  b = "that";\n' +
      '} else {\n' +
      '  b = "bye";\n' +
      '}\n' +
      'b\n', 'string', 'that');
      done();
    });
  });

  describe('examples', function () {
    it('fib 1', function (done) {
      doTest('// Recursive fibonacci algorithm\n' +
      'function fib(n) {\n' +
      '  if (n == 0) {\n' +
      '    return 0;\n' +
      '  } else if (n == 1) {\n' +
      '    return 1;\n' +
      '  } else {\n' +
      '    return fib(n-1)+fib(n-2);\n' +
      '  }\n' +
      '}\n' +
      'var output = fib(5);\n' +
      'var msg = "hello world";\n' +
      'output\n', 'int', 5);
      done();
    });

    it('fib 2', function (done) {
      doTest('// Recursive fibonacci algorithm\n' +
      'function fib(n) {\n' +
      '  if (n == 0) {\n' +
      '    return 0;\n' +
      '  } else if (n == 1) {\n' +
      '    return 1;\n' +
      '  } else {\n' +
      '    return fib(n-1)+fib(n-2);\n' +
      '  }\n' +
      '}\n' +
      'var output = fib(2);\n' +
      'var msg = "hello world";\n' +
      'msg\n', 'string', 'hello world');
      done();
    });
    it('cache 1', function (done) {
      doTest('var cache = {};\n' +
      'cache', 'dict', null);
      done();
    });
    it('cache 2', function (done) {
      doTest('var cache = {};\n' +
      'function getLength(str) {\n' +
      '  try {\n' +
      '    return cache[str];\n' +
      '  } catch(e) {\n' +
      '    var c = 0;\n' +
      '    while (str[c] != \'\\0\')\n' +
      '      c++;\n' +
      '    cache[str] = c;\n' +
      '    return c;\n' +
      '  }\n' +
      '}\n' +
      'getLength(\'hi\')', 'int', null);
      done();
    });
  });

  describe('builtins', function () {
    it('print 1', function (done) {
      doTest('print(\'hello world\');\n' +
      'print(\'goodbye\');\n' +
      '"foo"\n', 'string', 'foo');
      assert.strictEqual(logOutput[0], 'hello world');
      assert.strictEqual(logOutput[1], 'goodbye');
      done();
    });

    it('print 2', function (done) {
      doTest('print(\'new\');\n' +
      'print(\'old\');\n' +
      '"foo"\n', 'string', 'foo');
      assert.strictEqual(logOutput[0], 'new');
      assert.strictEqual(logOutput[1], 'old');
      done();
    });

    it('string length', function (done) {
      doTest('"foobar".length', 'int', 6);
      done();
    });

    it('array length', function (done) {
      doTest('[1, 2, 3].length', 'int', 3);
      done();
    });

    describe('type conversions', function () {
      it('bool', function (done) {
        doTest('bool("some string")', 'bool', true);
        done();
      });

      it('int', function (done) {
        doTest('int(4.3)', 'int', 4);
        done();
      });

      it('float', function (done) {
        doTest('float(4)', 'float', 4.0);
        done();
      });

      it('string', function (done) {
        doTest('string(4)', 'string', '4');
        done();
      });
    });
  });
});

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
