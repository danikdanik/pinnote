# PinNote Context

## Glossary

- **Pin** — a small numbered circle rendered on top of a host page, anchored to a DOM element. Visible signifier of a saved note.
- **Note** — the data record behind a pin: `id`, `tag`, `status`, `route`, `anchor`, `anchor_confidence`, `position`, `created`, `note` (text), optional `agent_response`.
- **Anchor** — how a note locates its target. Composed of a CSS selector, the element's text content snippet, and `(x, y)` viewport coordinates as a fallback.
- **Anchor confidence** — how trustworthy the anchor is for re-finding the element. One of `exact` (unique selector + matching text), `text-match` (selector ambiguous but text identifies), `position-only` (anchor lost; only coordinates remain).
- **Tag** — one of five fixed categories: `bug`, `change`, `remove`, `unclear`, `redundant`. Required on every note. Default is `unclear`.
- **Status** — note lifecycle state: `open` (default), `applied`, `skipped`, `needs-clarification`. Updated by the agent during round-trip; can also be reset by the user.
- **Round-trip** — the workflow where the user authors notes, hands `notes.md` to an agent, the agent updates statuses and writes responses, and the user reads the responses to clarify or verify.
- **Light mode** — storage uses localStorage only. No screenshots. Smallest setup, no folder grant required.
- **Dossier mode** — storage uses a user-granted folder via the File System Access API. Folder contains `notes.md` and optional `screenshots/`. Activated lazily when a screenshot is first requested.
- **Dossier** — a per-session folder containing the complete record of a review (notes + screenshots).
- **Host page** — the web page PinNote is injected into.
- **Meta-prompt** — the instructions embedded in `notes.md` frontmatter that tell an AI agent how to process the file (tag semantics, status semantics, the "ask, don't guess" rule). Default ships with PinNote; user-overridable.

## Key invariants

- Every note has a unique UUID `id`.
- Every note has a `status`; status only transitions via user action OR agent round-trip.
- The agent never deletes notes. Only the user deletes.
- The agent must set `status: needs-clarification` and ask via `agent_response` when intent is unclear. Never guess.
- All PinNote-created DOM nodes carry `data-pinnote-anno="1"` and are exempt from Shift+Click capture.
- Coordinates are viewport-relative integers (px).
- `notes.md` is the single source of truth for note data. No JSON sidecar.

## What to read first

1. `AGENTS.md` — commands, code style, architecture, gotchas.
2. `docs/adr/0001` through `docs/adr/0007` — decisions and rationale.
3. `examples/sample-notes.md` — what a finished dossier looks like.
4. `src/index.js` — entry point and composition root.
