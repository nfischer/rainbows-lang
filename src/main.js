var editor;
var jscode;

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
  var oldType = tokenTypes.getVal(token);
  var myArgs = lineNode.text().match(RegExp(token + '\\(([^)]*)\\)'))[1].split(/,\s*/);
  var myArgTypes = myArgs.map(x => tokenTypes.getVal(x));
  underlineArguments(token, lineNode, myArgTypes);

  tokenTypes.internal[token] = {
    type: 'fun',
    ret: oldType,
    args: myArgTypes,
  };
}


function appendTypeClass(originalClassName) {
  $('#rainbows-editor ' + originalClassName).each(function() {
    var output = $(this).text();
    var literalsMap = {
      '.cm-atom'  : 'bool',
      '.cm-string': 'string',
    };
    if (literalsMap[originalClassName])
      addType($(this), literalsMap[originalClassName]);
    else if (originalClassName === '.cm-number') {
      addType($(this), output.match(/\./) ? 'float' : 'int');
    } else if (originalClassName === '.cm-def') {
      if ($(this).parent().text().match(output + ' *\\(')) {
        makeTypedFun(output, $(this).parent());
      }
      addType($(this), tokenTypes.getVal(output));
    } else {
      addType($(this), tokenTypes.getVal(output));
      if (tokenTypes.internal[output] && tokenTypes.internal[output].type === 'fun') {
        underlineArguments(output, $(this).parent(), tokenTypes.internal[output].args);
      }
    }
  });
}
$(document).ready(function() {
  tokenTypes.refresh(true);
});
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

  // now interpret it
  setTimeout(function() {
    var val = interp(editor.getValue());
    var result;
    if (val === null || val === undefined)
      result = '[no expression value]';
    else
      result = JSON.stringify(val);
    jscode.setValue(result);
  }, 10);
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
  var reservedWords = `
      abstract else instanceof super
      boolean enum int switch
      break export interface synchronized
      byte extends let this
      case false long throw
      catch final native throws
      char finally new transient
      class float null true
      const for package try
      continue function private typeof
      debugger goto protected var
      default if public void
      delete implements return volatile
      do import short while
      double in static with`.split(/[\s\n]+/);

  function colorWord() {
    // we selected a new token, so let's show that
    var oldToken = window.currentToken;
    var newToken = getWordUnderCursor().match(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
    newToken = newToken && newToken[0].trim();
    if (reservedWords.includes(newToken))
      newToken = null;
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
  }

  editor.on('focus', function() {
    colorWord();
  });
  editor.on('mousedown', function() {
    colorWord();
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

var s;
var grammars;
$(document).ready(function() {
  grammars = ohm.grammarsFromScriptElements();
  s = grammars.ES5.semantics();
  s.addOperation(
      'ti()',
      typeInference);
  s.addOperation(
      'rb()',
      rbInterp);
});

function interp(expr) {
  var m = grammars.ES5.match(expr);
  if (m.succeeded()) {
    return s(m).rb();
  } else {
    throw "Error";
  }
}

// This accepts a javascript expression and returns a string denoting its type
function getJsType(expr) {
  var widget;
  var m = grammars.ES5.match(expr);
  if (m.succeeded()) {
    tokenTypes.refresh();
    return s(m).ti();
  }
  //} else {
  //  var timeout;
  //  editor.on('keyHandled', function() {
  //    if(timeout) {
  //      clearTimeout(timeout);
  //      timeout = null;
  //      setTimeout(function() {
  //        if (widget) widget.clear();
  //        widget = null;
  //      }, 200);
  //    }
  //  });
  //  timeout = setTimeout(function() {
  //    if (m.message) {
  //      try {
  //        var lineNum = m.message.match(/Line: (\d+),/)[1];
  //      } catch(e) {
  //        lineNum = 14;
  //      }
  //      var d = document.createElement('div');
  //      d.appendChild(document.createTextNode(m.message));
  //      widget = widget || editor.addLineWidget(parseInt(lineNum), d);
  //    }
  //  }, 30);
}

var updateSlider;
$(document).ready(function() {
  editor.setValue(rbExamples[0].code);
  // Add buttons for the other examples
  var table = document.getElementById('main-table');
  var row = table.insertRow(1);
  var mydiv = document.createElement('div');
  row.appendChild(mydiv);
  rbExamples.forEach(function(ex) {
    var button = document.createElement('button');
    button.appendChild(document.createTextNode(ex.name));
    mydiv.appendChild(button);
    $(button).click(function() {
      tokenTypes.refresh(true);
      editor.setValue(ex.code);
    });
  });
});
$(document).ready(function () {
  var rbTypeList = ['default type', 'string', 'int', 'float', 'bool', 'list', 'dict'];
  var matchingGrey = $('.cm-s-default').css('color');
  var rbColorList = rbTypeList.map(x => $('.rb-type-' + x).css('color') || matchingGrey);
  var node = {}; // hack: use an object here, because of scoping issues
  updateSlider = function (event, ui) {
    var myType = rbTypeList[ui.value];
    node.value.css('background', rbColorList[ui.value]);

    // Remember the user's type selection
    if (myType === 'default type')
      delete tokenTypes.selected[window.currentToken];
    else
      tokenTypes.setVal(window.currentToken, myType, {manual: true});

    addType(node.value, myType); // show the link hint for the slider UI
    addType($('#cur-token'), myType); // show the link hint for the slider UI
    main(); // infer types, but now we'll remember the user's manual change
  }
  $('#slider-1').slider({
    min: 0,
    max: rbTypeList.length - 1,
    value: 0,
    slide: updateSlider,
  });
  node.value = $('.ui-state-default');
  node.value.css('background', matchingGrey);
  $('.ui-widget-content').css('background', '#E0E9EC');
  $('#slider-1').slider('option', 'disabled', true);
})