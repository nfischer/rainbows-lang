var rbExamples = [
{ name: 'Fibonacci',
  code:
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

var output;
output = fib(7);
`,
},
{
  name: 'All Types',
  code:
`// Take a look at what types different operations evaluate to
var a = 3 + 4;
var b = 5.2 * 7.1;
var c = 12.3 / 4;
var d = "hello" + ' goodbye';
var e = 'string' + 5;
var f = true;
var g = []; // list
var h = {}; // dict
[a, b, c, d, e, f, g, h]
`,
},
{
  name: 'Type casting',
  code:
`// See how the explicit type casting operations work
var a = 3 + 4;
var b = float(a);
var c = false;
var d = bool("foo");
var e = 5.3;
var f = string(e);
[a, b, c, d, e, f]
`,
},
{
  name: 'int division',
  code:
`// Try casting 'three' or 'four' to a float
var three = 3;
var four = 4;
three / four
`,
},
{
  name: 'getLength()',
  code:
`// This will catch if you use a list instead of a string!
var cache = {};
function getLength(str) {
  try {
    return cache[str];
  } catch(e) {
    var c = 0;
    while (str[c] != '\\0')
      c++;
    cache[str] = c;
    return c;
  }
}

//getLength(['h', 'e', 'l', 'l', 'o']);
getLength("hello world");
`,
},
{
  name: 'property inference',
  code:
`var foo = {bar: 72, baz: "hi"};
var shouldBeInt = foo.bar;
var shouldBeStr = foo.baz;
var myInt = foo['bar'];
myInt / 5
`,
},
];
