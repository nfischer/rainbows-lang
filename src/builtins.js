// An implementation of rainbows builtins
/* eslint block-scoped-var: 0 */

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // inside node
  var tokenTypes = require('./types');
}

var builtins = {};
function define(name, memberOf, typeInfo, lambda) {
  if (memberOf) {
    // it's a member builtin
    name = '$' + memberOf + '#' + name;
  }
  builtins[name] = lambda;
  tokenTypes.builtin[name] = typeInfo;
}

define(
    'print',
    null,
    {
      type: 'fun',
      ret: 'unknown',
      name: 'print',
      args: ['unknown'],
},
    console.log.bind(console)
);

define(
    'bool',
    null,
    {
      type: 'fun',
      ret: 'bool',
      name: 'bool',
      args: ['unknown'],
},
    Boolean
);

define(
    'int',
    null,
    {
      type: 'fun',
      ret: 'int',
      name: 'int',
      args: ['unknown'],
},
    parseInt
);

define(
    'float',
    null,
    {
      type: 'fun',
      ret: 'float',
      name: 'float',
      args: ['unknown'],
},
    parseFloat
);

define(
    'string',
    null,
    {
      type: 'fun',
      ret: 'string',
      name: 'string',
      args: ['unknown'],
},
    String
);

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

//
// Methods
//
define(
    'length',
    'string',
    {
      type: 'int',
      name: 'length',
},
    function () {
      return this.length;
    }
);

define(
    'length',
    'list',
    {
      type: 'int',
      name: 'length',
},
    function () {
      return this.length;
    }
);

define(
    'join',
    'list',
    {
      type: 'fun',
      ret: 'string',
      name: 'join',
      args: [],
},
    function () {
      return this.join();
    }
);


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // inside node
  module.exports = builtins;
}
