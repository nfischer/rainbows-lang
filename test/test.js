#!/usr/bin/env node
/* globals config, set, describe, it, beforeEach, before */
'use strict';

require('shelljs/global');

// Note: to get debugging output, use test.log()

var assert = require('assert');
var ohm = require('../lib/ohm/dist/ohm');
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
var s = es5.semantics();
s.addOperation(
  'ti()',
  inference.typeInference);

s.addOperation(
  'rb()',
  interp.rbInterp);

let logOutput;

function doTest(expr, type, val, setup) {
  if (setup)
    setup();
  var m = es5.match(expr);
  assert.ok(m.succeeded());
  assert.strictEqual(s(m).ti(), type);
  if (val !== null)
    assert.strictEqual(s(m).rb(), val);
}

describe('rainbows', () => {
  before(() => {
    builtins.print = function(...args) {
      logOutput = logOutput.concat(args);
    };
  });

  beforeEach(() => {
    // Refresh things
    tokenTypes.refresh(true);
    logOutput = [];
  });

  describe('int arith', () => {
    it('simple add', (done) => {
      doTest('3 + 4', 'int', 7);
      done();
    });

    it('negative int', (done) => {
      doTest('-2 + 4', 'int', 2);
      done();
    });

    it('add 0', (done) => {
      doTest('0 + 4', 'int', 4);
      done();
    });

    it('bunch of stuff', (done) => {
      doTest('0 % 4 - 5 * 6 / 8 - 5', 'int', -8);
      done();
    });
  });

  describe('float arith', () => {
    it('add', (done) => {
      doTest('3. + 4', 'float', 7);
      done();
    });

    it('bunch of stuff', (done) => {
      doTest('0 % ((4 - 5.2) + 4)', 'float', 0);
      done();
    });
  });

  describe('bool literals', () => {
    it('true', (done) => {
      doTest('true', 'bool', true);
      done();
    });
    it('false', (done) => {
      doTest('false;', 'bool', false);
      done();
    });
  });

  it('string add 1', (done) => {
    doTest('"hello" + 5', 'string', 'hello5');
    done();
  });

  it('string add 2', (done) => {
    doTest("'hello' + 5.3", 'string', 'hello5.3');
    done();
  });

  it('string assignment', (done) => {
    doTest("x = 'hello'", 'string', 'hello');
    done();
  });

  describe('dict', () => {
    it('assignment', (done) => {
      doTest("x = {}", 'dict', null);
      done();
    });

    it('literal 1 member', (done) => {
      doTest("({foo: true})", 'dict', null);
      done();
    });

    it('literal 2 members', (done) => {
      doTest("({foo: true, bar: 0})", 'dict', null);
      done();
    });
  });

  describe('assignment', () => {
    it('simple', (done) => {
      doTest("foo = 1", 'int', 1);
      done();
    });
    it('chain has value of second', (done) => {
      doTest("foo = 1; foo = 2", 'int', 2);
      done();
    });
    it('post-fix increment', (done) => {
      doTest("var foo = 1; foo++;", 'int', 1);
      done();
    });
    it('post-fix decrement', (done) => {
      doTest("var foo = 1; foo--", 'int', 1);
      done();
    });
    it('pre-fix increment', (done) => {
      doTest("var foo = 1; ++foo", 'int', 2);
      done();
    });
    it('pre-fix decrement', (done) => {
      doTest("var foo = 1; --foo", 'int', 0);
      done();
    });
  });

  it('float + int', (done) => {
    doTest("var foo = 7; 7.1 + foo", 'float', 14.1);
    done();
  });

  it('int + float', (done) => {
    doTest("var foo = 7; foo + 7.1", 'float', 14.1);
    done();
  });

  describe('list', () => {
    it('empty', (done) => {
      doTest("x = []", 'list', null);
      done();
    });
    it('values', (done) => {
      doTest("[1, 2, 3]", 'list', null);
      done();
    });
  });

  describe('function', () => {
    it('no args', (done) => {
      doTest(`function foo() { return 1; }; foo()`, 'int', 1);
      done();
    });
    it('int args', (done) => {
      doTest(`function foo(a, b) { return 1; }; foo(1, 2)`, 'int', 1);
      done();
    });
  });
  describe('while', () => {
    it('simple', (done) => {
      doTest(
      `var a = 0;
      while (a < 3)
        a++;
      a`, 'int', 3);
      done();
    });

    it('two vars', (done) => {
      doTest(
      `var a = 0;
      var b = 5;
      while (a < 3) {
        a++;
        b--;
      }
      b`, 'int', 5-3);
      done();
    });
  });

  it('dowhile', (done) => {
    doTest(
    `var a = 0;
    var b = 5;
    do {
      a++;
      b--;
    } while (a < 3);
    b`, 'int', 5-3);
    done();
  });

  describe('if', () => {
    it('greater than', (done) => {
      doTest(
      `var a = 1;
      if (a > 0) {
        a++;
      }
      a`, 'int', 2);
      done();
    });
    it('equal', (done) => {
      doTest(
      `var a = 0;
      if (a == 0) {
        a++;
      }
      a`, 'int', 1);
      done();
    });

    it('else if 1', (done) => {
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
      done();
    });

    it('else if 2', (done) => {
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
      done();
    });
  });

  describe('examples', () => {
    it('fib 1', (done) => {
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
      var output = fib(5);
      var msg = "hello world";
      output`, 'int', 5);
      done();
    });

    it('fib 2', (done) => {
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
      var output = fib(2);
      var msg = "hello world";
      msg`, 'string', 'hello world');
      done();
    });
    it('cache 1', (done) => {
      doTest(
      `
      var cache = {};
      cache`, 'dict', null);
      done();
    });
    it('cache 2', (done) => {
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
      done();
    });
  });

  describe('builtins', () => {
    it('print 1', (done) => {
      doTest(
      `print('hello world');
      print('goodbye');
      "foo"`, 'string', 'foo');
      assert.strictEqual(logOutput[0], 'hello world');
      assert.strictEqual(logOutput[1], 'goodbye');
      done();
    });

    it('print 2', (done) => {
      doTest(
      `print('new');
      print('old');
      "foo"`, 'string', 'foo');
      assert.strictEqual(logOutput[0], 'new');
      assert.strictEqual(logOutput[1], 'old');
      done();
    });

    it('string length', (done) => {
      doTest(
      `"foobar".length`, 'int', 6);
      done();
    });

    it('array length', (done) => {
      doTest(
      `[1, 2, 3].length`, 'int', 3);
      done();
    });

    describe('type conversions', () => {
      it('bool', (done) => {
        doTest(
        `bool("some string")`, 'bool', true);
        done();
      });

      it('int', (done) => {
        doTest(
        `int(4.3)`, 'int', 4);
        done();
      });

      it('float', (done) => {
        doTest(
        `float(4)`, 'float', 4.0);
        done();
      });

      it('string', (done) => {
        doTest(
        `string(4)`, 'string', '4');
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
