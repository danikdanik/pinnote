# PinNote

In-page web annotation tool for UX reviews. Drop notes on a running web app, then export them as a structured markdown file an AI coding agent can act on.

PinNote is structured as a two-way comment thread between you and the agent. You write notes by Shift+Clicking on the page. The agent reads them, applies the easy ones, and writes back questions about the unclear ones. Status flows back to PinNote so you can verify, clarify, and iterate.

## Status

v0.1.0 — light mode (localStorage) implemented.

## Quick start

**Playground:** open `examples/playground.html` in your browser. PinNote loads automatically.

**Any page:**

1. Open the page you want to review in Chrome/Edge/Brave.
2. Open DevTools → Sources → Snippets, create a new snippet, paste the contents of `dist/pinnote.js`, and save. Run it with Ctrl+Enter (or right-click → Run). Do this once per Chrome profile — it's always available after that.
3. Shift+Click any element to drop a note.
4. Use the floating control (bottom-right) to export `notes.md`.

**Keyboard shortcuts in the note popover:**

| Shortcut | Action |
|---|---|
| Shift+Click | Drop a new note |
| ⌥1–5 (Mac) / Alt+1–5 (Win/Linux) | Change tag |
| Enter | Save note |
| Shift+Enter | Newline in note text |
| Esc | Cancel / close popover |

A bookmarklet alternative will be provided in `bookmarklet.html`.

## Concepts

See [CONTEXT.md](CONTEXT.md) for the glossary -- terms like pin, anchor, dossier, round-trip.

## Architecture

See [AGENTS.md](AGENTS.md) for the project-level instructions used by AI coding assistants and human contributors.

Decision records live in [docs/adr/](docs/adr/). Each ADR captures a non-obvious trade-off made during the design phase.

## Browser support

- Light mode (localStorage): any modern browser.
- Dossier mode (folder-backed, screenshots): Chromium-based browsers (Chrome, Edge, Brave). Firefox and Safari fall back to light mode.

. See [LICENSE](LICENSE).
