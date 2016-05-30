var editor;
var jscode;
// these are fake initializations! TODO: make this empty
env = {};

// This will modify the given DOM node to be styled after the given rainbows
// type
function addType(node, type) {
  if (type.type === 'fun') {
    type = type.ret;
  } else if (type.type) {
    type = type.type;
  }

  // because we can't see things above the screen
  var lineNum = domNodeToLineNumber(node);
  node.addClass('hint--' + (lineNum > 2 ? 'top' : 'bottom'));
  node.addClass('hint--rounded');
  node.attr('aria-label', type);

  // add type info & remove old type info
  var m = node.attr('class').match(/^(.*\S*)\s+rb-type-\S+(.*)$/);
  if (m)
    node.attr('class', m[1] + m[2]);
  node.addClass('rb-type-' + type);

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
  if (!env[token])
    return 'unknown';
  else if (!env[token].type)
    return 'unknown';
  else if (env[token].ret)
    return env[token].ret;
  else
    return env[token].type;
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

function makeTypedFun(token, lineNode) {
  var oldType = getEnv(token);
  var myArgs = lineNode.text().match(RegExp(token + '\\(([^)]*)\\)'))[1].split(/,\s*/);
  var myArgTypes = myArgs.map(x => getEnv(x));

  env[token] = {
    type: 'fun',
    ret: oldType,
    args: myArgTypes,
  };
}


function appendTypeClass(originalClassName) {
  $(originalClassName).each(function() {
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
    }
  });
}
function main() {
  // TODO: clear out `env` for any token that isn't currently present

  // literals
  appendTypeClass('.cm-number');
  appendTypeClass('.cm-string');
  appendTypeClass('.cm-atom');

  // definitions (of known ids)
  appendTypeClass('.cm-def');

  // variable references and re-assignments (of known ids)
  appendTypeClass('.cm-variable');
  appendTypeClass('.cm-variable-2');

  // figure out LHS of any assignments (esp. definitions!)
  $('.cm-operator').filter(function() {
    return $(this).text() === "=";
  }).each(function() {
    try {
      var typeRHS = $(this).next().attr('class').match(/rb-type-(\S+)/)[1];
    } catch(e) {
      typeRHS = getEnv($(this).next().text());
    }
    var text = $(this).prev().text();
    if (getEnv(text) !== typeRHS)
      console.warn('warning: types ' + getEnv(text) + ' and ' + typeRHS + ' conflict');
    addType($(this).prev(), typeRHS);
    // if ($(this).next().text()) addType($(this).next(), typeRHS); // for good measure
    setEnv(text, typeRHS);
  });

  // figure out more stuff
}

$(document).ready(function() {
  var code = $('.codemirror-textarea')[0];
  editor = CodeMirror.fromTextArea(code, {
    mode: "rainbows",
    lineNumbers: true
  });
  var output = $('.codemirror-textarea')[1];
  jscode = CodeMirror.fromTextArea(output, {
    readOnly: true,
    lineNumbers: true
  });

  editor.on('change', function() {
    setTimeout(main, 1);
  });

  editor.on('cursorActivity', function() {
    // we selected a new token, so let's show that
    var oldToken = window.currentToken;
    var newToken = getWordUnderCursor().match(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
    newToken = newToken && newToken[0];
    if (!oldToken && newToken) {
      // Update to show the token
      $('.color-changer > #msg').html('<p id="msg">The current token is: <span id="cur-token"></span></p>');
      $('#slider-1').slider('option', 'disabled', false);
      $('#cur-token').text(newToken);
      window.currentToken = newToken;
      updateSlider(null, { value: $('#slider-1').slider('value')} );
    } else if (oldToken && !newToken) {
      // This isn't a valid token, so don't update it
      $('.color-changer > #msg').html('<p id="msg">Please select a token</p>');
      $('#slider-1').slider('option', 'disabled', true);
      window.currentToken = '';
    } else if (newToken) {
      window.currentToken = newToken;
      $('#cur-token').text(newToken);
      updateSlider(null, { value: $('#slider-1').slider('value')} );
    }
  });

  // Run the psuedo type-inference
  main();
});
function selectAll(id) {
  document.getElementById(id).select();
}
