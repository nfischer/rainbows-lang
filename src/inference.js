var typeInference;

(function () {
  var functionName = '';
  var nameSpace = '';
  var idRegex = /[a-zA-Z_][a-zA-Z0-9_]*/;
  function arithHelper(x, op, y) {
    var a = x.ti();
    var b = y.ti();
    var opStr = op.interval.contents;
    var ret;
    ['dict', 'list', 'string', 'float', 'int', 'bool'].forEach(x => {
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
      throw new Error(`cannot ${errorObj[ret][opStr]} string values`);
    return ret || 'unknown';
  }

  typeInference = {
    Program: function(x, y) { return y.ti(); },
    SourceElement: function(x) { return x.ti(); },
    ExpressionStatement: function (x, y) { return x.ti(); },
    Expression: function (x) { return x.ti(); },
    EqualityExpression_equal: (x, y, z) => 'bool',
    EqualityExpression_notEqual: (x, y, z) => 'bool',
    EqualityExpression_eq: (x, y, z) => 'bool',
    EqualityExpression_notEq: (x, y, z) => 'bool',
    AdditiveExpression_add: (a, b, c) => arithHelper(a, b, c),
    AdditiveExpression_sub: (a, b, c) => arithHelper(a, b, c),
    MultiplicativeExpression_mul: (a, b, c) => arithHelper(a, b, c),
    MultiplicativeExpression_div: (a, b, c) => arithHelper(a, b, c),
    MultiplicativeExpression_mod: (a, b, c) => arithHelper(a, b, c),
    UnaryExpression_unaryMinus:  (x, y) => y.ti(),
    decimalLiteral_integerOnly: function (x, y) { return 'int'; },
    decimalLiteral_bothParts: function (x, y, z, w) { return 'float'; },
    MemberExpression_propRefExp: function (a, b, c) {
      // console.log('retreiving', a.interval.contents + '#' + c.interval.contents);
      return getEnv(a.interval.contents + '#' + c.interval.contents);
    },
    MemberExpression_arrayRefExp: function (a, b, c, d) {
      // TODO(nate): fix this, I'm just not sure how
      return 'unknown';
    },
    Block: function (a, b, c) { b.ti(); return 'null'; },
    FunctionDeclaration: function (a, id, c, d, e, f, body, h) {
      functionName = id.interval.contents;
      if (!env[functionName]) {
        env[functionName] = {
          type: 'fun',
          ret: 'unknown',
          args: [], // TODO: fix this
        };
        body.ti();
      }
      return 'null';
    },
    FunctionBody: function (a, b) { return b.ti(); },
    IfStatement: function (a, b, cond, d, expr, f, elseCase) {
      cond.ti();
      expr.ti();
      elseCase.ti();
      return 'null';
    },
    VariableStatement: function (x, y, z) {
      y.ti(); // set these values!
      return 'list';
    },
    VariableDeclaration: function (x, y) {
      var type = y.ti();
      if (x.interval.contents.match(idRegex))
        setEnv(x.interval.contents, type);
      return type;
    },
    Initialiser: function (x, y) {
      var type = y.ti();
      return type;
    },
    EmptyListOf: () => 'list',
    NonemptyListOf: function (x, y, z) {
      x.ti(); // initialize these values!
      return 'list';
    },
    TryStatement: function (x) { return x.ti(); },
    TryStatement_tryCatch: function (x, y, z) { y.ti(); z.ti(); return 'null'; },
    TryStatement_tryFinally: function (x, y, z) { y.ti(); z.ti(); return 'null'; },
    TryStatement_tryCatchFinally: function (x, y, z, w) { y.ti(); z.ti(); w.ti(); return 'null'; },
    Catch: function (a, b, c, d, e) { c.ti(); e.ti(); return 'null'; },
    Finally: function (a, b) { b.ti(); return 'null'; },
    ArrayLiteral: function (x, y, z) { return 'list'; },
    stringLiteral: function (x, y, z) { return 'string'; },
    booleanLiteral: function (x) { return 'bool'; },
    ReturnStatement: function (a, b, c, d) {
      var type = c.ti()[0];
      if (type !== 'unknown') {
        env[functionName].ret = type;
      }
      return 'null';
    },
    PostfixExpression_postIncrement: function(a, b, c) {
      a.ti();
      if (a.interval.contents.match(idRegex))
        setEnv(a.interval.contents, 'int');
    },
    PostfixExpression_postDecrement: function(a, b, c) {
      a.ti();
      if (a.interval.contents.match(idRegex))
        setEnv(a.interval.contents, 'int');
    },
    AssignmentExpression_assignment: (x, y, z) => {
      var type = z.ti();
      if (x.interval.contents.match(idRegex))
        setEnv(x.interval.contents, type);
      return type;
    },
    identifier: function (x) {
      // use the global env
      return getEnv(x.interval.contents);
    },
    IterationStatement: (a) => a.ti(),
    IterationStatement_doWhile: function(a, b, c, d, e, f, g) {
      b.ti();
      e.ti();
      return 'null';
    },
    IterationStatement_whileDo: function(a, b, c, d, e) {
      c.ti();
      e.ti();
      return 'null';
    },
    IterationStatement_for3: function(a, b, c, d, e, f, g, h, i) {
      c.ti();
      e.ti();
      g.ti();
      i.ti();
      return 'null';
    },
    IterationStatement_for3var: function(a, b, _var, c, d, e, f, g, h, i) {
      c.ti();
      e.ti();
      g.ti();
      i.ti();
      return 'null';
    },
    IterationStatement_forIn: function(a, b, lhs, c, expr, d, stmt) {
      lhs.ti();
      var type = expr.ti();
      setEnv(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.ti();
      return 'null';
    },
    IterationStatement_forInVar: function(a, b, _var, lhs, c, expr, d, stmt) {
      lhs.ti();
      var type = expr.ti();
      setEnv(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.ti();
      return 'null';
    },
    CallExpression_memberExpExp: function(x, y) {
      return getEnv(x.interval.contents);
    },
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
      return 'dict';
    },
    PropertyAssignment_simple: function (a, b, c) {
      var type = c.ti();
      // console.log(nameSpace);
      // console.log('saving', nameSpace + a.interval.contents);
      setEnv(nameSpace + a.interval.contents, type);
      return type;
    },
  };
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.typeInference = typeInference;
}
