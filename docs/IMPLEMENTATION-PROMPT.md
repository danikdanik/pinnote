# PinNote Implementation Prompt

Paste this into a fresh Claude Code session opened from `/Users/danik/projects/pinnote/`. It is self-contained — the new session has no memory of the design discussions that produced this scaffold.

---

## Mission

Implement PinNote v0.1.0 — a browser-injected JavaScript annotation tool for in-page UX reviews on running web apps (typically localhost).

The end-user pastes `dist/pinnote.js` into a Chrome DevTools console (or activates a bookmarklet), Shift+Clicks elements on the page to drop notes, and exports the result as a structured markdown file (`notes.md`) that an AI coding agent can read and act on. The export format is a two-way artifact: the agent updates note statuses in place; the user reads the responses and clarifies until every note is resolved.

The scaffold, all design decisions, and the target export format are already in place. Your job is to build the working tool against that spec without re-litigating decisions.

## Read first, in this order

1. `AGENTS.md` — commands, code style, architecture, gotchas. Project-level operating instructions.
2. `CONTEXT.md` — glossary (pin, anchor, note, status, dossier, round-trip, meta-prompt, light mode) and key invariants.
3. `docs/adr/0001` through `docs/adr/0007` — seven decision records with rationale, file impacts, and alternatives considered. Treat these as binding. If you discover a reason to deviate, write a new ADR (e.g., `0008-…`) and present it before implementing.
4. `examples/sample-notes.md` — the canonical export format. The YAML frontmatter (with the embedded `meta_prompt`) and the per-note fragment structure are required, not suggested.

After reading those four, you should be able to answer: how does Shift+Click work, what fields does a note have, what does the export look like, what is round-trip status, why is localStorage the default storage, what does anchor confidence mean.

## v0.1.0 scope

**In:** light mode (localStorage only). The full annotation workflow without folder-backed storage or screenshots.

**Out (deferred to v0.2.0):** File System Access API (dossier mode), screenshots, the "Resume dossier" banner. Light mode is a complete product on its own — notes persist in localStorage, export downloads `notes.md` via the standard browser download mechanism, and load is a file-input that parses a previously-exported `notes.md`.

This scope simplification keeps v0.1.0 cross-browser (works in Firefox/Safari too) and removes the ~30% of complexity that the File System Access API and IndexedDB handle persistence add.

## Implementation order

Build bottom-up so each layer has its dependencies in place when you write it.

1. **`src/styles.js`** — inline CSS for all overlay UI elements as an exported string. No DOM yet. Cover: pin shapes (per tag color), popover, sidebar panel, floating control, element highlight outlines, status-aware pin variants.

2. **`src/overlay.js`** — visual layer. Implement against in-memory mock notes so you can iterate without storage. Required pieces:
   - Pin renderer (positioned next to anchored elements, follows on scroll/resize).
   - Popover (new-note: text input + tag dropdown; existing-note: read view + edit + delete).
   - Sidebar (route-scoped list, default filter = "open + needs-clarification", toggle to show all).
   - Floating control panel (bottom-right corner; count, export button, load button).
   - Overlay container is `pointer-events: none`; interactive children are `pointer-events: auto`.
   - All created DOM nodes carry `data-pinnote-anno="1"` and a high z-index (`2147483647`).
   - Pin colors per tag (bug=red, change=orange, remove=gray, unclear=blue, redundant=purple) and per status (applied=green, skipped=gray, needs-clarification=yellow, open=tag color).

3. **`src/capture.js`** — Shift+Click handler.
   - Captures the click only when the Shift key is held.
   - `preventDefault` + `stopPropagation` so the underlying control does not also activate.
   - Skips when `data-pinnote-anno="1"` is on the target or any ancestor (prevents annotating PinNote's own UI).
   - Builds the three-part anchor: CSS selector (preference order: `[data-testid]` → `[id]` → tag + class chain → structural nth-child path), element `textContent` snippet (first ~80 chars), viewport `(x, y)` integer coordinates.
   - Computes `anchor_confidence`: `exact` if selector resolves to exactly one element AND text matches; `text-match` if selector ambiguous; `position-only` only when re-attaching after the element disappeared.
   - On Shift hover (before click), highlights the would-be target element with a dashed outline.
   - Opens the new-note popover with text input autofocused.
   - Hotkeys while popover is focused: `Cmd/Ctrl+1..5` for tag selection (1=bug, 2=change, 3=remove, 4=unclear, 5=redundant), Enter saves, Shift+Enter newline, Esc cancels. Platform detection: bind `metaKey` on macOS (`navigator.platform.startsWith('Mac')`), `ctrlKey` everywhere else.
   - Default tag for a new note is `unclear`.

4. **`src/storage.js`** — localStorage adapter.
   - Single key per origin: `pinnote:v1:notes`. Value is a JSON array of note objects.
   - On boot: read existing notes; if any, restore them silently.
   - On every note mutation (create / update / delete): persist immediately.
   - Warn (banner) when serialized size approaches the localStorage cap.
   - Public interface should be storage-agnostic so v0.2.0 can plug in the dossier adapter without changing call sites.

5. **`src/export.js`** — markdown generator and parser.
   - Generate `notes.md` matching `examples/sample-notes.md` exactly (frontmatter + per-note fragments). The `meta_prompt` field ships with PinNote's default text (see ADR-0007 and sample-notes.md); user-customized prompts override it.
   - Trigger export via standard browser download (create a Blob, build an object URL, click a synthetic anchor).
   - Parse the same format back: load button accepts a `.md` file, parses frontmatter + fragments, restores all notes into storage and the overlay. Loaded notes may have any status (an external agent has updated them); render accordingly.

6. **`src/index.js`** — composition root.
   - Boot sequence: load notes from storage → render pins for the current route → bind Shift+Click handler → bind route-change listener (for SPAs that use the History API) → render floating control panel.
   - Public API exposed on `window.PinNote`: `start()`, `stop()`, `export()`, `load(file)`, `version`.
   - Idempotent re-injection (pasting the script twice does not duplicate handlers or UI).

## Non-negotiable rules

1. **No mentions of Nomos, Qeso, or any internal project.** Examples use generic routes (`/dashboard`, `/billing`, `/settings/profile`) and generic selectors. The tool is fully standalone OSS.
2. **The default meta-prompt MUST encode "ask, don't guess."** The agent reading the export must understand: if intent is unclear or anchor confidence is `position-only`, set `status: needs-clarification` and ask in `agent_response`. Never silently best-effort.
3. **The default meta-prompt MUST encode "agent never deletes notes."** The dossier is the audit trail. Only the user deletes via the PinNote UI.
4. **All PinNote-created DOM nodes carry `data-pinnote-anno="1"`.** Forgetting this on a new UI element creates an infinite annotation loop where you Shift+Click on a pin and it tries to annotate the pin.
5. **No external runtime dependencies.** `dist/pinnote.js` must be a self-contained IIFE producible by `npm run build`.
6. **Vanilla JavaScript in `src/`. No framework, no TypeScript.** If you want either, write an ADR first.
7. **`notes.md` is the single source of truth.** No JSON sidecar (see ADR-0006).
8. **Notes are never deleted by the tool itself.** Only by an explicit user action via the popover or sidebar.

## Acceptance criteria for v0.1.0

- [ ] `npm install` succeeds; `npm run build` produces `dist/pinnote.js` (single IIFE, <100 KB).
- [ ] Pasting `dist/pinnote.js` into a Chrome console on any localhost page activates PinNote with no errors and no console warnings.
- [ ] Shift+Click on any visible element opens the new-note popover with the text input autofocused.
- [ ] While Shift is held, the element under the cursor highlights (dashed outline). The highlight clears when Shift is released or the click happens.
- [ ] Typing the note text and pressing Enter saves the note. A numbered pin appears next to the element.
- [ ] `Cmd/Ctrl+1..5` changes the tag while the popover is focused; the dropdown also works for mouse selection.
- [ ] Default tag is `unclear`. Pin color matches the tag.
- [ ] Esc on the popover cancels (no note saved).
- [ ] Pins persist across page reloads (localStorage).
- [ ] Pins reposition correctly on viewport resize and scroll. If the anchor element disappears, the pin remains at its last position with a visual orphan marker.
- [ ] Navigating between routes (within an SPA, no full reload) hides pins from other routes and shows pins for the current route.
- [ ] The floating control panel exports `notes.md` matching the structure in `examples/sample-notes.md`.
- [ ] The floating control panel loads a previously-exported `notes.md` via file input. All pins reappear with their statuses preserved.
- [ ] Hovering a pin highlights the anchored element and opens a read-only popover with the note text, tag, status, optional `agent_response`, and edit/delete buttons.
- [ ] User-initiated delete (popover trash button or sidebar X) removes the note immediately, no confirm dialog for individual notes.
- [ ] "Clear all on this route" (sidebar header) prompts a native `confirm()` before clearing.
- [ ] "Wipe all" (floating control menu) prompts a native `confirm()` before wiping all notes.
- [ ] Loaded notes with `status: applied` / `skipped` / `needs-clarification` render pins in the corresponding status colors. Sidebar default filter hides `applied` and `skipped`; toggle reveals them.
- [ ] PinNote does not annotate its own UI elements when Shift+Clicked. (Verify: Shift+Click on a pin, on the sidebar, on the floating control — none of these should create new notes.)
- [ ] Pasting `dist/pinnote.js` twice does not duplicate handlers or UI.

## What NOT to do

- Do not add a UI framework (React, Vue, Svelte, etc.).
- Do not add TypeScript without writing an ADR first.
- Do not add a CSS framework or external stylesheet. Inline strings only.
- Do not add analytics, telemetry, or any network call. PinNote is fully offline.
- Do not change the export format. The sample in `examples/sample-notes.md` is authoritative.
- Do not change the tag list. Five fixed tags, see ADR-0004.
- Do not implement dossier mode, the File System Access API, or screenshots in v0.1.0. Those are v0.2.0.
- Do not delete notes automatically (e.g., after applying). Only user-initiated deletion is allowed.
- Do not introduce a build step beyond esbuild.

## First step

```bash
npm install
npm run dev    # esbuild watch mode → dist/pinnote.js
```

Then start on `src/styles.js`. Write the CSS as a single exported string. Once styles exist, move to `src/overlay.js` with hard-coded mock notes to iterate on the visual layer.

When you have a working pin + popover that renders against mocks, wire `src/capture.js` to actually create notes, then `src/storage.js` to persist them, then `src/export.js` to generate `notes.md`, then `src/index.js` to compose it all.

Build, paste into a real localhost app, exercise every acceptance criterion. When v0.1.0 is feature-complete, commit with the message `feat: v0.1.0 light-mode implementation` and tag `v0.1.0`.
