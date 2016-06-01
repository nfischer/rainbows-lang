var tokenTypes = {
  builtin: {
    range:     { type: 'list' },
    raw_input: { type: 'fun',
                 ret: 'string',
                 args: [ 'string' ] },
    '*.join':  { type: 'fun',
                 ret: 'string',
                 args: [] },
    'print':   { type: 'fun',
                 ret: 'unknown',
                 args: [] },
  },
  refresh: function(hard) {
    this.inferred = Object.create(this.builtin);
    if (hard) {
      this.selected = Object.create(this.inferred);
      this.internal = this.selected;
    } else {
      this.internal = this.selected;
    }
  },
  getVal: function(token) {
    // TODO(nate): fix this to use .internal
    if (this.internal.hasOwnProperty(token))
      v = this.internal[token];
    else if (this.inferred.hasOwnProperty(token))
      v = this.inferred[token];
    else
      v = 'unknown';
    // var v = this.internal[token] || 'unknown';
    return v.ret || v.type || v;
  },
  setVal: function(token, value, opts) {
    opts = opts || {};
    var obj = (opts.manual ? this.selected : this.inferred);
    if (obj[token] && obj[token].type === 'fun') {
      obj[token].ret = value;
    } else {
      obj[token] = {
        type: value,
      };
    }
  },
};

tokenTypes.refresh(true);

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = tokenTypes;
}
