var editor;
var jscode;
// these are fake initializations! TODO: make this empty
env = {};

function addType(node, type) {
  // because we can't see things above the screen
  var lineNum = domNodeToLineNumber(node);
  node.addClass('hint--' + (lineNum > 2 ? 'top' : 'bottom'));
  node.addClass('hint--rounded');

  // add type info
  node.addClass('rb-type-' + type);
  node.attr('aria-label', type);
  return node;
}

function domNodeToLineNumber(node) {
  // go up until we get to ".CodeMirror-line"
  // then go up one more, and look at the text() of the firstChild
  var x = node;
  while (!x.hasClass('CodeMirror-line'))
    x = x.parent();
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

function appendTypeClass(originalClassName) {
  $(originalClassName).each(function() {
    var output = $(this).text();
    var oldClass;
    try {
      if (oldClass = $(this).attr('class').match(/rb-type-\S+/)[0]) {
        $(this).removeClass(oldClass);
      }
    } catch(e) {
    }
    if (originalClassName === '.cm-number') {
      if ($(this).text().match(/.*\..*/))
        addType($(this), 'float');
      else
        addType($(this), 'int');
    } else if (originalClassName === '.cm-atom') {
      addType($(this), 'bool');
    } else if (originalClassName === '.cm-string') {
      addType($(this), 'string');
    } else if (env[output]) {
      addType($(this), env[output]);
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
      typeRHS = env[$(this).next().text()];
    }
    if (typeRHS === undefined)
      return;
    var text = $(this).prev().text();
    if (env[text] && env[text] !== typeRHS)
      console.warn('warning: types ' + env[text] + ' and ' + typeRHS + ' conflict');
    addType($(this).prev(), typeRHS);
    addType($(this).next(), typeRHS); // for safe measure
    env[text] = typeRHS;
  });

  // figure out more stuff
}

$(document).ready(function(){
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
  main();
});
function selectAll(id) {
  document.getElementById(id).select();
}
