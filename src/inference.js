var typeInference;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // inside node
  var tokenTypes = require('./types');
}

(function () {
  var functionName = '';
  var nameSpace = '';
  var idRegex = /[a-zA-Z_][a-zA-Z0-9_]*/;
  function arithHelper(x, op, y) {
    var a = x.ti();
    var b = y.ti();
    var opStr = op.interval.contents;
    var ret;
    // most constrained types go first
    ['dict', 'list', 'bool', 'string', 'float', 'int'].forEach(x => {
      if (ret) return;
      if (a === x || b === x)
        ret = x;
    });
    var opPairs = {
      '+': 'add',
      '-': 'substract',
      '/': 'divide',
      '*': 'multiply',
      '%': 'mod',
    };
    var errorObj = {};
    var a = Object.assign({}, opPairs);
    a['+'] = null;
    errorObj['string'] = a;
    errorObj['dict'] = opPairs;
    errorObj['list'] = opPairs;
    errorObj['bool'] = opPairs;
    if (errorObj[ret] && errorObj[ret][opStr])
      throw new Error(`cannot ${errorObj[ret][opStr]} ${ret} values`);
    return ret || 'unknown';
  }

  typeInference = {
    Program: function(x, y) { var lines = y.ti(); return lines[lines.length-1] },
    SourceElement: function(x) { return x.ti() },
    ExpressionStatement: function (x, y) { return x.ti() },
    Expression: function (x) { return x.ti() },
    EqualityExpression_equal: (x, y, z) => 'bool',
    EqualityExpression_notEqual: (x, y, z) => 'bool',
    EqualityExpression_eq: (x, y, z) => 'bool',
    EqualityExpression_notEq: (x, y, z) => 'bool',
    RelationalExpression_lt: (a, b, c) => 'bool',
    RelationalExpression_gt: (a, b, c) => 'bool',
    RelationalExpression_le: (a, b, c) => 'bool',
    RelationalExpression_ge: (a, b, c) => 'bool',
    _terminal: () => 'int',
    AdditiveExpression_add: (a, b, c) => arithHelper(a, b, c),
    AdditiveExpression_sub: (a, b, c) => arithHelper(a, b, c),
    MultiplicativeExpression_mul: (a, b, c) => arithHelper(a, b, c),
    MultiplicativeExpression_div: (a, b, c) => arithHelper(a, b, c),
    MultiplicativeExpression_mod: (a, b, c) => arithHelper(a, b, c),
    UnaryExpression_unaryMinus:  (x, y) => y.ti(),
    UnaryExpression_unaryPlus:  (x, y) => y.ti(),
    UnaryExpression_preIncrement:  (x, y) => y.ti(),
    UnaryExpression_preDecrement:  (x, y) => y.ti(),
    UnaryExpression_lnot:  (x, y) => y.ti(),
    decimalLiteral_integerOnly: function (x, y) { return 'int' },
    decimalLiteral_bothParts: function (x, y, z, w) { return 'float' },
    MemberExpression_propRefExp: function (a, b, c) {
      return tokenTypes.getVal(a.interval.contents + '#' + c.interval.contents)
    },
    MemberExpression_arrayRefExp: function (a, b, c, d) {
      // TODO(nate): fix this, I'm just not sure how
      return 'unknown'
    },
    Block: function (a, b, c) { b.ti(); return 'void' },
    FunctionDeclaration: function (a, id, c, d, e, f, body, h) {
      functionName = id.interval.contents;
      if (!tokenTypes.inferred[functionName]) {
        tokenTypes.inferred[functionName] = {
          type: 'fun',
          ret: tokenTypes.getVal(functionName),
          args: [], // TODO: fix this
        };
        body.ti();
      }
      return 'void';
    },
    FunctionBody: function (a, b) {
      b.ti();
      return 'void';
    },
    IfStatement: function (a, b, cond, d, expr, f, elseCase) {
      cond.ti();
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
      var type = y.ti(); // this is a list
      type = type[type.length-1];
      if (x.interval.contents.match(idRegex))
        tokenTypes.setVal(x.interval.contents, type);
      return type
    },
    Initialiser: (x, y) => y.ti(),
    EmptyListOf: () => 'void',
    NonemptyListOf: function (first, _sep, others) {
      return [first.ti()].concat(others.ti());
    },
    TryStatement: function (x) { return x.ti() },
    TryStatement_tryCatch: function (x, y, z) { y.ti(); z.ti(); return 'void' },
    TryStatement_tryFinally: function (x, y, z) { y.ti(); z.ti(); return 'void' },
    TryStatement_tryCatchFinally: function (x, y, z, w) { y.ti(); z.ti(); w.ti(); return 'void' },
    Catch: function (a, b, c, d, e) { c.ti(); e.ti(); return 'void' },
    Finally: function (a, b) { b.ti(); return 'void' },
    ArrayLiteral: function (x, y, z) { return 'list' },
    stringLiteral: function (x, y, z) { return 'string' },
    booleanLiteral: function (x) { return 'bool' },
    ReturnStatement: function (a, b, c, d) {
      var type = c.ti()[0];
      if (type !== 'unknown') {
        tokenTypes.setVal(functionName, type);
      }
      return 'void'
    },
    PostfixExpression_postIncrement: function(a, b, c) {
      a.ti();
      if (a.interval.contents.match(idRegex))
        tokenTypes.setVal(a.interval.contents, 'int');
    },
    PostfixExpression_postDecrement: function(a, b, c) {
      a.ti();
      if (a.interval.contents.match(idRegex))
        tokenTypes.setVal(a.interval.contents, 'int');
    },
    AssignmentExpression_assignment: (x, y, z) => {
      var type = z.ti();
      if (x.interval.contents.match(idRegex)) {
        tokenTypes.setVal(x.interval.contents, type);
      }
      return type;
    },
    identifier: function (x) {
      return tokenTypes.getVal(x.interval.contents);
    },
    IterationStatement: (a) => a.ti(),
    IterationStatement_doWhile: function(a, b, c, d, e, f, g) {
      b.ti();
      e.ti();
      return 'void';
    },
    IterationStatement_whileDo: function(a, b, c, d, e) {
      c.ti();
      e.ti();
      return 'void';
    },
    IterationStatement_for3: function(a, b, c, d, e, f, g, h, i) {
      c.ti();
      e.ti();
      g.ti();
      i.ti();
      return 'void';
    },
    IterationStatement_for3var: function(a, b, _var, c, d, e, f, g, h, i) {
      c.ti();
      e.ti();
      g.ti();
      i.ti();
      return 'void';
    },
    IterationStatement_forIn: function(a, b, lhs, c, expr, d, stmt) {
      lhs.ti();
      var type = expr.ti();
      // TODO(nate): actually infer the type, don't just do a lame guess
      tokenTypes.setVal(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.ti();
      return 'void';
    },
    IterationStatement_forInVar: function(a, b, _var, lhs, c, expr, d, stmt) {
      lhs.ti();
      var type = expr.ti();
      // TODO(nate): actually infer the type, don't just do a lame guess
      tokenTypes.setVal(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.ti();
      return 'void';
    },
    CallExpression_memberExpExp: function(x, y) {
      // console.log(tokenTypes.getVal(x.interval.contents.replace(/\./, '#')));
      y.ti(); // check the arguments
      return tokenTypes.getVal(x.interval.contents);
    },
    Arguments: (a, b, c) => b.ti(),
    PrimaryExpression_parenExpr: (x, y, z) => y.ti(),
    ObjectLiteral_noTrailingComma: function (a, b, c) {
      var oldNameSpace = nameSpace;
      nameSpace += a.interval.contents + '#';
      b.ti();
      nameSpace = oldNameSpace;
      return 'dict';
    },
    ObjectLiteral_trailingComma: function (a, b, c, d) {
      var oldNameSpace = nameSpace;
      nameSpace += a.interval.contents + '#';
      b.ti();
      nameSpace = oldNameSpace;
      return 'dict'
    },
    PropertyAssignment_simple: function (a, b, c) {
      var type = c.ti();
      tokenTypes.setVal(nameSpace + a.interval.contents, type);
      return type
    },
  };
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.typeInference = typeInference;
}
