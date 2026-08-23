import * as storage from './storage.js';
import * as overlay from './overlay.js';
import * as capture from './capture.js';
import * as exportMod from './export.js';

export const VERSION = '0.1.0';

let booted = false;
let routeChangeHandler = null;

function currentRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) return hash.slice(1);
  return window.location.pathname + window.location.search;
}

// ── SPA route-change detection ────────────────────────────────

function patchHistory() {
  const wrap = (original) => function (...args) {
    const result = original.apply(this, args);
    window.dispatchEvent(new Event('pinnote:routechange'));
    return result;
  };
  if (!history.pushState.__pn_patched) {
    history.pushState = wrap(history.pushState);
    history.pushState.__pn_patched = true;
  }
  if (!history.replaceState.__pn_patched) {
    history.replaceState = wrap(history.replaceState);
    history.replaceState.__pn_patched = true;
  }
}

function unpatchHistory() {
  // Restore originals if we stored them — see note below
  // For simplicity in v0.1.0 we leave the patches in place after stop()
  // since the patch only emits a harmless custom event.
}

// ── Boot ──────────────────────────────────────────────────────

export function start() {
  if (booted) return;
  booted = true;

  storage.setStorageWarningCallback(() => overlay.showStorageWarning());

  overlay.init({
    getNotes:      () => storage.getAll(),
    getNextNumber: () => storage.nextNoteNumber(),
    onSaveNote:    (text, tag, anchor, position) => {
      const num = storage.nextNoteNumber();
      const id = `note-${String(num).padStart(3, '0')}`;
      const note = {
        id,
        number: num,
        tag,
        status: 'open',
        route: currentRoute(),
        anchor: { selector: anchor.selector, text: anchor.text },
        anchor_confidence: anchor.anchor_confidence,
        position,
        created: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        note: text,
        agent_response: null,
      };
      storage.save(note);
      overlay.addPin(note);
    },
    onUpdateNote: (note) => {
      storage.save(note);
      overlay.updatePin(note);
    },
    onDeleteNote: (id) => {
      storage.remove(id);
      overlay.removePin(id);
    },
    onClearRoute: (route) => {
      storage.clearRoute(route);
      overlay.renderRoute(storage.getAll(), currentRoute());
    },
    onExport: () => {
      const notes = storage.getAll();
      const inIframe = window !== window.top;
      if (!inIframe) {
        exportMod.download(notes, storage.getCustomMetaPrompt());
        overlay.toast(`Exported ${notes.length} notes.`, 'ok');
        return;
      }
      // In an iframe: download likely blocked. Try clipboard, fall back to modal.
      const md = exportMod.generateMarkdown(notes, storage.getCustomMetaPrompt());
      exportMod.copyToClipboard(md).then((ok) => {
        if (ok) {
          overlay.toast('Download blocked in sandbox. Markdown copied to clipboard — paste into a .md file.', 'warn');
        } else {
          overlay.showCopyModal(md, `Export ${notes.length} notes`);
        }
      });
    },
    onLoadFile: (file) => {
      exportMod.loadFile(file).then((notes) => {
        storage.replaceAll(notes);
        overlay.renderRoute(storage.getAll(), currentRoute());
      }).catch((err) => {
        console.error('[PinNote] Failed to load notes.md:', err);
      });
    },
    onWipeAll: () => {
      storage.clearAll();
      overlay.renderRoute([], currentRoute());
    },
    onPersistNote: (note) => {
      storage.save(note);
    },
  });

  overlay.mount();

  const notes = storage.loadAll();
  overlay.renderRoute(notes, currentRoute());

  capture.init((anchor, position) => {
    overlay.openNewNotePopover(anchor, position);
  });

  patchHistory();

  routeChangeHandler = () => {
    overlay.closePopover();
    overlay.renderRoute(storage.getAll(), currentRoute());
  };
  window.addEventListener('pinnote:routechange', routeChangeHandler);
  window.addEventListener('popstate', routeChangeHandler);
  window.addEventListener('hashchange', routeChangeHandler);
}

export function stop() {
  if (!booted) return;
  booted = false;
  capture.destroy();
  overlay.destroy();
  if (routeChangeHandler) {
    window.removeEventListener('pinnote:routechange', routeChangeHandler);
    window.removeEventListener('popstate', routeChangeHandler);
    window.removeEventListener('hashchange', routeChangeHandler);
    routeChangeHandler = null;
  }
}

export function exportNotes() {
  exportMod.download(storage.getAll(), storage.getCustomMetaPrompt());
}

export function load(file) {
  return exportMod.loadFile(file).then((notes) => {
    storage.replaceAll(notes);
    overlay.renderRoute(storage.getAll(), currentRoute());
  });
}

// ── Idempotent re-injection & public API ──────────────────────

if (window.PinNote && typeof window.PinNote.__teardown === 'function') {
  window.PinNote.__teardown();
}

window.PinNote = {
  version: VERSION,
  start,
  stop,
  export: exportNotes,
  load,
  __teardown() {
    stop();
    delete window.PinNote;
  },
};

// Auto-start on injection
start();
