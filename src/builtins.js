// An implementation of rainbows builtins

var isNode = false;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // inside node
  isNode = true;
  var tokenTypes = require('./types');
}

var builtins = {}
function define(name, memberOf, typeInfo, lambda) {
  if (memberOf) {
    // it's a member builtin
    name = '$' + memberOf + '#' + name;
  }
  builtins[name] = lambda;
  tokenTypes.builtin[name] = typeInfo;
}

define('length',
    'string',
    { type: 'int',
      name: 'length', },
    function() {
      return this.length;
    });

define('length',
    'list',
    { type: 'int',
      name: 'length', },
    function() {
      return this.length;
    });

define('print',
    null,
    { type: 'fun',
      ret: 'unknown',
      name: 'print',
      args: ['unknown'] },
    console.log.bind(console));

// define('raw_input',
//     { type: 'fun',
//       ret: 'string',
//       name: 'raw_input',
//       args: [ 'string' ] },
//     ((typeof readline === 'function' ? readline : console.log));

  // builtin: {
  //   range:     { type: 'list' },
  //   'mylist#join':  { type: 'fun',
  //                ret: 'string',
  //                args: [] },
  // },



if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // inside node
  module.exports = builtins;
}
