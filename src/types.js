var tokenTypes = {
  builtin: {
    range: { type: 'list' },
    raw_input: {
                 type: 'fun',
                 ret: 'string',
                 args: ['string'],
    },
    'mylist#join': {
                 type: 'fun',
                 ret: 'string',
                 args: [],
    },
    'print': {
                 type: 'fun',
                 ret: 'unknown',
                 args: [],
    },
  },
  refresh: function (hard) {
    this.inferred = Object.create(this.builtin);
    if (hard) {
      this.selected = Object.create(this.inferred);
      this.internal = this.selected;
    } else {
      this.internal = this.selected;
    }
  },
  load: function (obj) {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }
    this.result = obj.result;
    this.builtin = obj.builtin;
    this.inferred = obj.inferred;
    this.selected = obj.selected;
  },
  serialize: function () {
    var that = this;
    return JSON.stringify({
        result: that.result,
        builtin: that.builtin,
        inferred: that.inferred,
        selected: that.selected,
      });
  },
  getObj: function (token) {
    // TODO(nate): fix this to use .internal
    var v;
    if (this.selected.hasOwnProperty(token)) {
      v = this.selected[token];
    } else if (this.inferred.hasOwnProperty(token)) {
      v = this.inferred[token];
    } else if (this.builtin.hasOwnProperty(token)) {
      v = this.builtin[token];
    } else {
      v = 'unknown';
    }
    // var v = this.internal[token] || 'unknown';
    return v;
  },
  getVal: function (token) {
    var v = this.getObj(token);
    return v.ret || v.type || v;
  },
  setVal: function (token, value, opts) {
    opts = opts || {};
    var obj = (opts.manual ? this.selected : this.inferred);
    if (this.inferred[token] && this.inferred[token].type === 'fun') {
      if (opts.manual) {
        var that = this;
        this.selected[token] = this.selected[token] || {
          name: token,
          type: 'fun',
          get args() {
            return that.inferred[token].args;
          },
        };
      }
      obj[token].ret = value;
    } else if (obj[token]) {
      obj[token].type = value;
    } else {
      obj[token] = {
        name: token,
        type: value,
      };
    }
  },
};

tokenTypes.refresh(true);

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = tokenTypes;
}
