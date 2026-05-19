# ADR-0005: Light mode by default, dossier mode lazily on screenshot demand

Date: 2026-05-19
Status: Accepted

## Context

localStorage caps at ~5 MB per origin. Plain text notes fit easily; screenshots do not. Prompting the user to choose a folder at script start adds friction to a tool whose appeal is "paste and start clicking." Asking the user to pick a folder they may never need is a tax.

## Decision

Two storage modes:

- **Light mode (default)** — localStorage only. Notes survive page reloads and tab refreshes. Screenshots are not supported. No folder grant required.
- **Dossier mode** — a user-granted folder via the File System Access API. The folder contains `notes.md` (live-written) and `screenshots/` (PNG per note). Activated lazily on the first screenshot request.

Transition rules:

- The folder picker is presented the first time the user clicks a screenshot action. If granted, all existing notes migrate to the folder's `notes.md`, and future notes write through to both the folder and localStorage (localStorage as a refresh-safety mirror). If declined, the screenshot is not taken; light mode continues unchanged.
- The directory handle is persisted in IndexedDB. On a subsequent session, PinNote offers a "Resume dossier" banner; the user clicks once to re-grant permission.
- A "Load dossier…" entry in the floating control opens the directory picker for arbitrary past sessions.

## Consequences

- `src/storage.js` implements two adapters with a common interface; the active adapter is selected at runtime.
- localStorage usage above ~4 MB triggers a banner urging the user to upgrade to dossier mode.
- Browser support split: dossier mode is Chromium-only (Chrome, Edge, Brave). Firefox and Safari users stay in light mode.

## Alternatives considered

- **Always prompt for a folder at start** — rejected. Adds friction to the simple case.
- **localStorage only, with a base64 screenshot mode** — rejected. localStorage cap is too small; silent eviction destroys session integrity.
- **Embedded local companion server** — rejected. Install/run friction defeats the "paste and go" model.

## See also

- ADR-0006 (markdown export — same file is the live notes.md in dossier mode)
- ADR-0007 (status round-trip relies on a stable `notes.md` location)
