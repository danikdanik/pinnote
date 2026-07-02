export const PINNOTE_ATTR = 'data-pinnote-anno';

const TAGS = ['change', 'remove', 'add', 'unclear'];
const isMac = navigator.platform.startsWith('Mac');

let _onNewNote = null;
let _hovered = null;
let _highlighted = null;
let _bound = false;

const handlers = {
  mousemove: onMouseMove,
  keydown: onKeyDown,
  keyup: onKeyUp,
  click: onClick,
};

export function init(onNewNote) {
  _onNewNote = onNewNote;
  if (_bound) return;
  _bound = true;
  document.addEventListener('mousemove', handlers.mousemove, true);
  document.addEventListener('keydown', handlers.keydown, true);
  document.addEventListener('keyup', handlers.keyup, true);
  document.addEventListener('click', handlers.click, true);
}

export function destroy() {
  _bound = false;
  clearHighlight();
  document.removeEventListener('mousemove', handlers.mousemove, true);
  document.removeEventListener('keydown', handlers.keydown, true);
  document.removeEventListener('keyup', handlers.keyup, true);
  document.removeEventListener('click', handlers.click, true);
}

export { TAGS, isMac };

function isPinNoteEl(el) {
  if (!el || typeof el.closest !== 'function') return false;
  if (el.closest(`[${PINNOTE_ATTR}]`) !== null) return true;
  const rootNode = el.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    const host = rootNode.host;
    if (host && host.hasAttribute(PINNOTE_ATTR)) return true;
  }
  return false;
}

function highlightEl(el) {
  if (_highlighted === el) return;
  clearHighlight();
  _highlighted = el;
  el.classList.add('pn-el-hl');
}

export function clearHighlight() {
  if (_highlighted) {
    _highlighted.classList.remove('pn-el-hl');
    _highlighted = null;
  }
}

function onMouseMove(e) {
  _hovered = e.target;
  if (e.shiftKey && !isPinNoteEl(e.target)) {
    highlightEl(e.target);
  } else if (!e.shiftKey) {
    clearHighlight();
  }
}

function onKeyDown(e) {
  if (e.key === 'Shift' && _hovered && !isPinNoteEl(_hovered)) {
    highlightEl(_hovered);
  }
}

function onKeyUp(e) {
  if (e.key === 'Shift') {
    clearHighlight();
  }
}

function onClick(e) {
  if (!e.shiftKey) return;
  if (isPinNoteEl(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  clearHighlight();
  const anchor = buildAnchor(e.target);
  const position = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
  if (_onNewNote) _onNewNote(anchor, position, e.target);
}

export function buildAnchor(el) {
  const selector = buildSelector(el);
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);

  let anchor_confidence = 'text-match';
  try {
    const hits = document.querySelectorAll(selector);
    if (hits.length === 1) {
      const elText = (hits[0].textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const noteText = text.slice(0, 40);
      const textMatches = elText === noteText || elText.startsWith(noteText) || noteText.startsWith(elText);
      anchor_confidence = textMatches ? 'exact' : 'text-match';
    }
  } catch {}

  return { selector, text, anchor_confidence };
}

function buildSelector(el) {
  // 1. data-testid
  if (el.dataset && el.dataset.testid) {
    return `[data-testid="${CSS.escape(el.dataset.testid)}"]`;
  }
  // 2. id
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }
  // 3. Tag + class chain (up to 4 ancestors or until unique)
  const candidate = buildClassChain(el);
  if (candidate) {
    try {
      if (document.querySelectorAll(candidate).length === 1) return candidate;
    } catch {}
  }
  // 4. nth-child structural path
  return buildNthPath(el);
}

function buildClassChain(el) {
  const parts = [];
  let cur = el;
  let depth = 0;
  while (cur && cur !== document.documentElement && depth < 4) {
    if (cur.id) {
      parts.unshift(`#${CSS.escape(cur.id)}`);
      break;
    }
    const tag = cur.tagName.toLowerCase();
    let part = tag;
    if (cur.className && typeof cur.className === 'string') {
      const classes = cur.className.trim().split(/\s+/)
        .filter(c => c && !/^(js-|is-|has-)/.test(c))
        .slice(0, 3);
      if (classes.length > 0) part += '.' + classes.join('.');
    }
    parts.unshift(part);
    cur = cur.parentElement;
    depth++;
  }
  return parts.join(' > ') || null;
}

function buildNthPath(el) {
  const parts = [];
  let cur = el;
  while (cur && cur !== document.documentElement && parts.length < 5) {
    const tag = cur.tagName.toLowerCase();
    const parent = cur.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
    if (siblings.length > 1) {
      parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(cur) + 1})`);
    } else {
      parts.unshift(tag);
    }
    cur = parent;
  }
  return parts.join(' > ') || el.tagName.toLowerCase();
}
