'use strict';

/* eslint no-unused-vars: 0, block-scoped-var: 0 */
/* jshint unused: false */
var typeInference;

// In the browser, tokenTypes is defined by importing types.js via <script> tag.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // inside node
  var tokenTypes = require('./types');
}

(function () {
  var functionName = '';
  var nameSpace = '';
  var memberOf;
  var idRegex = /[a-zA-Z_][a-zA-Z0-9_]*/;
  function InferenceError(message) {
    this.name = 'InferenceError';
    this.message = message || '';
    this.stack = new Error().stack;
  }
  InferenceError.prototype = Object.create(Error.prototype);
  InferenceError.prototype.constructor = InferenceError;

  function areCompatibleTypes(lhsType, rhsType) {
    if (lhsType === 'unknown') return true;
    var ret;
    ['dict', 'list', 'bool'].forEach(function (x) {
      if (typeof ret === 'boolean') return;
      if ((lhsType === x) && lhsType === rhsType) ret = true;
      else if (lhsType === x || rhsType === x) ret = false;
    });
    if (typeof ret === 'boolean') return ret;
    if ((lhsType === 'int' || lhsType === 'float') && rhsType === 'string') return false;
    return true;
  }
  function arithHelper(x, op, y) {
    var a = x.ti();
    var b = y.ti();
    var opStr = op.sourceString;
    var ret;
    // most constrained types go first
    ['dict', 'list', 'bool', 'string', 'float', 'int'].forEach(function (type) {
      if (ret) return;
      if (a === type || b === type) ret = type;
    });
    var opPairs = {
      '+': 'add',
      '-': 'substract',
      '/': 'divide',
      '*': 'multiply',
      '%': 'mod',
    };
    var errorObj = {};
    a = Object.assign({}, opPairs);
    a['+'] = null;
    errorObj.string = a;
    errorObj.dict = opPairs;
    errorObj.list = opPairs;
    errorObj.bool = opPairs;
    if (errorObj[ret] && errorObj[ret][opStr]) {
      throw new InferenceError('cannot ' + errorObj[ret][opStr] + ' ' + ret + ' values');
    }
    return ret || 'unknown';
  }

  typeInference = {
    Program: function (x, y) {
      var lines = y.ti(); return lines[lines.length - 1];
    },
    SourceElement: function (x) {
      return x.ti();
    },
    ExpressionStatement: function (x, y) {
      return x.ti();
    },
    Expression: function (x) {
      return x.ti();
    },
    EqualityExpression_equal: function (x, y, z) {
      return 'bool';
    },
    EqualityExpression_notEqual: function (x, y, z) {
      return 'bool';
    },
    EqualityExpression_eq: function (x, y, z) {
      return 'bool';
    },
    EqualityExpression_notEq: function (x, y, z) {
      return 'bool';
    },
    RelationalExpression_lt: function (a, b, c) {
      return 'bool';
    },
    RelationalExpression_gt: function (a, b, c) {
      return 'bool';
    },
    RelationalExpression_le: function (a, b, c) {
      return 'bool';
    },
    RelationalExpression_ge: function (a, b, c) {
      return 'bool';
    },
    _terminal: function () {
      return 'int';
    },
    AdditiveExpression_add: function (a, b, c) {
      return arithHelper(a, b, c);
    },
    AdditiveExpression_sub: function (a, b, c) {
      return arithHelper(a, b, c);
    },
    MultiplicativeExpression_mul: function (a, b, c) {
      return arithHelper(a, b, c);
    },
    MultiplicativeExpression_div: function (a, b, c) {
      return arithHelper(a, b, c);
    },
    MultiplicativeExpression_mod: function (a, b, c) {
      return arithHelper(a, b, c);
    },
    UnaryExpression_unaryMinus: function (x, y) {
      return y.ti();
    },
    UnaryExpression_unaryPlus: function (x, y) {
      return y.ti();
    },
    UnaryExpression_preIncrement: function (x, y) {
      return y.ti();
    },
    UnaryExpression_preDecrement: function (x, y) {
      return y.ti();
    },
    UnaryExpression_lnot: function (x, y) {
      return y.ti();
    },
    decimalLiteral_integerOnly: function (x, y) {
      return 'int';
    },
    decimalLiteral_bothParts: function (x, y, z, w) {
      return 'float';
    },
    MemberExpression_propRefExp: function (a, b, c) {
      var name;
      var type = a.ti();
      if (type === 'dict') {
        name = a.sourceString + '#' + c.sourceString;
      } else if (type === 'bool') {
        throw new InferenceError('bools (' + a.sourceString + ') cannot have properties');
      } else {
        name = '$' + type + '#' + c.sourceString;
      }
      return tokenTypes.getVal(name);
    },
    MemberExpression_arrayRefExp: function (a, b, c, d) {
      // TODO(nate): fix this, I'm just not sure how
      var thisType = a.ti();
      var argType = c.ti();
      var name;
      var argName = c.sourceString;
      if (thisType === 'dict') {
        if (argType === 'string') argName = argName.replace(/["']/g, '');
        name = a.sourceString + '#' + argName;
      } else if (thisType === 'string') {
        if (argType !== 'int') {
          throw new InferenceError('Cannot index with a non-integer');
        }
        return 'string';
      } else if (thisType === 'list') {
        return 'unknown'; // TODO: fix this if possible
      } else if (thisType === 'bool' || thisType === 'int' || thisType === 'float') {
        throw new InferenceError('Cannot index off ' + thisType + ' (' + a.sourceString + ')');
      }
      return tokenTypes.getVal(name);
    },
    Block: function (a, b, c) {
      b.ti(); return 'void';
    },
    FormalParameter: function (a) {
      var ret = tokenTypes.getObj(a.sourceString);
      if (typeof ret === 'string') {
        tokenTypes.setVal(a.sourceString, ret);
        ret = tokenTypes.getObj(a.sourceString);
      }
      return ret;
    },
    FunctionDeclaration: function (a, id, c, params, e, f, body, h) {
      functionName = id.sourceString;
      if (tokenTypes.inferred[functionName]) {
        throw new InferenceError('Cannot declare class twice');
      }
      tokenTypes.inferred[functionName] = {
        type: 'fun',
        name: functionName,
        ret: 'unknown',
        args: params.ti(),
      };
      body.ti();
      return 'void';
    },
    FunctionBody: function (a, b) {
      b.ti();
      return 'void';
    },
    IfStatement: function (a, b, cond, d, expr, f, elseCase) {
      var bool = cond.ti();
      if (bool !== 'bool') {
        throw new InferenceError('Condition must be of type `bool`');
      }

      expr.ti();
      elseCase.ti();
      return 'void';
    },
    VariableStatement: function (x, y, z) {
      y.ti();
      return 'void';
    },
    VariableDeclarationList: function (x) {
      return x.ti();
    },
    VariableDeclaration: function (x, y) {
      var id = x.sourceString;
      if (id.match(idRegex)) {
        var oldNameSpace = nameSpace;
        nameSpace += id + '#';
        var rhsType = y.ti()[0];
        var lhsType = tokenTypes.getVal(id);
        if (!areCompatibleTypes(lhsType, rhsType)) {
          throw new InferenceError('cannot assign ' + rhsType + ' to ' + lhsType + ' (' + this.sourceString + ')');
        }
        tokenTypes.setVal(x.sourceString, rhsType);
        nameSpace = oldNameSpace;
      }
      return tokenTypes.getVal(id);
    },
    Initialiser: function (x, y) {
      return y.ti();
    },
    EmptyListOf: function () {
      return 'void';
    },
    NonemptyListOf: function (first, _sep, others) {
      return [first.ti()].concat(others.ti());
    },
    TryStatement: function (x) {
      return x.ti();
    },
    TryStatement_tryCatch: function (x, y, z) {
      y.ti(); z.ti(); return 'void';
    },
    TryStatement_tryFinally: function (x, y, z) {
      y.ti(); z.ti(); return 'void';
    },
    TryStatement_tryCatchFinally: function (x, y, z, w) {
      y.ti(); z.ti(); w.ti(); return 'void';
    },
    Catch: function (a, b, c, d, e) {
      c.ti(); e.ti(); return 'void';
    },
    Finally: function (a, b) {
      b.ti(); return 'void';
    },
    ArrayLiteral: function (x, y, z) {
      return 'list';
    },
    stringLiteral: function (x, y, z) {
      return 'string';
    },
    booleanLiteral: function (x) {
      return 'bool';
    },
    ReturnStatement: function (a, b, c, d) {
      var type = c.ti()[0];
      if (type !== 'unknown') {
        tokenTypes.setVal(functionName, type);
      }
      return 'void';
    },
    PostfixExpression_postIncrement: function (a, b, c) {
      a.ti();
      if (a.sourceString.match(idRegex)) {
        tokenTypes.setVal(a.sourceString, 'int');
      }
      return 'int';
    },
    PostfixExpression_postDecrement: function (a, b, c) {
      a.ti();
      if (a.sourceString.match(idRegex)) {
        tokenTypes.setVal(a.sourceString, 'int');
      }
      return 'int';
    },
    AssignmentExpression_assignment: function (x, y, z) {
      var rhsType = z.ti();
      var id = x.sourceString;
      if (id.match(idRegex)) {
        var lhsType = tokenTypes.getVal(id);
        if (!areCompatibleTypes(lhsType, rhsType)) {
          throw new InferenceError('cannot assign ' + rhsType + ' (' + z.sourceString + ') to ' + lhsType + ' (' + id + ')');
        }
        tokenTypes.setVal(x.sourceString, rhsType);
      }
      return tokenTypes.getVal(id);
    },
    identifier: function (x) {
      return tokenTypes.getVal(x.sourceString);
    },
    IterationStatement: function (a) {
      return a.ti();
    },
    IterationStatement_doWhile: function (a, b, c, d, e, f, g) {
      b.ti();
      var bool = e.ti();
      if (bool !== 'bool') {
        throw new InferenceError('Condition must be of type `bool`');
      }
      return 'void';
    },
    IterationStatement_whileDo: function (a, b, c, d, e) {
      var bool = c.ti();
      if (bool !== 'bool') {
        throw new InferenceError('Condition must be of type `bool`');
      }
      e.ti();
      return 'void';
    },
    IterationStatement_for3: function (a, b, c, d, e, f, g, h, i) {
      c.ti();
      g.ti();
      i.ti();
      var bool = e.ti()[0];
      if (bool !== 'bool') {
        throw new InferenceError('Condition must be of type `bool`');
      }
      return 'void';
    },
    IterationStatement_for3var: function (a, b, _var, c, d, e, f, g, h, i) {
      c.ti();
      g.ti();
      i.ti();
      var bool = e.ti()[0];
      if (bool !== 'bool') {
        throw new InferenceError('Condition must be of type `bool`');
      }
      return 'void';
    },
    IterationStatement_forIn: function (a, b, lhs, c, expr, d, stmt) {
      lhs.ti();
      var type = expr.ti();
      // TODO(nate): actually infer the type, don't just do a lame guess
      tokenTypes.setVal(lhs.sourceString, type === 'dict' ? 'string' : 'int');
      stmt.ti();
      return 'void';
    },
    IterationStatement_forInVar: function (a, b, _var, lhs, c, expr, d, stmt) {
      lhs.ti();
      var type = expr.ti();
      // TODO(nate): actually infer the type, don't just do a lame guess
      tokenTypes.setVal(lhs.sourceString, type === 'dict' ? 'string' : 'int');
      stmt.ti();
      return 'void';
    },
    CallExpression_memberExpExp: function (x, y) {
      var funDec = tokenTypes.getObj(x.sourceString);
      var funInv = { args: y.ti() };
      if (funDec.args.length !== funInv.args.length) {
        throw new InferenceError('Argument lists must be same length');
      }
      for (var k = 0; k < funDec.args.length; k++) {
        var thisType = funDec.args[k].type;
        if (thisType === 'unknown') {
          tokenTypes.setVal(funDec.args[k].name, funInv.args[k]);
        }
      }
      return tokenTypes.getVal(x.sourceString);
    },
    Arguments: function (a, b, c) {
      return b.ti();
    },
    PrimaryExpression_parenExpr: function (x, y, z) {
      return y.ti();
    },
    ObjectLiteral_noTrailingComma: function (a, b, c) {
      b.ti();
      return 'dict';
    },
    ObjectLiteral_trailingComma: function (a, b, c, d) {
      var t = b.ti();
      return 'dict';
    },
    PropertyAssignment_simple: function (a, b, c) {
      var type = c.ti();
      tokenTypes.setVal(nameSpace + a.sourceString, type);
      tokenTypes.setVal(a.sourceString, type);
      return type;
    },
  };
}());

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.typeInference = typeInference;
}
