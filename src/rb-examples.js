/* jshint unused: false */
/* eslint no-unused-vars: 0 */
var rbExamples = [
{
  name: 'Fibonacci',
  code:
'// Recursive fibonacci algorithm\n' +
'function fib(n) {\n' +
'  if (n == 0) {\n' +
'    return 0;\n' +
'  } else if (n == 1) {\n' +
'    return 1;\n' +
'  } else {\n' +
'    return fib(n-1)+fib(n-2);\n' +
'  }\n' +
'}\n' +
'\n' +
'var output;\n' +
'output = fib(7);\n',
},
{
  name: 'All Types',
  code:
'// Take a look at what types different operations evaluate to\n' +
'var a = 3 + 4;\n' +
'var b = 5.2 * 7.1;\n' +
'var c = 12.3 / 4;\n' +
'var d = "hello" + \' goodbye\';\n' +
'var e = \'string\' + 5;\n' +
'var f = true;\n' +
'var g = []; // list\n' +
'var h = {}; // dict\n' +
'[a, b, c, d, e, f, g, h]\n',
},
{
  name: 'Type casting',
  code:
'// See how the explicit type casting operations work\n' +
'var a = 3 + 4;\n' +
'var b = float(a);\n' +
'var c = false;\n' +
'var d = bool("foo");\n' +
'var e = 5.3;\n' +
'var f = string(e);\n' +
'[a, b, c, d, e, f]\n',
},
{
  name: 'int division',
  code:
'// Try casting \'three\' or \'four\' to a float\n' +
'var three = 3;\n' +
'var four = 4;\n' +
'three / four\n',
},
{
  name: 'getLength()',
  code:
'// This will catch if you use a list instead of a string!\n' +
'var cache = {};\n' +
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
'\n' +
'//getLength([\'h\', \'e\', \'l\', \'l\', \'o\']);\n' +
'getLength("hello world");\n',
},
{
  name: 'property inference',
  code:
'var foo = {bar: 72, baz: "hi"};\n' +
'var shouldBeInt = foo.bar;\n' +
'var shouldBeStr = foo.baz;\n' +
'var myInt = foo[\'bar\'];\n' +
'myInt / 5\n',
},
];
