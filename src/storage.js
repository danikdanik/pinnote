const NOTES_KEY = 'pinnote:v1:notes';
const META_PROMPT_KEY = 'pinnote:v1:meta_prompt';
const WARN_BYTES = 4 * 1024 * 1024;

let notes = [];
let storageWarningCb = null;

export function setStorageWarningCallback(fn) {
  storageWarningCb = fn;
}

export function loadAll() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch {
    notes = [];
  }
  return notes.slice();
}

export function getAll() {
  return notes.slice();
}

export function save(note) {
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.push(note);
  persist();
}

export function remove(id) {
  notes = notes.filter(n => n.id !== id);
  persist();
}

export function clearRoute(route) {
  notes = notes.filter(n => n.route !== route);
  persist();
}

export function clearAll() {
  notes = [];
  try { localStorage.removeItem(NOTES_KEY); } catch {}
}

export function replaceAll(newNotes) {
  notes = newNotes;
  persist();
}

export function nextNoteNumber() {
  if (notes.length === 0) return 1;
  const max = notes.reduce((m, n) => {
    const num = parseInt(n.id.replace('note-', ''), 10);
    return isNaN(num) ? m : Math.max(m, num);
  }, 0);
  return max + 1;
}

export function getCustomMetaPrompt() {
  try { return localStorage.getItem(META_PROMPT_KEY); } catch { return null; }
}

export function setCustomMetaPrompt(text) {
  try {
    if (text) localStorage.setItem(META_PROMPT_KEY, text);
    else localStorage.removeItem(META_PROMPT_KEY);
  } catch {}
}

function persist() {
  try {
    const serialized = JSON.stringify(notes);
    localStorage.setItem(NOTES_KEY, serialized);
    if (serialized.length * 2 > WARN_BYTES && storageWarningCb) {
      storageWarningCb();
    }
  } catch (e) {
    if (storageWarningCb) storageWarningCb();
  }
}
