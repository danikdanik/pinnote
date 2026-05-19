# PinNote

## What this is

A browser-injected JavaScript tool for annotating web pages during UX reviews. Notes anchor to DOM elements, persist in localStorage (light mode) or a folder via the File System Access API (dossier mode), and export to a structured markdown file designed for AI coding agents to consume and act on.

The export is a two-way artifact: the user authors notes, the agent updates status fields in place, the user reads responses and clarifies. Round-trip continues until every note is resolved.

## Commands

- `npm install` — install dev dependencies (esbuild only).
- `npm run build` — bundle `src/` to `dist/pinnote.js` as a single IIFE for console paste / bookmarklet.
- `npm run dev` — build with watch.
- `npm run clean` — wipe `dist/`.

## Code style

- Vanilla JavaScript. ES modules in `src/`. Bundled with esbuild to a single IIFE for `dist/`.
- No external runtime dependencies. Everything in `dist/pinnote.js` must be self-contained.
- All DOM nodes created by PinNote carry the attribute `data-pinnote-anno="1"`. The capture handler MUST skip these to avoid annotating PinNote's own UI.
- Class names are not load-bearing; use `data-*` attributes for behavior hooks.

## Architecture

- `src/index.js` — composition root; boot sequence, public API surface.
- `src/capture.js` — Shift+Click handler, element identification, anchor metadata builder.
- `src/overlay.js` — pins, popovers, sidebar, floating control panel; status-aware rendering.
- `src/storage.js` — light mode (localStorage) and dossier mode (File System Access API); transition logic.
- `src/export.js` — markdown generator; per-note schema, frontmatter, embedded agent meta-prompt.
- `src/styles.js` — inline CSS for the overlay UI (kept inline to avoid extra requests).

## Gotchas

- PinNote-created DOM is exempt from capture via `data-pinnote-anno="1"`. Forgetting this attribute on a new UI element creates an infinite annotation loop.
- Coordinates are viewport-relative integers (px). Not document-relative, not percentages.
- The directory handle for dossier mode lives in IndexedDB and requires a fresh user gesture each session to re-grant permission.
- The agent must never delete notes — only the user does. The meta-prompt encodes this.
- If a note's intent is unclear, the agent must set `status: needs-clarification` and ask via `agent_response`. Never guess.

## Workflow

- Read the decision records in `docs/adr/` before changing core behaviors.
- See `CONTEXT.md` for the glossary.
- See `examples/sample-notes.md` for the canonical export format.
- Run `npm run build` before testing in a browser.
