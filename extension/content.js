var running = false;

injectScriptTag(chrome.runtime.getURL('errors.js'));

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'start') {
    if (running) {
      sendResponse({ ok: true });
      return;
    }
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL('pinnote.js');
    script.onload = function() {
      running = true;
    };
    (document.head || document.documentElement).appendChild(script);
    sendResponse({ ok: true });
  } else if (message.action === 'stop') {
    if (!running) {
      sendResponse({ ok: true });
      return;
    }
    var script = document.createElement('script');
    script.textContent = 'if (window.PinNote && window.PinNote.stop) window.PinNote.stop()';
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    running = false;
    sendResponse({ ok: true });
  } else if (message.action === 'getNoteCount') {
    sendResponse({ count: getNoteCount() });
  }
});

function injectScriptTag(url) {
  var script = document.createElement('script');
  script.src = url;
  (document.head || document.documentElement).appendChild(script);
}

function getNoteCount() {
  try {
    var raw = localStorage.getItem('pinnote:v1:notes');
    if (raw) {
      var notes = JSON.parse(raw);
      return Array.isArray(notes) ? notes.length : 0;
    }
  } catch (e) {}
  return 0;
}
