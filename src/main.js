'use strict';

/* globals $, tokenTypes, CodeMirror, ohm, typeInference, tinycolor, rbExamples, rbInterp */
/* jshint unused: false */
/* eslint no-unused-vars: 0 */
var editor;
var jscode;

var DEFAULT_TYPE = 'inferred type';
var updateSlider;
var outputError;
var m;

var rbTypeList = [DEFAULT_TYPE, 'string', 'int', 'float', 'bool', 'list', 'dict'];
// This will modify the given DOM node to be styled after the given rainbows
// type
function addType(node, type, opts) {
  opts = opts || {};
  if (type.type === 'fun') {
    type = type.ret;
  } else if (type.type) {
    type = type.type;
  }
  var regex = RegExp(
                '^(.*)rb-' +
                (opts.underline ? 'arg-' : '') +
                'type-\\S+(.*)$'
              );
  var match = node.attr('class');
  match = match && match.match(regex);
  if (match) node.attr('class', match[1] + ' ' + match[2]);
  node.addClass('rb-' + (opts.underline ? 'arg-' : '') + 'type-' + type);

  // Add hint info
  if (!opts.underline) {
    // because we can't see things above the screen
    node.addClass('hint--' + (domNodeToLineNumber(node) > 2 ? 'top' : 'bottom'));

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
  if (!x) return null;
  try {
    x.parent().children('.CodeMirror-gutter-wrapper').each(function () {
      var ret = parseInt($(this).text(), 10);
      if (ret.toString() === $(this).text()) throw ret;
    });
  } catch (e) {
    return e;
  }
  return null;
}

function lineNumberToDomNode(num) {
  var line = $('#rainbows-editor .CodeMirror-gutter-wrapper').filter(function (x, y) {
    return $(y).text() === num;
  }).parent().children().next().children();

  return line;
}

// TODO: figure out how to get the real DOM-node here
function getWordUnderCursor() {
  var word = editor.findWordAt(editor.getCursor());
  return editor.getRange(word.anchor, word.head);
}

// TODO(nate): make this actually work correctly
function underlineArguments(funName, line, argTypes) {
  var k = -1;
  var level = 0;
  if (!argTypes) return;
  line.contents().each(function (a, b) {
    var node = $(b);
    var name = node.text();
    if (k < 0 && name === funName) {
      k++;
    } else if (name === ')') {
      k = -1;
    } else if (level === 0 && name.match(/,\s*/)) {
      k++;
    } else if (k >= 0 && name.match(/[{([]\s*/)) {
      level++;
      addType(node, argTypes[k], { underline: true });
    } else if (name.match(/[})[]\s*/)) {
      level--;
      addType(node, argTypes[k], { underline: true });
    } else if (k >= 0) {
      addType(node, argTypes[k], { underline: true });
    }
  });
}

function underlineReturn(type, line) {
  line.contents().each(function (a, b) {
    var node = $(b);
    var name = node.text();
    if (name === 'return') {
      addType(node, type, { underline: true });
    }
  });
}

function appendTypeClass(originalClassName) {
  $('#rainbows-editor ' + originalClassName).each(function () {
    var output = $(this).text();
    var literalsMap = {
      '.cm-keyword': function () {
        return 'keyword';
      },
      '.cm-atom': function () {
        return 'bool';
      },
      '.cm-string': function () {
        return 'string';
      },
      '.cm-number': function (x) {
        return x.match(/\./) ? 'float' : 'int';
      },
    };
    var obj = tokenTypes.getObj(output);
    if (literalsMap[originalClassName]) {
      addType($(this), literalsMap[originalClassName](output));
    } else {
      addType($(this), tokenTypes.getVal(output));
      if (obj.type === 'fun') {
        underlineArguments(output, $(this).parent(), tokenTypes.getObj(output).args);
      }
    }
  });
}

function showOutput(outputStr, type) {
  jscode.setValue(outputStr);
  $('#rainbows-output .CodeMirror-line > span').addClass('rb-type-' + type);
}

function main() {
  // TODO: clear out `env` for any token that isn't currently present
  showOutput('...');
  var resultType = getJsType(editor.getValue());
  tokenTypes.result = resultType;

  // keywords
  appendTypeClass('.cm-keyword');

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

  // underline return statements
  var funName = [];
  var lineNum = 0;
  editor.eachLine(function (lineHandle) {
    lineNum++; // 1, 2, 3, ... (not 0)
    if (!funName) return;
    var contents = editor.getLine(editor.getLineNumber(lineHandle));
    var match1 = contents.match(/^\s*function\s+([a-zA-Z0-9_]+)\s*/);
    var match2 = contents.match(/^\s*return\s+(.*)\s*;/);
    if (match1) {
      funName = [match1[1]].concat(funName);
    } else if (match2) {
      underlineReturn(tokenTypes.getVal(funName[0]), lineNumberToDomNode(editor.getLineNumber(lineHandle) + 1));
    }
  });

  // now interpret it
  if (resultType) {
    // this is null if type inference fails
    setTimeout(function () {
      var val = interp();
      var result;
      if (val === null || val === undefined) {
        result = '[no expression value]';
      } else {
        result = JSON.stringify(val);
      }
      showOutput(result, resultType);
    }, 30);
  } else {
    showOutput('Please fix your type errors');
  }
}

$(document).ready(function () {
  var code = $('.codemirror-textarea')[0];
  editor = CodeMirror.fromTextArea(code, {
    mode: 'rainbows',
    lineNumbers: true,
  });
  var output = $('.codemirror-textarea')[1];
  jscode = CodeMirror.fromTextArea(output, {
    mode: false, // don't actually parse this text
    readOnly: true,
    lineNumbers: true,
  });

  editor.on('change', function () {
    setTimeout(main, 30);
  });

  var sliderMsg = 'Click on a grey variable to assign its type';
  $(document).ready(function () {
    $('.color-changer > #msg').html(sliderMsg);
  });
  var reservedWords = (
      'abstract else instanceof super\n' +
      'boolean enum int switch\n' +
      'break export interface synchronized\n' +
      'byte extends let this\n' +
      'case false long throw\n' +
      'catch final native throws\n' +
      'char finally new transient\n' +
      'class float null true\n' +
      'const for package try\n' +
      'continue function private typeof\n' +
      'debugger goto protected var\n' +
      'default if public void\n' +
      'delete implements return volatile\n' +
      'do import short while\n' +
      'double in static with\n')
    .split(/[\s\n]+/);

  function colorWord() {
    // we selected a new token, so let's show that
    var oldToken = window.currentToken;
    var newToken = getWordUnderCursor().match(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
    newToken = newToken && newToken[0].trim();
    if (reservedWords.includes(newToken)) {
      newToken = null;
    }
    if (!oldToken && newToken) {
      // Update to show the token
      $('.color-changer > #msg')
          .html('Drag the slider to color in "<span id="cur-token"></span>"');
      $('#slider-1').slider('option', 'disabled', false);
      $('#cur-token').text(newToken);
      window.currentToken = newToken;
      updateSlider(null, { value: $('#slider-1').slider('value') });
    } else if (oldToken && !newToken) {
      // This isn't a valid token, so don't update it
      $('.color-changer > #msg').html(sliderMsg);
      $('#slider-1').slider('option', 'disabled', true);
      window.currentToken = '';
    } else if (newToken) {
      window.currentToken = newToken;
      $('#cur-token').text(newToken);
      updateSlider(null, { value: $('#slider-1').slider('value') });
    }
  }

  editor.on('focus', colorWord);
  editor.on('mousedown', colorWord);

  $('#rainbows-text').next().attr('id', 'rainbows-editor');
  $('#jscode').next().attr('id', 'rainbows-output');
});

var s;
var grammars = {};
$(document).ready(function () {
  grammars.Rainbows = ohm.grammarFromScriptElement();
  s = grammars.Rainbows.createSemantics();
  s.addOperation('ti()', typeInference);
  s.addOperation('rb()', rbInterp);
});

function interp() {
  // var m = grammars.Rainbows.match(expr);
  // if (m.succeeded()) {
  //   return s(m).rb();
  // } else {
  //   throw "Error";
  // }
  if (m.succeeded()) {
    try {
      var ret = s(m).rb();
      outputError.hide();
      return ret;
    } catch (e) {
      outputError.show(e);
      return null;
    }
  }
}

window.changeType = 'int';

function getCssVariable(type) {
  var styles = getComputedStyle(document.querySelector('.rb-type-' + type));
  return String(styles.getPropertyValue('color')).trim();
}

function setCssVariable(type, newColor) {
  document.documentElement.style.setProperty('--' + type + '-color', newColor);
}

// change `type` to now be colored as `newColor`, regardless of before
function changeTypeColor(newColor) {
  var evenMode = document.getElementById('even-spread-box').checked;
  var type = window.changeType;
  var newHue = newColor.hsv[0];
  var oldHue = tinycolor(getCssVariable(type)).toHsl().h;
  var hueDiff = newHue - oldHue;
  setCssVariable(type, '#' + newColor);
  if (evenMode) {
    rbTypeList.forEach(function (tName) {
      if (tName === 'inferred type' || tName === type) return;
      // spin every other color's hue to compensate
      setCssVariable(
          tName,
          tinycolor(getCssVariable(tName)).spin(hueDiff).toHslString()
);
    });
  }
}

$(document).ready(function () {
  var node = document.getElementById('typeList');
  rbTypeList.forEach(function (type) {
    if (type === DEFAULT_TYPE) return;
    var d = document.createElement('div');
    d.innerHTML = type;
    d.setAttribute('onclick', "messUpButton('" + type + "')");
    node.appendChild(d);
  });
});

function messUpButton(type) {
  $('#mytype').text(type);
  window.changeType = type;
  var col = getCssVariable(type);
  document.getElementById('color-btn').jscolor.fromString(col);
}

var editorError = (function () {
  var d = document.createElement('div');
  var node = $(d).addClass('playground-error-msg');
  var widget;
  return {
    show: function (msg) {
      node.text(msg);
      if (widget) widget.clear();
      widget = editor.addLineWidget(editor.lineCount() - 1, d);
    },
    hide: function () {
      node.text('');
      if (widget) widget.clear();
    },
  };
}());

// TODO(nate): get this div to display
outputError = (function () {
  var d = document.createElement('div');
  var node = $(d).addClass('playground-error-msg');
  var widget;
  return {
    show: function (msg) {
      node.text(msg);
      console.error(msg);
      if (widget) widget.clear();
      widget = jscode.addLineWidget(1, d);
    },
    hide: function () {
      node.text('');
      if (widget) widget.clear();
    },
  };
}());

// This accepts a javascript expression and returns a string denoting its type
function getJsType(expr) {
  // var widget;
  m = grammars.Rainbows.match(expr);
  if (m.succeeded()) {
    try {
      tokenTypes.refresh();
      var ret = s(m).ti();
      editorError.hide();
      return ret;
    } catch (e) {
      if (e.constructor.name === 'InferenceError') {
        editorError.show(e);
      } else {
        throw e;
      }
      return null;
    }
  }
  // } else {
  //  var timeout;
  //  editor.on('keyHandled', function () {
  //    if(timeout) {
  //      clearTimeout(timeout);
  //      timeout = null;
  //      setTimeout(function () {
  //        if (widget) widget.clear();
  //        widget = null;
  //      }, 200);
  //    }
  //  });
  //  timeout = setTimeout(function () {
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

$(document).ready(function () {
  // Load the first example
  tokenTypes.refresh(true);
  editor.setValue(rbExamples[0].code);

  // Add buttons for the other examples
  var table = document.getElementById('main-table');
  var row = table.insertRow(1);
  var mydiv = document.createElement('div');
  row.appendChild(mydiv);
  rbExamples.forEach(function (ex) {
    var button = document.createElement('button');
    button.appendChild(document.createTextNode(ex.name));
    mydiv.appendChild(button);
    $(button).click(function () {
      tokenTypes.refresh(true);
      editor.setValue(ex.code);
    });
  });
});
$(document).ready(function () {
  var matchingGrey = $('.cm-s-default');
  var rbColorList = rbTypeList.map(function (x) {
    return x === DEFAULT_TYPE ? matchingGrey : $('.rb-type-' + x);
  });
  var node = {}; // hack: use an object here, because of scoping issues
  /* function updateSlider */
  updateSlider = function (event, ui) {
    var myType = rbTypeList[ui.value];
    node.value.css('background', rbColorList[ui.value].css('color'));

    // Remember the user's type selection
    if (myType === DEFAULT_TYPE) {
      delete tokenTypes.selected[window.currentToken];
    } else {
      tokenTypes.setVal(window.currentToken, myType, { manual: true });
    }

    addType(node.value, myType); // show the link hint for the slider UI
    addType($('#cur-token'), myType); // color the token
    if (myType !== DEFAULT_TYPE) messUpButton(myType);

    // infer types, but now we'll remember the user's manual changes
    setTimeout(main, 30);
  };
  $('#slider-1').slider({
    min: 0,
    max: rbTypeList.length - 1,
    value: 0,
    slide: updateSlider,
  });
  node.value = $('.ui-state-default');
  node.value.css('background', matchingGrey.css('color'));
  $('.ui-widget-content').css('background', '#E0E9EC');
  $('#slider-1').slider('option', 'disabled', true);
});

function saveFile() {
  var a = document.createElement('a');
  var file;

  // download the text
  file = new Blob([editor.getValue()], { type: 'text' });
  a.href = URL.createObjectURL(file);
  a.download = 'sample.rain';
  a.click();

  // download the type info
  file = new Blob([tokenTypes.serialize()], { type: 'text/json' });
  a.href = URL.createObjectURL(file);
  a.download = 'sample.raint';
  a.click();
}
