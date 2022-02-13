'use strict';

/* jshint unused:false*/
/* eslint no-unused-vars: 0, block-scoped-var: 0 */

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    var arr2 = Array(arr.length);
    for (var i = 0; i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}

/* jshint unused: false */
/* jshint evil: true */
var rbInterp;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  var tokenTypes = require('./types');
  var builtins = require('./builtins');
}

(function () {
  function RuntimeError(message) {
    this.name = 'RuntimeError';
    this.message = message || '';
    this.stack = new Error().stack;
  }
  RuntimeError.prototype = Object.create(Error.prototype);
  RuntimeError.prototype.constructor = RuntimeError;

  var env;
  function cast(type, value) {
    if (type === 'string') {
      return value.toString();
    } else if (type === 'int') {
      return parseInt(value, 10);
    } else if (type === 'float') {
      return parseFloat(value);
    }
    return value;
  }
  function truthy(cond) {
    if (typeof cond !== 'boolean') throw new RuntimeError('Condition must be of type `bool`');
    return cond;
  }
  function arithHelper(x, y) {
    var a = x.ti();
    var b = y.ti();
    if (a === 'dict' || b === 'dict') throw new RuntimeError('cannot add dicts');
    if (a === 'list' || b === 'list') throw new RuntimeError('cannot add lists');
    var ret;
    ['string', 'float', 'int'].forEach(function (type) {
      if (ret) return;
      if (a === type || b === type) ret = type;
    });
    return ret || 'unknown';
  }
  var idRegex = /[a-zA-Z_][a-zA-Z0-9_]*/;
  rbInterp = {
    Program: function (x, y) {
      env = {}; // clear it out
      var lines = y.rb(); return lines[lines.length - 1];
    },
    SourceElement: function (x) {
      return x.rb();
    },
    ExpressionStatement: function (x, y) {
      return x.rb();
    },
    Expression: function (x) {
      return x.rb();
    },
    EqualityExpression_equal: function (x, y, z) {
      return x.rb() === z.rb();
    },
    EqualityExpression_notEqual: function (x, y, z) {
      return x.rb() !== z.rb();
    },
    EqualityExpression_eq: function (x, y, z) {
      return x.rb() === z.rb();
    },
    EqualityExpression_notEq: function (x, y, z) {
      return x.rb() !== z.rb();
    },
    RelationalExpression_lt: function (a, b, c) {
      return a.rb() < c.rb();
    },
    RelationalExpression_gt: function (a, b, c) {
      return a.rb() > c.rb();
    },
    RelationalExpression_le: function (a, b, c) {
      return a.rb() <= c.rb();
    },
    RelationalExpression_ge: function (a, b, c) {
      return a.rb() >= c.rb();
    },
    AdditiveExpression_add: function (x, _, y) {
      return x.rb() + y.rb();
    },
    AdditiveExpression_sub: function (x, _, y) {
      return x.rb() - y.rb();
    },
    MultiplicativeExpression_mul: function (x, _, y) {
      return x.rb() * y.rb();
    },
    MultiplicativeExpression_div: function (x, _, y) {
      var retType = arithHelper(x, y);
      var ret = x.rb() / y.rb();
      return retType === 'int' ? Math.floor(ret) : ret;
    },
    MultiplicativeExpression_mod: function (x, _, y) {
      return x.rb() % y.rb();
    },
    UnaryExpression_unaryMinus: function (x, y) {
      return -1 * y.rb();
    },
    UnaryExpression_unaryPlus: function (x, y) {
      return y.rb();
    },
    UnaryExpression_lnot: function (x, y) {
      return !y.rb();
    },
    decimalLiteral_integerOnly: function (x, y) {
      return parseInt(this.sourceString, 10);
    },
    decimalLiteral_bothParts: function (x, y, z, w) {
      return parseFloat(this.sourceString);
    },
    Block: function (a, b, c) {
      b.rb(); return null;
    },
    FunctionDeclaration: function (a, id, c, params, e, f, myBody, h) {
      var argList = params.sourceString.split(/,\s*/);
      var idName = id.sourceString;
      if (env[idName] !== undefined) throw new RuntimeError('redefining ' + idName + ' is not allowed');
      env[idName] = {
        args: argList,
        body: myBody,
      };
      return null;
    },
    FunctionBody: function (a, b) {
      try {
        b.rb();
      } catch (e) {
        if (!e.hasOwnProperty('val')) throw e;
        return e.val;
      }
    },
    IfStatement: function (a, b, cond, d, expr, f, elseCase) {
      if (truthy(cond.rb())) {
        expr.rb();
      } else {
        elseCase.rb();
      }
      return null;
    },
    VariableStatement: function (x, y, z) {
      y.rb(); // this is an Array
      return null;
    },
    VariableDeclaration: function (x, y) {
      var val = y.rb();
      val = val[val.length - 1];
      env[x.sourceString] = val; // override
      return null; // doesn't matter
    },
    Initialiser: function (x, y) {
      var type = y.rb();
      return type;
    },
    EmptyListOf: function () {
      return [];
    },
    NonemptyListOf: function (first, _sep, others) {
      return [first.rb()].concat(others.rb());
    },
    TryStatement: function (x) {
      return x.rb();
    },
    TryStatement_tryCatch: function (x, y, z) {
      y.rb(); z.rb();
      return null;
    },
    TryStatement_tryFinally: function (x, y, z) {
      y.rb(); z.rb();
      return null;
    },
    TryStatement_tryCatchFinally: function (x, y, z, w) {
      y.rb(); z.rb(); w.rb();
      return null;
    },
    Catch: function (a, b, c, d, e) {
      c.rb(); e.rb();
      return null;
    },
    Finally: function (a, b) {
      b.rb();
      return null;
    },
    ArrayLiteral: function (x, y, z) {
      return y.rb();
    },
    stringLiteral: function (x, y, z) {
      return y.sourceString;
    },
    booleanLiteral: function (x) {
      return JSON.parse(this.sourceString);
    },
    ReturnStatement: function (x, y, z, w) {
      throw { val: z.rb()[0] };
    },
    PostfixExpression_postIncrement: function (a, b, c) {
      return env[a.sourceString]++;
    },
    PostfixExpression_postDecrement: function (a, b, c) {
      return env[a.sourceString]--;
    },
    UnaryExpression_preIncrement: function (a, b) {
      return ++env[b.sourceString];
    },
    UnaryExpression_preDecrement: function (a, b) {
      return --env[b.sourceString];
    },
    AssignmentExpression_assignment: function (x, y, z) {
      var val = z.rb();
      env[x.sourceString] = val; // override
      return cast(x.ti(), val);
    },
    identifier: function (x) {
      var ret = env[x.sourceString];
      if (ret === undefined) throw new RuntimeError(x.sourceString + ' is an undefined identifier');
      var type = this.ti();
      return cast(type, ret);
    },
    IterationStatement: function (a) {
      return a.rb();
    },
    IterationStatement_doWhile: function (a, b, c, d, e, f, g) {
      do {
        b.rb();
      } while (truthy(e.rb()));
      return null;
    },
    _terminal: function () {
      return null;
    },
    IterationStatement_whileDo: function (a, b, c, d, e) {
      while (truthy(c.rb())) {
        e.rb();
      }
      return null;
    },
    IterationStatement_for3: function (a, b, c, d, e, f, g, h, i) {
      // TODO(nate): fix
      for (c.rb(); truthy(e.rb()[0]); g.rb()) {
        i.rb();
      }
      return null;
    },
    IterationStatement_for3var: function (a, b, _var, c, d, e, f, g, h, i) {
      // TODO(nate): fix
      for (c.rb(); truthy(e.rb()[0]); g.rb()) {
        i.rb();
      }
      return null;
    },
    IterationStatement_forIn: function (a, b, lhs, c, expr, d, stmt) {
      // TODO(nate): fix
      lhs.rb();
      var type = expr.rb();
      tokenTypes.setVal(lhs.sourceString, type === 'dict' ? 'string' : 'int');
      stmt.rb();
      return null;
    },
    IterationStatement_forInVar: function (a, b, _var, lhs, c, expr, d, stmt) {
      // TODO(nate): fix
      lhs.rb();
      var type = expr.rb();
      tokenTypes.setVal(lhs.sourceString, type === 'dict' ? 'string' : 'int');
      stmt.rb();
      return null;
    },
    CallExpression_memberExpExp: function (x, y) {
      // TODO(nate): fix this line to use .rb()
      var funDecl = env[x.sourceString];
      var ret;
      var funInv = { args: y.rb() };
      if (funDecl) {
        var oldEnv = env;
        env = Object.create(oldEnv);
        for (var k = 0; k < funInv.args.length; k++) {
          env[funDecl.args[k]] = funInv.args[k];
        }
        ret = funDecl.body.rb(); // execute it with the new environment
        env = oldEnv;
      } else if (builtins[x.sourceString] !== undefined) {
        funDecl = builtins[x.sourceString];
        ret = funDecl.apply(undefined, _toConsumableArray(funInv.args));
      } else {
        throw new RuntimeError('undefined function');
      }

      var type = x.ti();
      if (type === 'string') {
        return ret.toString();
      } else if (type === 'int') {
        return parseInt(ret, 10);
      } else if (type === 'float') {
        return parseFloat(ret);
      }
      return ret;
    },
    Arguments: function (a, b, c) {
      return b.rb();
    },
    MemberExpression_propRefExp: function (a, b, c) {
      var that = a.rb();
      if (that[c.sourceString] !== undefined) {
        return that[c.sourceString];
      } else {
        throw new RuntimeError('builtin properties not yet supported');
      }
    },
    MemberExpression_arrayRefExp: function (a, b, c, d) {
      var that = a.rb();
      var idx = c.rb();
      if (that[idx] !== undefined) {
        return that[idx];
      } else {
        throw new RuntimeError('builtin properties not yet supported');
      }
    },
    PrimaryExpression_parenExpr: function (x, y, z) {
      return y.rb();
    },
    ObjectLiteral_noTrailingComma: function (a, b, c) {
      var ret = {};
      b.rb().forEach(function (x) {
        ret[x.key] = x.val;
      });
      return ret;
    },
    PropertyAssignment_simple: function (a, b, c) {
      return {
        key: a.sourceString,
        val: c.rb(),
      };
    },
    ObjectLiteral_trailingComma: function (a, b, c, d) {
      var ret = {};
      b.rb().forEach(function (x) {
        ret[x.key] = x.val;
      });
      return ret;
    },
  };
}());

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.rbInterp = rbInterp;
}
