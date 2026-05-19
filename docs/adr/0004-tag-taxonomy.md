# ADR-0004: Five fixed required tags

Date: 2026-05-19
Status: Accepted

## Context

The downstream artifact (`notes.md`) is consumed by an AI coding agent that needs to know what KIND of action each note implies. Free-form tags fragment the export and break agent action-routing. Optional tags produce an "uncategorized" bucket that grows fast and produces no actionable structure.

## Decision

Five fixed tags, with required selection on every note:

| Tag | Meaning |
|---|---|
| `bug` | Something is broken or incorrect. |
| `change` | Keep the element, modify how it works or looks. |
| `remove` | Get rid of this element entirely. |
| `unclear` | Confusing or open question; cannot decide direction yet. |
| `redundant` | Duplicates something elsewhere. |

Default tag on a newly created note is `unclear` (the most neutral; safe default that prompts the user to actively choose if they have a stronger opinion).

Tag selection has two surfaces: a dropdown in the popover, and Cmd/Ctrl+1..5 hotkeys while the popover is focused. Both work; the hotkey hint appears next to each option in the dropdown.

## Consequences

- `src/capture.js` enforces the default and exposes the five tag IDs as constants.
- `src/overlay.js` renders pin colors per tag and shows hotkey hints in the popover.
- `src/export.js` groups notes by `route` and then by tag in the markdown output.
- The agent meta-prompt explains each tag's expected action shape.

## Alternatives considered

- **Free-form tags** — rejected. Fragmentation defeats the structured-export use case.
- **Three-tag minimal set (bug / change / question)** — rejected. Conflates "change" and "remove" (very different agent actions); loses "redundant" as a distinct signal.
- **Optional tags** — rejected. The "Uncategorized" bucket becomes a dumping ground.
- **Default to `bug`** — rejected. Most UX review notes are not bugs; defaulting there biases the export.

## See also

- ADR-0006 (export structure uses tag for grouping)
- ADR-0007 (status flow interacts with tags — `unclear` tagged notes are most likely to round-trip)
