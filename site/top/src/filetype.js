(function(top, module, define) {

function inferScriptType(filename) {
  var mime = mimeForFilename(filename);
  if (/^text\/x-pencilcode/.test(mime)) {
    mime = 'text/coffeescript';
  }
  // Script type attributes do not understand encoding.
  return mime.replace(/;.*$/, '');
}

function wrapTurtle(text, pragmasOnly, previewScript) {
  var result, j, scripts = [], script_pattern =
    /(?:^|\n)#[^\S\n]*@script[^\S\n<>]+(\S+|"[^"\n]*"|'[^'\n]*')/g;
  // Add the default turtle script.
  scripts.push(
    '<script src="//' +
    top.pencilcode.domain + '/turtlebits.js' +
    '">\n<\057script>');
  // Then add any previewScript supplied.
  if (previewScript) {
    for (j = 0; j < previewScript.length; ++j) {
      if (previewScript[j].src) {
        scripts.push(
          '<script src="' + previewScript[j].url +
          '" type="' +
          (previewScript[j].type || inferScriptType(previewScript[j].url)) +
          '">\n<\057script>');
      } else if (previewScript[j].text) {
        scripts.push(
          '<script' +
          (previewScript[j].type ?
              ' type="' + previewScript[j].type + '"' : '') +
          '>\n' +
          previewScript[j].text +
          '\n<\057script>');
      }
    }
  }
  while (null != (result = script_pattern.exec(text))) {
    scripts.push(
      '<script src=' + result[1] +
      ' type="' + inferScriptType(result[1]) +
      '">\n<\057script>');
  }
  result = (
    '<!doctype html>\n<html>\n<body>' +
    scripts.join('') +
    '<script type="text/coffeescript">\n' +
    'window.see && window.see.init(eval(window.see.cs))\n\n' +
    (pragmasOnly ? '' : text) + '\n<\057script></body></html>');
  return result;
}

function modifyForPreview(text, filename, targetUrl, pragmasOnly, pScript) {
  var mimeType = mimeForFilename(filename);
  if (mimeType && /^text\/x-pencilcode/.test(mimeType)) {
    text = wrapTurtle(text, pragmasOnly, pScript);
    mimeType = mimeType.replace(/\/x-pencilcode/, '/html');
  }
  if (!text) return '';
  if (mimeType && !/^text\/html/.test(mimeType)) {
    return '<PLAINTEXT>' + text;
  }
  if (targetUrl && !/<base/i.exec(text)) {
    // Insert a <base href="target_url" /> in a good location.
    var firstLink = text.match(
          /(?:<link|<script|<style|<body|<img|<iframe|<frame|<meta|<a)\b/i),
        insertLocation = [
          text.match(/(?:<head)\b[^>]*>\n?/i),
          text.match(/<html\b[^>]*>\n?/i),
          text.match(/<\!doctype\b[^>]*>\n?/i)
        ],
        insertAt = 0, j, match;
    for (j = 0; j < insertLocation.length; ++j) {
      match = insertLocation[j];
      if (match && (!firstLink || match.index < firstLink.index)) {
        insertAt = match.index + match[0].length;
        break;
      }
    }
    return text.substring(0, insertAt) +
             '<base href="' + targetUrl + '" />\n' +
             text.substring(insertAt);
  }
  return text;
}


function mimeForFilename(filename) {
  var result = filename && filename.indexOf('.') > 0 && {
    'jpg'  : 'image/jpeg',
    'jpeg' : 'image/jpeg',
    'gif'  : 'image/gif',
    'png'  : 'image/png',
    'bmp'  : 'image/x-ms-bmp',
    'ico'  : 'image/x-icon',
    'htm'  : 'text/html',
    'html' : 'text/html',
    'txt'  : 'text/plain',
    'text' : 'text/plain',
    'css'  : 'text/css',
    'coffee' : 'text/coffeescript',
    'js'   : 'text/javascript',
    'xml'  : 'text/xml'
  }[filename.replace(/^.*\./, '')]
  if (!result) {
    result = 'text/x-pencilcode';
  }
  if (/^text\//.test(result)) {
    result += ';charset=utf-8';
  }
  return result;
}

var impl = {
  mimeForFilename: mimeForFilename,
  modifyForPreview: modifyForPreview,
  wrapTurtle: wrapTurtle
};

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
}

})(
  (typeof process) == 'object' ? process : window,
  (typeof module) == 'object' && module,
  (typeof define) == 'function' && define
);
