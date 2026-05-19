# PinNote

In-page web annotation tool for UX reviews. Drop notes on a running web app, then export them as a structured markdown file an AI coding agent can act on.

PinNote is structured as a two-way comment thread between you and the agent. You write notes by Shift+Clicking on the page. The agent reads them, applies the easy ones, and writes back questions about the unclear ones. Status flows back to PinNote so you can verify, clarify, and iterate.

## Status

Pre-alpha. Spec complete, scaffold in place, implementation in progress.

## Quick start

> Not implemented yet. Once `npm run build` produces `dist/pinnote.js`:
>
> 1. Open the page you want to review in Chrome/Edge/Brave.
> 2. Open DevTools console and paste the contents of `dist/pinnote.js`.
> 3. Shift+Click anywhere on the page to drop a note.
> 4. Use the floating control (bottom-right) to export `notes.md`.

A bookmarklet alternative will be provided in `bookmarklet.html`.

## Concepts

See [CONTEXT.md](CONTEXT.md) for the glossary -- terms like pin, anchor, dossier, round-trip.

## Architecture

See [AGENTS.md](AGENTS.md) for the project-level instructions used by AI coding assistants and human contributors.

Decision records live in [docs/adr/](docs/adr/). Each ADR captures a non-obvious trade-off made during the design phase.

## Browser support

- Light mode (localStorage): any modern browser.
- Dossier mode (folder-backed, screenshots): Chromium-based browsers (Chrome, Edge, Brave). Firefox and Safari fall back to light mode.

## License

MIT. See [LICENSE](LICENSE).
