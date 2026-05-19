export const STYLES = `
#pinnote-root, #pinnote-root * { box-sizing: border-box; }

#pinnote-root {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

/* ── Pins ───────────────────────────────────────────────────── */

.pn-pin {
  position: fixed;
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,.35);
  border: 2px solid rgba(255,255,255,.75);
  transition: box-shadow .1s;
  z-index: 2147483647;
}
.pn-pin:hover { box-shadow: 0 2px 8px rgba(0,0,0,.5); }

.pn-pin-label {
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  user-select: none;
  pointer-events: none;
}

.pn-pin[data-tag="bug"]       { background: #e53e3e; }
.pn-pin[data-tag="change"]    { background: #dd6b20; }
.pn-pin[data-tag="remove"]    { background: #718096; }
.pn-pin[data-tag="unclear"]   { background: #3182ce; }
.pn-pin[data-tag="redundant"] { background: #805ad5; }

.pn-pin[data-status="applied"]             { background: #38a169; }
.pn-pin[data-status="skipped"]             { background: #a0aec0; }
.pn-pin[data-status="needs-clarification"] { background: #d69e2e; }

.pn-pin[data-orphan="1"] { opacity: .5; border-style: dashed; }

/* ── Element highlight (Shift-hover or pin-hover) ───────────── */

.pn-el-hl {
  outline: 2px dashed #3182ce !important;
  outline-offset: 2px !important;
}

/* ── Popover ────────────────────────────────────────────────── */

.pn-pop {
  position: fixed;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,.14);
  padding: 12px;
  width: 290px;
  z-index: 2147483647;
  pointer-events: auto;
}

.pn-pop-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.pn-pop-num {
  font-size: 11px;
  font-weight: 700;
  color: #a0aec0;
  flex-shrink: 0;
}

.pn-tag-sel {
  flex: 1;
  padding: 3px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  outline: none;
  cursor: pointer;
  font-family: inherit;
}
.pn-tag-sel:focus { border-color: #3182ce; }

.pn-note-ta {
  width: 100%;
  min-height: 68px;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  color: #2d3748;
  display: block;
}
.pn-note-ta:focus { border-color: #3182ce; }

.pn-pop-hint {
  font-size: 10px;
  color: #a0aec0;
  margin-top: 4px;
}

.pn-pop-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  justify-content: flex-end;
  align-items: center;
}

.pn-btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.4;
}
.pn-btn-primary   { background: #3182ce; color: #fff; }
.pn-btn-primary:hover   { background: #2b6cb0; }
.pn-btn-secondary { background: #e2e8f0; color: #2d3748; }
.pn-btn-secondary:hover { background: #cbd5e0; }
.pn-btn-danger    { background: #fff5f5; color: #e53e3e; border-color: #feb2b2; }
.pn-btn-danger:hover    { background: #fed7d7; }
.pn-btn-icon      { background: none; border: none; cursor: pointer; padding: 2px 5px;
                    color: #a0aec0; font-size: 15px; line-height: 1; }
.pn-btn-icon:hover { color: #e53e3e; }

/* Read popover body */
.pn-pop-meta {
  font-size: 10px;
  color: #a0aec0;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pn-note-body {
  font-size: 12px;
  color: #2d3748;
  line-height: 1.55;
  white-space: pre-wrap;
  margin: 6px 0;
}

.pn-agent-box {
  margin-top: 8px;
  padding: 7px 9px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.5;
}
.pn-agent-box-applied             { background: #f0fff4; border-left: 3px solid #38a169; color: #276749; }
.pn-agent-box-skipped             { background: #f7fafc; border-left: 3px solid #a0aec0; color: #4a5568; }
.pn-agent-box-needs-clarification { background: #fffbeb; border-left: 3px solid #d69e2e; color: #744210; }

/* Status chips */
.pn-chip {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.pn-chip-open               { background: #ebf8ff; color: #2b6cb0; }
.pn-chip-applied            { background: #f0fff4; color: #276749; }
.pn-chip-skipped            { background: #edf2f7; color: #718096; }
.pn-chip-needs-clarification { background: #fffbeb; color: #744210; }

/* ── Sidebar ────────────────────────────────────────────────── */

.pn-sidebar {
  position: fixed;
  top: 0; right: 0;
  width: 300px; height: 100%;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -2px 0 16px rgba(0,0,0,.08);
  z-index: 2147483646;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pn-sb-head {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.pn-sb-title {
  font-size: 12px; font-weight: 700; color: #2d3748; margin: 0;
}
.pn-sb-head-actions { display: flex; gap: 4px; align-items: center; }

.pn-sb-route {
  font-size: 10px; color: #a0aec0;
  padding: 4px 12px;
  border-bottom: 1px solid #f7fafc;
  flex-shrink: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.pn-sb-list {
  overflow-y: auto;
  flex: 1;
  padding: 3px 0;
}

.pn-sb-empty {
  font-size: 12px; color: #a0aec0;
  text-align: center; padding: 24px 12px;
}

.pn-sb-item {
  padding: 7px 10px 7px 12px;
  border-bottom: 1px solid #f7fafc;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  cursor: pointer;
}
.pn-sb-item:hover { background: #f7fafc; }

.pn-si-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}

.pn-si-body { flex: 1; min-width: 0; }
.pn-si-meta { font-size: 9px; color: #a0aec0; margin-bottom: 2px; }
.pn-si-text { font-size: 11px; color: #2d3748; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.pn-si-del {
  background: none; border: none; cursor: pointer;
  color: #cbd5e0; font-size: 14px; line-height: 1;
  padding: 0; flex-shrink: 0; margin-top: 1px;
}
.pn-si-del:hover { color: #e53e3e; }

.pn-sb-foot {
  padding: 7px 12px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.pn-btn-link {
  font-size: 10px; background: none; border: none;
  cursor: pointer; padding: 0; font-family: inherit;
}
.pn-btn-link-danger { color: #e53e3e; }
.pn-btn-link-danger:hover { text-decoration: underline; }
.pn-btn-link-muted  { color: #718096; }
.pn-btn-link-muted:hover { text-decoration: underline; }

.pn-show-all-label {
  font-size: 10px; color: #718096;
  display: flex; align-items: center; gap: 4px; cursor: pointer;
  user-select: none;
}

/* ── Floating control ───────────────────────────────────────── */

.pn-ctl {
  position: fixed;
  bottom: 20px; right: 20px;
  background: #1a202c;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 2147483647;
  pointer-events: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
  user-select: none;
  cursor: move;
}
.pn-ctl-dragging { cursor: grabbing !important; }

.pn-ctl-logo {
  font-size: 11px; font-weight: 800;
  color: #63b3ed; letter-spacing: .04em;
}

.pn-ctl-sep {
  width: 1px; height: 14px;
  background: #4a5568; flex-shrink: 0;
}

.pn-ctl-count {
  font-size: 11px; font-weight: 700;
  background: #2d3748;
  padding: 1px 7px;
  border-radius: 5px;
  min-width: 22px; text-align: center;
}

.pn-ctl-btn {
  background: none; border: none;
  color: #a0aec0; font-size: 11px;
  cursor: pointer; padding: 2px 7px;
  border-radius: 5px;
  font-family: inherit; font-weight: 500;
}
.pn-ctl-btn:hover { background: #2d3748; color: #e2e8f0; }

/* Storage warning */
.pn-store-warn {
  position: fixed;
  bottom: 64px; right: 20px;
  background: #fffbeb;
  border: 1px solid #d69e2e;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 11px; color: #744210;
  z-index: 2147483647;
  pointer-events: auto;
  max-width: 280px;
}

/* Load file input (hidden) */
.pn-file-input { display: none; }
`;
