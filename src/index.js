var editor;
var jscode;

// TODO: actually check for these built-ins
var defaultEnv = {
  range:     { type: 'list' },
  raw_input: { type: 'fun',
               ret: 'string',
               args: [ 'string' ] },
  '*.join':  { type: 'fun',
               ret: 'string',
               args: [] },
};

// This will modify the given DOM node to be styled after the given rainbows
// type
function addType(node, type, opts) {
  opts = opts || {};
  if (type.type === 'fun') {
    type = type.ret;
  } else if (type.type) {
    type = type.type;
  }
  // add type info & remove old type info
  var regex = RegExp('^(.*\\S*)\\s+rb-' +
              (opts.underline ? 'arg-' : '') +
              'type-\\S+(.*)$');
  var m = node.attr('class')
  m = m && m.match(regex);
  if (m) node.attr('class', m[1] + m[2]);
  node.addClass('rb-' + (opts.underline ? 'arg-' : '') + 'type-' + type);

  if (!opts.underline) {
    // because we can't see things above the screen
    var lineNum = domNodeToLineNumber(node);
    node.addClass('hint--' + (lineNum > 2 ? 'top' : 'bottom'));
    node.addClass('hint--rounded');
    node.addClass('hint--bounce');
    node.attr('aria-label', type);
  }
  return node;
}

function domNodeToLineNumber(node) {
  // go up until we get to ".CodeMirror-line"'s parent and look at the text()
  // of the firstChild
  var x = node.closest('.CodeMirror-line');
  if (!x)
    return null;
  try {
    x.parent().children('.CodeMirror-gutter-wrapper').each(function () {
      var ret = parseInt($(this).text());
      if (ret.toString() === $(this).text())
        throw ret;
      });
  } catch (e) {
    return e;
  }
  return null;
}

// TODO: figure out how to get the real DOM-node here
function getWordUnderCursor() {
  var word = editor.findWordAt(editor.getCursor());
  return editor.getRange(word.anchor, word.head);
}

function getEnv(token) {
  var v = env[token] || 'unknown';
  return v.ret || v.type || v;
}

function setEnv(token, value) {
  if (env[token] && env[token].type === 'fun')
    env[token].ret = value;
  else {
    env[token] = {
      type: value,
    };
  }
}

function underlineArguments(funName, line, argTypes) {
  var k = -1;
  if (!argTypes) return;
  line.children().each(function(a, b) {
    var node = $(b);
    if (k < 0 && node.text() === funName) {
      k++;
      return;
    }
    if (k >= argTypes.length) return;
    if (k >= 0 ) {
      addType(node, { type: argTypes[k] } , { underline: true});
      k++;
    }
  });
}

function makeTypedFun(token, lineNode) {
  var oldType = getEnv(token);
  var myArgs = lineNode.text().match(RegExp(token + '\\(([^)]*)\\)'))[1].split(/,\s*/);
  var myArgTypes = myArgs.map(x => getEnv(x));
  underlineArguments(token, lineNode, myArgTypes);

  env[token] = {
    type: 'fun',
    ret: oldType,
    args: myArgTypes,
  };
}


function appendTypeClass(originalClassName) {
  $('#rainbows-editor ' + originalClassName).each(function() {
    var output = $(this).text();
    if (originalClassName === '.cm-number') {
      if ($(this).text().match(/.*\..*/))
        addType($(this), 'float');
      else
        addType($(this), 'int');
    } else if (originalClassName === '.cm-atom') {
      addType($(this), 'bool');
    } else if (originalClassName === '.cm-string') {
      addType($(this), 'string');
    } else if (originalClassName === '.cm-def') {
      if ($(this).parent().text().match(output + ' *\\(')) {
        makeTypedFun(output, $(this).parent());
      }
      addType($(this), getEnv(output));
    } else {
      addType($(this), getEnv(output));
      if (env[output] && env[output].type === 'fun') {
        underlineArguments($(this).text(), $(this).parent(), env[$(this).text()].args);
      }
    }
  });
}
function main() {
  // TODO: clear out `env` for any token that isn't currently present

  getJsType(editor.getValue());

  // literals
  appendTypeClass('.cm-number');
  appendTypeClass('.cm-string');
  appendTypeClass('.cm-atom');

  // definitions (of known ids)
  appendTypeClass('.cm-def');

  // variable references and re-assignments (of known ids)
  appendTypeClass('.cm-variable');
  appendTypeClass('.cm-variable-2');
  appendTypeClass('.cm-property');

  // figure out more stuff

  // now convert it
  setTimeout(function() {
    jscode.setValue(domToText());
  }, 0);
}

$(document).ready(function() {
  var code = $('.codemirror-textarea')[0];
  editor = CodeMirror.fromTextArea(code, {
    mode: 'rainbows',
    lineNumbers: true
  });
  var output = $('.codemirror-textarea')[1];
  jscode = CodeMirror.fromTextArea(output, {
    mode: false, // don't actually parse this text
    readOnly: true,
    lineNumbers: true
  });

  editor.on('change', function() {
    setTimeout(main, 1);
  });

  var sliderMsg = '<p id="msg">Click on a grey variable to assign its type</p>';
  $(document).ready(function () {
    $('.color-changer > #msg').html(sliderMsg);
  });
  editor.on('cursorActivity', function() {
    // we selected a new token, so let's show that
    var oldToken = window.currentToken;
    var newToken = getWordUnderCursor().match(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
    newToken = newToken && newToken[0].trim();
    if (!oldToken && newToken) {
      // Update to show the token
      $('.color-changer > #msg')
          .html('<p id="msg">Drag the slider to color in "<span id="cur-token"></span>"</p>');
      $('#slider-1').slider('option', 'disabled', false);
      $('#cur-token').text(newToken);
      window.currentToken = newToken;
      updateSlider(null, { value: $('#slider-1').slider('value')} );
    } else if (oldToken && !newToken) {
      // This isn't a valid token, so don't update it
      $('.color-changer > #msg').html(sliderMsg);
      $('#slider-1').slider('option', 'disabled', true);
      window.currentToken = '';
    } else if (newToken) {
      window.currentToken = newToken;
      $('#cur-token').text(newToken);
      updateSlider(null, { value: $('#slider-1').slider('value')} );
    }
  });

  $('#rainbows-text').next().attr('id', 'rainbows-editor');

  // Run the psuedo type-inference
  setTimeout(main, 5);
});

function selectAll(id) {
  document.getElementById(id).select();
}

// Find the DOM structure of the rainbows code and serialize this into a sort of
// plain text
function convertNode(node) {
  var myclass = node.attr('class');
  myclass = myclass && myclass.match(/rb-type-(\S+)/);
  var ret = node.text();
  if (myclass) {
    var wrapper = '~' + myclass[1] + '~';
    return wrapper + ret + wrapper;
  } else {
    return ret === '\u200b' ? '' : ret;
  }
}

function domToText() {
  // TODO(nate): refactor this into a functional style
  var serializedLines = [];
  $('#rainbows-editor .CodeMirror-line > span').each(function (num, line) {
    var strVal = [];
    $(line).contents().each(function (x, y) {
      strVal.push(convertNode($(y)));
    });
    serializedLines.push(strVal.join(''));
  });

  var serializedText = serializedLines.join('\n');
  return serializedText;
}
