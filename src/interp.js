var rbInterp;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  var tokenTypes = require('./types');
}

(function () {
  var env;
  function cast(type, value) {
    if (type === 'string')
      return value.toString();
    else if (type === 'int')
      return parseInt(value);
    else if (type === 'float')
      return parseFloat(value);
    else
      return value;
  }
  function truthy(cond) {
    if (typeof cond !== 'boolean')
      throw new Error('Condition must be of type `bool`');
    return cond;
  }
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
    Program: function(x, y) {
      env = {}; // clear it out
      var lines = y.rb(); return lines[lines.length-1];
    },
    SourceElement: function(x) { return x.rb(); },
    ExpressionStatement: function (x, y) {
      return x.rb();
    },
    Expression: function (x) { return x.rb(); },
    EqualityExpression_equal: (x, y, z) => x.rb() === z.rb(),
    EqualityExpression_notEqual: (x, y, z) => x.rb() !== z.rb(),
    EqualityExpression_eq: (x, y, z) => x.rb() === z.rb(),
    EqualityExpression_notEq: (x, y, z) => x.rb() !== z.rb(),
    RelationalExpression_lt: (a, b, c) => a.rb() < c.rb(),
    RelationalExpression_gt: (a, b, c) => a.rb() > c.rb(),
    RelationalExpression_le: (a, b, c) => a.rb() <= c.rb(),
    RelationalExpression_ge: (a, b, c) => a.rb() >= c.rb(),
    AdditiveExpression_add: (x, _, y) => x.rb() + y.rb(),
    AdditiveExpression_sub: (x, _, y) => x.rb() - y.rb(),
    MultiplicativeExpression_mul: (x, _, y) => x.rb() * y.rb(),
    MultiplicativeExpression_div: function (x, _, y) {
      var retType = arithHelper(x, y);
      var ret = x.rb() / y.rb();
      return retType === 'int' ? Math.floor(ret) : ret;
    },
    MultiplicativeExpression_mod: (x, _, y) => x.rb() % y.rb(),
    UnaryExpression_unaryMinus:  (x, y) => -1 * y.rb(),
    UnaryExpression_unaryPlus:  (x, y) => y.rb(),
    UnaryExpression_lnot:  (x, y) => !y.rb(),
    decimalLiteral_integerOnly: function (x, y) { return parseInt(this.interval.contents); },
    decimalLiteral_bothParts: function (x, y, z, w) { return parseFloat(this.interval.contents); },
    Block: function (a, b, c) { b.rb(); return null; },
    FunctionDeclaration: function (a, id, c, params, e, f, myBody, h) {
      var argList = params.interval.contents.split(/,\s*/);
      var idName = id.interval.contents;
      if (env[idName] !== undefined)
        throw new Error(`redefining ${idName} is not allowed`);
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
        if (!e.hasOwnProperty('val'))
          throw e;
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
      val = val[val.length-1];
      env[x.interval.contents] = val; // override
      return null; // doesn't matter
    },
    Initialiser: function (x, y) {
      var type = y.rb();
      return type;
    },
    EmptyListOf: () => [],
    NonemptyListOf: (first, _sep, others) => [first.rb()].concat(others.rb()),
    TryStatement: function (x) { return x.rb(); },
    TryStatement_tryCatch: function (x, y, z) { y.rb(); z.rb(); return null; },
    TryStatement_tryFinally: function (x, y, z) { y.rb(); z.rb(); return null; },
    TryStatement_tryCatchFinally: function (x, y, z, w) { y.rb(); z.rb(); w.rb(); return null; },
    Catch: function (a, b, c, d, e) { c.rb(); e.rb(); return null; },
    Finally: function (a, b) { b.rb(); return null; },
    ArrayLiteral: function (x, y, z) {
      return y.rb();
    },
    stringLiteral: function (x, y, z) { return eval(this.interval.contents); },
    booleanLiteral: function (x) { return JSON.parse(this.interval.contents); },
    ReturnStatement: (x, y, z, w) => {
      throw { val: z.rb()[0], };
    },
    PostfixExpression_postIncrement: function(a, b, c) {
      return env[a.interval.contents]++;
    },
    PostfixExpression_postDecrement: function(a, b, c) {
      return env[a.interval.contents]--;
    },
    UnaryExpression_preIncrement: function(a, b) {
      return ++env[b.interval.contents];
    },
    UnaryExpression_preDecrement: function(a, b) {
      return --env[b.interval.contents];
    },
    AssignmentExpression_assignment: (x, y, z) => {
      var val = z.rb();
      env[x.interval.contents] = val; // override
      return cast(x.ti(), val);
    },
    identifier: function (x) {
      var ret = env[x.interval.contents];
      if (ret === undefined)
        throw new Error(`${x.interval.contents} is an undefined identifier`);
      var type = this.ti();
      return cast(type, ret);
    },
    IterationStatement: (a) => a.rb(),
    IterationStatement_doWhile: function(a, b, c, d, e, f, g) {
      do b.rb(); while (truthy(e.rb()));
      return null;
    },
    _terminal: () => null,
    IterationStatement_whileDo: function(a, b, c, d, e) {
      while (truthy(c.rb())) {
        e.rb();
      }
      return null;
    },
    IterationStatement_for3: function(a, b, c, d, e, f, g, h, i) {
      // TODO(nate): fix
      for (c.rb(); truthy(e.rb()); g.rb()) {
        i.rb();
      }
      return null;
    },
    IterationStatement_for3var: function(a, b, _var, c, d, e, f, g, h, i) {
      // TODO(nate): fix
      for (c.rb(); truthy(e.rb()); g.rb()) {
        i.rb();
      }
      return null;
    },
    IterationStatement_forIn: function(a, b, lhs, c, expr, d, stmt) {
      // TODO(nate): fix
      lhs.rb();
      var type = expr.rb();
      tokenTypes.setVal(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.rb();
      return null;
    },
    IterationStatement_forInVar: function(a, b, _var, lhs, c, expr, d, stmt) {
      // TODO(nate): fix
      lhs.rb();
      var type = expr.rb();
      tokenTypes.setVal(lhs.interval.contents, type === 'dict' ? 'string' : 'int');
      stmt.rb();
      return null;
    },
    CallExpression_memberExpExp: function(x, y) {
      // TODO(nate): fix this line to use .rb()
      var funDecl = env[x.interval.contents];
      var funInv  = { args: y.rb() };

      if (funDecl.args.length !== funInv.args.length)
        throw new Error('Argument lists must be same length');
      var oldEnv = env;
      env = Object.create(oldEnv);
      for (var k = 0; k < funInv.args.length; k++) {
        env[funDecl.args[k]] = funInv.args[k];
      }
      var ret = funDecl.body.rb(); // execute it with the new environment
      env = oldEnv;

      var type = x.ti();
      if (type === 'string')
        return ret.toString();
      else if (type === 'int')
        return parseInt(ret);
      else if (type === 'float')
        return parseFloat(ret);
      else
        return ret;
    },
    Arguments: (a, b, c) => b.rb(),
    MemberExpression_propRefExp: (a, b, c) => a.rb()[c.interval.contents],
    MemberExpression_arrayRefExp: (a, b, c, d) => a.rb()[c.rb()],
    PrimaryExpression_parenExpr: (x, y, z) => y.rb(),
    ObjectLiteral_noTrailingComma: (a, b, c) => {
      var ret = {};
      b.rb().forEach((x) => {
        ret[x.key] = x.val;
      });
      return ret;
    },
    PropertyAssignment_simple: function (a, b, c) {
      return {
        key: a.interval.contents,
        val: c.rb(),
      };
    },
    ObjectLiteral_trailingComma: (a, b, c, d) => eval(x.interval.contents),
  };
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.rbInterp = rbInterp;
}
