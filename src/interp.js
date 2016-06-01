var rbInterp;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  var tokenTypes = require('./types');
}

(function () {
  function arithHelper(x, y) {
    var a = x.ti();
    var b = y.ti();
    if (a === 'dict' || b === 'dict') throw new Error('cannot add dicts');
    if (a === 'list' || b === 'list') throw new Error('cannot add lists');
    var ret;
    ['string', 'float', 'int'].forEach(x => {
      if (ret) return;
      if (a === x || b === x)
        ret = x;
    });
    return ret || 'unknown';
  }
  var idRegex = /[a-zA-Z_][a-zA-Z0-9_]*/;
  rbInterp = {
    Program: function(x, y) { var lines = y.rb(); return lines[lines.length-1]; },
    SourceElement: function(x) { return x.rb(); },
    ExpressionStatement: function (x, y) { return x.rb(); },
    Expression: function (x) { return x.rb(); },
    EqualityExpression_equal: (x, y, z) => x.rb() === z.rb(),
    EqualityExpression_notEqual: (x, y, z) => x.rb() !== z.rb(),
    EqualityExpression_eq: (x, y, z) => x.rb() === z.rb(),
    EqualityExpression_notEq: (x, y, z) => x.rb() !== z.rb(),
    AdditiveExpression_add: (x, _, y) => x.rb() + y.rb(),
    AdditiveExpression_sub: (x, _, y) => x.rb() - y.rb(),
    MultiplicativeExpression_mul: function (x, _, y) {
      var retType = arithHelper(x, y);
      var ret = x.rb() / y.rb();
      switch (retType) {
        case 'string':
          throw new Error('Strings cannot be multiplied');
        default:
          return ret;
      }
    },
    MultiplicativeExpression_div: function (x, _, y) {
      var retType = arithHelper(x, y);
      var ret = x.rb() / y.rb();
      switch (retType) {
        case 'string':
          throw new Error('Strings cannot be divided');
        case 'int':
          return Math.floor(ret);
        default:
          return ret;
      }
    },
    MultiplicativeExpression_mod: function (x, _, y) {
      var retType = arithHelper(x, y);
      var ret = x.rb() / y.rb();
      switch (retType) {
        case 'string':
          throw new Error('Strings cannot be modded');
        default:
          return ret;
      }
    },
    UnaryExpression_unaryMinus:  (x, y) => -1 * y.rb(),
    decimalLiteral_integerOnly: function (x, y) { return parseInt(this.interval.contents); },
    decimalLiteral_bothParts: function (x, y, z, w) { return parseFloat(this.interval.contents); },
    Block: function (a, b, c) { b.rb(); return null; },
    FunctionDeclaration: function (a, id, c, d, e, f, body, h) {
      if (!tokenTypes.internal[id.interval.contents]) {
        tokenTypes.internal[id.interval.contents] = {
          type: 'fun',
          ret: 'unknown',
          args: [], // TODO: fix this
        };
        body.rb();
      }
      return null;
    },
    FunctionBody: function (a, b) { return b.rb(); },
    IfStatement: function (a, b, cond, d, expr, f, elseCase) {
      cond.rb();
      expr.rb();
      elseCase.rb();
      return null;
    },
    VariableStatement: function (x, y, z) {
      y.rb(); // set these values!
      return 'list';
    },
    VariableDeclaration: function (x, y) {
      var type = y.rb();
      if (x.interval.contents.match(idRegex))
        tokenTypes.setVal(x.interval.contents, type);
      return type;
    },
    Initialiser: function (x, y) {
      var type = y.rb();
      return type;
    },
    NonemptyListOf: function (x, y, z) {
      x.rb(); // initialize these values!
      return 'list';
    },
    TryStatement: function (x) { return x.rb(); },
    TryStatement_tryCatch: function (x, y, z) { y.rb(); z.rb(); return null; },
    TryStatement_tryFinally: function (x, y, z) { y.rb(); z.rb(); return null; },
    TryStatement_tryCatchFinally: function (x, y, z, w) { y.rb(); z.rb(); w.rb(); return null; },
    Catch: function (a, b, c, d, e) { c.rb(); e.rb(); return null; },
    Finally: function (a, b) { b.rb(); return null; },
    ArrayLiteral: function (x, y, z) { return JSON.parse(this.interval.contents); },
    stringLiteral: function (x, y, z) { return eval(this.interval.contents); },
    booleanLiteral: function (x) { return JSON.parse(this.interval.contents); },
    ReturnStatement: (x, y, z, w) => null, // TODO: fix this
    PostfixExpression_postIncrement: function(a, b, c) {
      a.rb();
      if (a.interval.contents.match(idRegex))
        tokenTypes.setVal(a.interval.contents, 'int');
    },
    PostfixExpression_postDecrement: function(a, b, c) {
      a.rb();
      if (a.interval.contents.match(idRegex))
        tokenTypes.setVal(a.interval.contents, 'int');
    },
    AssignmentExpression_assignment: (x, y, z) => {
      var type = z.rb();
      if (x.interval.contents.match(idRegex))
        tokenTypes.setVal(x.interval.contents, type);
      return type;
    },
    identifier: function (x) {
      // use the global env
      return tokenTypes.getVal(x.interval.contents);
    },
    IterationStatement: (a) => a.rb(),
    IterationStatement_doWhile: function(a, b, c, d, e, f, g) {
      b.rb();
      e.rb();
      return 'null';
    },
    IterationStatement_whileDo: function(a, b, c, d, e) {
      c.rb();
      e.rb();
      return 'null';
    },
    IterationStatement_for3: function(a, b, c, d, e, f, g, h, i) {
      c.rb();
      e.rb();
      g.rb();
      i.rb();
      return 'null';
    },
    IterationStatement_for3var: function(a, b, _var, c, d, e, f, g, h, i) {
      c.rb();
      e.rb();
      g.rb();
      i.rb();
      return 'null';
    },
    IterationStatement_forIn: function(a, b, lhs, c, expr, d, stmt) {
      lhs.rb();
      var type = expr.rb();
      tokenTypes.setVal(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.rb();
      return null;
    },
    IterationStatement_forInVar: function(a, b, _var, lhs, c, expr, d, stmt) {
      lhs.rb();
      var type = expr.rb();
      tokenTypes.setVal(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.rb();
      return null;
    },
    CallExpression_memberExpExp: function(x, y) {
      return tokenTypes.getVal(x.interval.contents);
    },
    PrimaryExpression_parenExpr: (x, y, z) => y.rb(),
    ObjectLiteral: (x) => JSON.parse(x.interval.contents),
  };
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.rbInterp = rbInterp;
}
