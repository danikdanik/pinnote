const NOTES_KEY = 'pinnote:v1:notes';
const seen = new Set();

function route() {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) return hash.slice(1);
  return window.location.pathname + window.location.search;
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('[PinNote] Error capture failed to persist:', e);
  }
}

function findMaxErrorNumber(notes) {
  let max = 0;
  for (const n of notes) {
    if (n.id && n.id.startsWith('error-')) {
      const num = parseInt(n.id.slice(6), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return max;
}

function captureError(message, errorObj, source, lineno, colno) {
  const fp = (message || '').slice(0, 200) + '|' + (source || '') + '|' + (lineno || 0);
  if (seen.has(fp)) return;
  seen.add(fp);

  const notes = loadNotes();
  const max = findMaxErrorNumber(notes);
  const num = max + 1;

  let body = message || 'Script error';
  if (source) {
    body += '\nSource: ' + source;
    if (lineno) body += ':' + lineno;
    if (colno) body += ':' + colno;
  }
  if (errorObj && errorObj.stack) {
    body += '\n\nStack:\n' + errorObj.stack;
  }
  body += '\nURL: ' + window.location.href;

  const errorNote = {
    id: 'error-' + String(num).padStart(3, '0'),
    number: num,
    tag: 'error',
    status: 'open',
    route: route(),
    anchor: { selector: '', text: '' },
    anchor_confidence: 'position-only',
    position: { x: 0, y: 0 },
    created: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    note: body,
  };

  notes.push(errorNote);
  saveNotes(notes);
}

window.addEventListener('error', function(event) {
  captureError(
    event.message || String(event.error || 'Script error'),
    event.error,
    event.filename,
    event.lineno,
    event.colno
  );
});

window.addEventListener('unhandledrejection', function(event) {
  var reason = event.reason;
  var msg = reason
    ? (reason.stack || reason.message || String(reason))
    : 'Unhandled Promise rejection';
  captureError(msg, reason, window.location.href, 0, 0);
});
