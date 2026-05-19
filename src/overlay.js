import { STYLES } from './styles.js';
import { TAGS, isMac, clearHighlight as captureClearHighlight } from './capture.js';

const ATTR = 'data-pinnote-anno';
const Z = '2147483647';
const MOD = isMac ? '⌘' : 'Ctrl+';
const ALT = isMac ? '⌥' : 'Alt+';

const TAG_COLORS = {
  change: '#dd6b20', remove: '#718096',
  add: '#38a169', unclear: '#3182ce',
};
const STATUS_COLORS = {
  applied: '#38a169', skipped: '#a0aec0', 'needs-clarification': '#d69e2e',
};

const TAG_LABELS = [
  ['change',  `change (${ALT}1)`],
  ['remove',  `remove (${ALT}2)`],
  ['add',     `add (${ALT}3)`],
  ['unclear', `unclear (${ALT}4)`],
];

// ── Module state ───────────────────────────────────────────────

let root = null;
let sidebarEl = null;
let controlEl = null;
let popoverEl = null;
let fileInput = null;
let pinMap = new Map();     // id -> { el, note }
let currentRoute = '';
let showAllFilter = false;
let rafPending = false;
let storageWarnEl = null;
let hoverShowTimer = null;
let hoverHideTimer = null;

// Callbacks wired by index.js
let cbs = {};

export function init(callbacks) {
  cbs = callbacks;
}

// ── Mount / destroy ────────────────────────────────────────────

export function mount() {
  if (document.getElementById('pn-styles')) return; // already mounted
  injectStyles();
  createRoot();
  sidebarEl = buildSidebar();
  root.appendChild(sidebarEl);
  sidebarEl.style.display = 'none';
  controlEl = buildControl();
  root.appendChild(controlEl);
  // Hidden file input for load
  fileInput = el('input', { type: 'file', accept: '.md', class: 'pn-file-input' });
  fileInput.addEventListener('change', onFileInputChange);
  root.appendChild(fileInput);

  window.addEventListener('scroll', scheduleReposition, true);
  window.addEventListener('resize', scheduleReposition);
}

export function destroy() {
  window.removeEventListener('scroll', scheduleReposition, true);
  window.removeEventListener('resize', scheduleReposition);
  cancelShowPopover();
  cancelHidePopover();
  pinMap.clear();
  if (root) { root.remove(); root = null; }
  const styleEl = document.getElementById('pn-styles');
  if (styleEl) styleEl.remove();
  sidebarEl = null; controlEl = null; popoverEl = null; fileInput = null;
  storageWarnEl = null;
  showAllFilter = false;
}

// ── Render pins for current route ─────────────────────────────

export function renderRoute(notes, route) {
  currentRoute = route;
  // Remove all existing pins
  for (const [, { el }] of pinMap) el.remove();
  pinMap.clear();
  // Render pins for current route
  const routeNotes = notes.filter(n => n.route === route);
  for (const note of routeNotes) renderPin(note);
  refreshSidebar(notes);
  refreshCount(notes);
}

export function addPin(note) {
  renderPin(note);
  if (controlEl) refreshCount(cbs.getNotes ? cbs.getNotes() : []);
  if (sidebarEl && sidebarEl.style.display !== 'none') {
    refreshSidebar(cbs.getNotes ? cbs.getNotes() : []);
  }
}

export function removePin(id) {
  const entry = pinMap.get(id);
  if (entry) { entry.el.remove(); pinMap.delete(id); }
  closePopover();
  if (controlEl) refreshCount(cbs.getNotes ? cbs.getNotes() : []);
  if (sidebarEl && sidebarEl.style.display !== 'none') {
    refreshSidebar(cbs.getNotes ? cbs.getNotes() : []);
  }
}

export function updatePin(note) {
  removePin(note.id);
  if (note.route === currentRoute) renderPin(note);
  if (sidebarEl && sidebarEl.style.display !== 'none') {
    refreshSidebar(cbs.getNotes ? cbs.getNotes() : []);
  }
}

export function showStorageWarning() {
  if (storageWarnEl) return;
  storageWarnEl = el('div', { class: 'pn-store-warn', [ATTR]: '1' });
  storageWarnEl.textContent = 'PinNote: localStorage is nearly full. Export notes.md to free space.';
  const close = el('button', { class: 'pn-btn pn-btn-link pn-btn-link-muted', style: 'margin-left:8px;', [ATTR]: '1' });
  close.textContent = '×';
  close.onclick = () => { storageWarnEl.remove(); storageWarnEl = null; };
  storageWarnEl.appendChild(close);
  root && root.appendChild(storageWarnEl);
}

// ── New-note popover ───────────────────────────────────────────

export function openNewNotePopover(anchor, position, targetEl) {
  closePopover();
  captureClearHighlight && captureClearHighlight();

  let currentTag = 'unclear';

  const pop = el('div', { class: 'pn-pop', [ATTR]: '1' });

  const row = el('div', { class: 'pn-pop-row' });
  const numLabel = el('span', { class: 'pn-pop-num' });
  numLabel.textContent = '#?';

  const tagSel = el('select', { class: 'pn-tag-sel', [ATTR]: '1' });
  for (const [val, label] of TAG_LABELS) {
    const opt = el('option', { value: val });
    opt.textContent = label;
    if (val === currentTag) opt.selected = true;
    tagSel.appendChild(opt);
  }
  tagSel.addEventListener('change', () => { currentTag = tagSel.value; });

  row.appendChild(numLabel);
  row.appendChild(tagSel);
  pop.appendChild(row);

  const ta = el('textarea', { class: 'pn-note-ta', placeholder: 'Describe the issue… (Enter to save, Esc to cancel)', rows: '3', [ATTR]: '1' });
  pop.appendChild(ta);

  const hint = el('div', { class: 'pn-pop-hint' });
  hint.textContent = `${ALT}1–5 to change tag  ·  Enter to save  ·  Shift+Enter newline  ·  Esc to cancel`;
  pop.appendChild(hint);

  const actions = el('div', { class: 'pn-pop-actions' });
  const cancelBtn = el('button', { class: 'pn-btn pn-btn-secondary', [ATTR]: '1' });
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closePopover);

  const saveBtn = el('button', { class: 'pn-btn pn-btn-primary', [ATTR]: '1' });
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', save);

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  pop.appendChild(actions);

  function save() {
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    closePopover();
    if (cbs.onSaveNote) cbs.onSaveNote(text, currentTag, anchor, position);
  }

  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closePopover(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); return; }
    if (e.altKey) {
      const digitMatch = e.code.match(/^Digit(\d)$/);
      if (digitMatch) {
        const tagIdx = parseInt(digitMatch[1], 10) - 1;
        if (tagIdx >= 0 && tagIdx < TAGS.length) {
          e.preventDefault();
          currentTag = TAGS[tagIdx];
          tagSel.value = currentTag;
        }
      }
    }
  });

  positionPopover(pop, position);
  root.appendChild(pop);
  popoverEl = pop;
  ta.focus();

  // Update pin number display after save creates the note
  if (cbs.getNextNumber) {
    numLabel.textContent = `#${cbs.getNextNumber()}`;
  }
}

// ── Read/edit popover ─────────────────────────────────────────

export function openReadPopover(note) {
  closePopover();

  const pos = getPinViewportPos(note);
  highlightAnchorEl(note);

  const pop = el('div', { class: 'pn-pop', [ATTR]: '1' });

  // Header row
  const row = el('div', { class: 'pn-pop-row' });
  const numSpan = el('span', { class: 'pn-pop-num' });
  numSpan.textContent = `#${note.number}`;

  const chip = el('span', { class: `pn-chip pn-chip-${note.status}` });
  chip.textContent = note.status;

  const spacer = el('span', { style: 'flex:1' });

  const editBtn = el('button', { class: 'pn-btn pn-btn-secondary', style: 'font-size:11px;padding:3px 8px;', [ATTR]: '1' });
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', (e) => { e.stopPropagation(); closePopover(); openEditPopover(note); });

  const delBtn = el('button', { class: 'pn-btn-icon', [ATTR]: '1', title: 'Delete note' });
  delBtn.textContent = '🗑';
  delBtn.addEventListener('click', () => {
    closePopover();
    if (cbs.onDeleteNote) cbs.onDeleteNote(note.id);
  });

  row.appendChild(numSpan);
  row.appendChild(chip);
  row.appendChild(spacer);
  row.appendChild(editBtn);
  row.appendChild(delBtn);
  pop.appendChild(row);

  const meta = el('div', { class: 'pn-pop-meta' });
  const tagDot = el('span', {
    style: `display:inline-block;width:8px;height:8px;border-radius:50%;background:${pinColor(note)};flex-shrink:0;`
  });
  meta.appendChild(tagDot);
  const metaText = document.createTextNode(` ${note.tag} · ${note.anchor.selector}`);
  meta.appendChild(metaText);
  pop.appendChild(meta);

  const body = el('div', { class: 'pn-note-body' });
  body.textContent = note.note;
  pop.appendChild(body);

  if (note.agent_response) {
    const agentBox = el('div', { class: `pn-agent-box pn-agent-box-${note.status}` });
    const agentLabel = el('strong');
    agentLabel.textContent = 'Agent: ';
    agentBox.appendChild(agentLabel);
    agentBox.appendChild(document.createTextNode(note.agent_response));
    pop.appendChild(agentBox);
  }

  pop.addEventListener('mouseenter', cancelHidePopover);
  pop.addEventListener('mouseleave', scheduleHidePopover);

  positionPopover(pop, pos);
  root.appendChild(pop);
  popoverEl = pop;
}

function openEditPopover(origNote) {
  const pos = getPinViewportPos(origNote);
  highlightAnchorEl(origNote);

  const pop = el('div', { class: 'pn-pop', [ATTR]: '1' });

  const row = el('div', { class: 'pn-pop-row' });
  const numLabel = el('span', { class: 'pn-pop-num' });
  numLabel.textContent = `#${origNote.number}`;

  const tagSel = el('select', { class: 'pn-tag-sel', [ATTR]: '1' });
  for (const [val, label] of TAG_LABELS) {
    const opt = el('option', { value: val });
    opt.textContent = label;
    if (val === origNote.tag) opt.selected = true;
    tagSel.appendChild(opt);
  }

  row.appendChild(numLabel);
  row.appendChild(tagSel);
  pop.appendChild(row);

  const ta = el('textarea', { class: 'pn-note-ta', rows: '3', [ATTR]: '1' });
  ta.value = origNote.note;
  pop.appendChild(ta);

  const hint = el('div', { class: 'pn-pop-hint' });
  hint.textContent = `${ALT}1–5 to change tag  ·  Enter to save  ·  Shift+Enter newline  ·  Esc to cancel`;
  pop.appendChild(hint);

  const actions = el('div', { class: 'pn-pop-actions' });
  const cancelBtn = el('button', { class: 'pn-btn pn-btn-secondary', [ATTR]: '1' });
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closePopover);

  const saveBtn = el('button', { class: 'pn-btn pn-btn-primary', [ATTR]: '1' });
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', save);

  function save() {
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    const updated = { ...origNote, tag: tagSel.value, note: text };
    closePopover();
    if (cbs.onUpdateNote) cbs.onUpdateNote(updated);
  }

  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closePopover(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); return; }
    const modPressed = isMac ? e.metaKey : e.ctrlKey;
    if (modPressed) {
      const tagIdx = parseInt(e.key, 10) - 1;
      if (tagIdx >= 0 && tagIdx < TAGS.length) {
        e.preventDefault();
        tagSel.value = TAGS[tagIdx];
      }
    }
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  pop.appendChild(actions);

  positionPopover(pop, pos);
  root.appendChild(pop);
  popoverEl = pop;
  ta.focus();
}

export function closePopover() {
  cancelShowPopover();
  cancelHidePopover();
  if (popoverEl) { popoverEl.remove(); popoverEl = null; }
  clearAnchorHighlight();
}

// ── Sidebar ────────────────────────────────────────────────────

function buildSidebar() {
  const sidebar = el('div', { class: 'pn-sidebar', [ATTR]: '1' });

  const head = el('div', { class: 'pn-sb-head' });
  const title = el('h3', { class: 'pn-sb-title' });
  title.textContent = 'PinNote';

  const headActions = el('div', { class: 'pn-sb-head-actions' });
  const closeBtn = el('button', { class: 'pn-btn-icon', title: 'Close sidebar', [ATTR]: '1' });
  closeBtn.textContent = '×';
  closeBtn.style.fontSize = '18px';
  closeBtn.addEventListener('click', () => { sidebar.style.display = 'none'; });
  headActions.appendChild(closeBtn);

  head.appendChild(title);
  head.appendChild(headActions);
  sidebar.appendChild(head);

  const routeBar = el('div', { class: 'pn-sb-route', id: 'pn-sb-route' });
  sidebar.appendChild(routeBar);

  const list = el('div', { class: 'pn-sb-list', id: 'pn-sb-list' });
  sidebar.appendChild(list);

  const foot = el('div', { class: 'pn-sb-foot' });

  const footLeft = el('div', { class: 'pn-sb-foot-left' });
  const clearRouteBtn = el('button', { class: 'pn-btn-link pn-btn-link-danger', [ATTR]: '1' });
  clearRouteBtn.textContent = 'Clear all on this route';
  clearRouteBtn.addEventListener('click', () => {
    if (confirm(`Delete all notes on ${currentRoute}?`)) {
      if (cbs.onClearRoute) cbs.onClearRoute(currentRoute);
    }
  });

  const wipeAllBtn = el('button', { class: 'pn-btn-link pn-btn-link-muted', [ATTR]: '1' });
  wipeAllBtn.textContent = 'Wipe all notes';
  wipeAllBtn.addEventListener('click', () => {
    if (confirm('Delete ALL PinNote notes? This cannot be undone.')) {
      if (cbs.onWipeAll) cbs.onWipeAll();
    }
  });

  footLeft.appendChild(clearRouteBtn);
  footLeft.appendChild(wipeAllBtn);

  const showAllLabel = el('label', { class: 'pn-show-all-label' });
  const showAllCb = el('input', { type: 'checkbox', [ATTR]: '1' });
  showAllCb.checked = showAllFilter;
  showAllCb.addEventListener('change', () => {
    showAllFilter = showAllCb.checked;
    if (cbs.getNotes) refreshSidebar(cbs.getNotes());
  });
  showAllLabel.appendChild(showAllCb);
  showAllLabel.appendChild(document.createTextNode(' Show all'));

  foot.appendChild(footLeft);
  foot.appendChild(showAllLabel);
  sidebar.appendChild(foot);

  return sidebar;
}

function refreshSidebar(notes) {
  if (!sidebarEl) return;
  const routeBar = sidebarEl.querySelector('#pn-sb-route');
  const list = sidebarEl.querySelector('#pn-sb-list');
  if (routeBar) routeBar.textContent = currentRoute || window.location.pathname;

  const routeNotes = notes.filter(n => n.route === currentRoute);
  const visible = showAllFilter
    ? routeNotes
    : routeNotes.filter(n => n.status === 'open' || n.status === 'needs-clarification');

  list.innerHTML = '';
  if (visible.length === 0) {
    const empty = el('div', { class: 'pn-sb-empty' });
    empty.textContent = showAllFilter
      ? 'No notes on this route.'
      : 'No open notes. Toggle "Show all" to see resolved notes.';
    list.appendChild(empty);
    return;
  }

  for (const note of visible) {
    const item = el('div', { class: 'pn-sb-item', [ATTR]: '1' });

    const dot = el('span', { class: 'pn-si-dot' });
    dot.style.background = pinColor(note);

    const body = el('div', { class: 'pn-si-body' });
    const meta = el('div', { class: 'pn-si-meta' });
    meta.textContent = `#${note.number} · ${note.tag} · ${note.status}`;

    const text = el('div', { class: 'pn-si-text' });
    text.textContent = note.note;

    body.appendChild(meta);
    body.appendChild(text);

    const delBtn = el('button', { class: 'pn-si-del', title: 'Delete note', [ATTR]: '1' });
    delBtn.textContent = '×';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cbs.onDeleteNote) cbs.onDeleteNote(note.id);
    });

    item.appendChild(dot);
    item.appendChild(body);
    item.appendChild(delBtn);

    item.addEventListener('click', (e) => { e.stopPropagation(); openReadPopover(note); });
    list.appendChild(item);
  }
}

// ── Floating control ───────────────────────────────────────────

function buildControl() {
  const ctl = el('div', { class: 'pn-ctl', [ATTR]: '1' });

  const logo = el('span', { class: 'pn-ctl-logo' });
  logo.textContent = 'PinNote';

  const sep1 = el('span', { class: 'pn-ctl-sep' });

  const count = el('span', { class: 'pn-ctl-count', id: 'pn-ctl-count' });
  count.textContent = '0';

  const sep2 = el('span', { class: 'pn-ctl-sep' });

  const notesBtn = el('button', { class: 'pn-ctl-btn', [ATTR]: '1' });
  notesBtn.textContent = 'Notes';
  notesBtn.addEventListener('click', toggleSidebar);

  const exportBtn = el('button', { class: 'pn-ctl-btn', [ATTR]: '1' });
  exportBtn.textContent = 'Export';
  exportBtn.addEventListener('click', () => { if (cbs.onExport) cbs.onExport(); });

  const loadBtn = el('button', { class: 'pn-ctl-btn', [ATTR]: '1' });
  loadBtn.textContent = 'Load';
  loadBtn.addEventListener('click', () => { if (fileInput) fileInput.click(); });

  ctl.appendChild(logo);
  ctl.appendChild(sep1);
  ctl.appendChild(count);
  ctl.appendChild(sep2);
  ctl.appendChild(notesBtn);
  ctl.appendChild(exportBtn);
  ctl.appendChild(loadBtn);

  // Restore saved position
  try {
    const saved = JSON.parse(sessionStorage.getItem('pinnote:ctl-pos') || 'null');
    if (saved) {
      ctl.style.left = saved.left;
      ctl.style.top = saved.top;
      ctl.style.right = 'auto';
      ctl.style.bottom = 'auto';
    }
  } catch {}

  // Drag to reposition
  let dragOffset = null;
  ctl.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = ctl.getBoundingClientRect();
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    ctl.classList.add('pn-ctl-dragging');
    document.addEventListener('mousemove', onDragMove, true);
    document.addEventListener('mouseup', onDragEnd, true);
  });

  function onDragMove(e) {
    if (!dragOffset) return;
    const x = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - ctl.offsetWidth));
    const y = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - ctl.offsetHeight));
    ctl.style.left = x + 'px';
    ctl.style.top = y + 'px';
    ctl.style.right = 'auto';
    ctl.style.bottom = 'auto';
  }

  function onDragEnd() {
    document.removeEventListener('mousemove', onDragMove, true);
    document.removeEventListener('mouseup', onDragEnd, true);
    ctl.classList.remove('pn-ctl-dragging');
    try {
      sessionStorage.setItem('pinnote:ctl-pos', JSON.stringify({
        left: ctl.style.left, top: ctl.style.top,
      }));
    } catch {}
    dragOffset = null;
  }

  return ctl;
}

function refreshCount(notes) {
  const el = document.getElementById('pn-ctl-count');
  if (el) el.textContent = String(notes.length);
}

function toggleSidebar() {
  if (!sidebarEl) return;
  const isHidden = sidebarEl.style.display === 'none';
  sidebarEl.style.display = isHidden ? '' : 'none';
  if (isHidden && cbs.getNotes) {
    refreshSidebar(cbs.getNotes());
  }
}

// ── Pin rendering ──────────────────────────────────────────────

function renderPin(note) {
  if (note.anchor_confidence !== 'position-only' && findAnchorEl(note) === null) {
    note = { ...note, anchor_confidence: 'position-only' };
    if (cbs.onPersistNote) cbs.onPersistNote(note);
  }

  const pin = el('div', {
    class: 'pn-pin',
    [ATTR]: '1',
    'data-note-id': note.id,
    'data-tag': note.tag,
    'data-status': note.status,
  });

  const label = el('span', { class: 'pn-pin-label' });
  label.textContent = String(note.number);
  pin.appendChild(label);

  positionPin(pin, note);

  pin.addEventListener('click', (e) => {
    e.stopPropagation();
    openReadPopover(note);
  });

  pin.addEventListener('mouseenter', () => {
    highlightAnchorEl(note);
    scheduleShowPopover(note);
  });
  pin.addEventListener('mouseleave', () => {
    clearAnchorHighlight();
    scheduleHidePopover();
  });

  root.appendChild(pin);
  pinMap.set(note.id, { el: pin, note });
}

function positionPin(pinEl, note) {
  const pos = resolvePos(note);
  // Position pin above-left of the anchor coordinates
  pinEl.style.left = (pos.x - 11) + 'px';
  pinEl.style.top  = (pos.y - 26) + 'px';
  if (pos.orphan) pinEl.setAttribute('data-orphan', '1');
  else pinEl.removeAttribute('data-orphan');
}

function resolvePos(note) {
  let el = findAnchorEl(note);
  if (el) {
    const rect = el.getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width * 0.5), y: Math.round(rect.top), orphan: false };
  }
  return { x: note.position.x, y: note.position.y, orphan: true };
}

function findAnchorEl(note) {
  if (!note.anchor || !note.anchor.selector) return null;
  try {
    const hits = document.querySelectorAll(note.anchor.selector);
    if (hits.length === 0) return null;
    if (hits.length === 1) return hits[0];
    // Multiple hits — try text match
    const snippet = (note.anchor.text || '').slice(0, 40);
    for (const h of hits) {
      const hText = (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      if (hText.startsWith(snippet) || snippet.startsWith(hText)) return h;
    }
    return hits[0];
  } catch {
    return null;
  }
}

function scheduleReposition() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    for (const [, { el: pinEl, note }] of pinMap) {
      positionPin(pinEl, note);
    }
  });
}

// ── Anchor element highlight ───────────────────────────────────

let _anchorHighlighted = null;

function highlightAnchorEl(note) {
  clearAnchorHighlight();
  const target = findAnchorEl(note);
  if (target && !target.hasAttribute(ATTR)) {
    target.classList.add('pn-el-hl');
    _anchorHighlighted = target;
  }
}

function clearAnchorHighlight() {
  if (_anchorHighlighted) {
    _anchorHighlighted.classList.remove('pn-el-hl');
    _anchorHighlighted = null;
  }
}

// ── Hover-open timers ──────────────────────────────────────────

function scheduleShowPopover(note) {
  cancelShowPopover();
  cancelHidePopover();
  hoverShowTimer = setTimeout(() => {
    hoverShowTimer = null;
    openReadPopover(note);
  }, 150);
}

function cancelShowPopover() {
  if (hoverShowTimer) { clearTimeout(hoverShowTimer); hoverShowTimer = null; }
}

function scheduleHidePopover() {
  cancelShowPopover();
  hoverHideTimer = setTimeout(() => {
    hoverHideTimer = null;
    closePopover();
  }, 300);
}

function cancelHidePopover() {
  if (hoverHideTimer) { clearTimeout(hoverHideTimer); hoverHideTimer = null; }
}

// ── Popover positioning ────────────────────────────────────────

function positionPopover(pop, pos) {
  // Initial off-screen placement to measure
  pop.style.left = '-9999px';
  pop.style.top  = '-9999px';
  root.appendChild(pop);
  const popW = pop.offsetWidth || 290;
  const popH = pop.offsetHeight || 180;
  root.removeChild(pop);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 10;

  let x = pos.x + 16;
  if (x + popW > vw - margin) x = pos.x - popW - 16;
  x = Math.max(margin, Math.min(x, vw - popW - margin));

  let y = pos.y - Math.round(popH / 2);
  y = Math.max(margin, Math.min(y, vh - popH - margin));

  pop.style.left = x + 'px';
  pop.style.top  = y + 'px';
}

function getPinViewportPos(note) {
  const entry = pinMap.get(note.id);
  if (entry) {
    const rect = entry.el.getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width), y: Math.round(rect.top + rect.height / 2) };
  }
  return resolvePos(note);
}

// ── File input handler ─────────────────────────────────────────

function onFileInputChange(e) {
  const file = e.target.files && e.target.files[0];
  if (file && cbs.onLoadFile) cbs.onLoadFile(file);
  e.target.value = '';
}

// ── Utilities ──────────────────────────────────────────────────

function pinColor(note) {
  if (note.status !== 'open') return STATUS_COLORS[note.status] || '#3182ce';
  return TAG_COLORS[note.tag] || '#3182ce';
}

function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  return node;
}

function injectStyles() {
  const styleEl = document.createElement('style');
  styleEl.id = 'pn-styles';
  styleEl.setAttribute(ATTR, '1');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);
}

function createRoot() {
  const div = document.createElement('div');
  div.id = 'pinnote-root';
  div.setAttribute(ATTR, '1');
  document.body.appendChild(div);
  root = div;

  // Click outside popover closes it
  document.addEventListener('click', (e) => {
    if (popoverEl && !popoverEl.contains(e.target)) {
      closePopover();
    }
  });
}
