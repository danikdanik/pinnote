# ADR-0006: Single canonical markdown export, no JSON sidecar

Date: 2026-05-19
Status: Accepted

## Context

The export is consumed primarily by AI coding agents (which parse markdown well) and secondarily by humans reading the dossier. An earlier design proposed dual outputs (`notes.md` for humans, `notes.json` for tools). Dual sources of truth create synchronization hazards: any in-place edit (status round-trip, user edit, agent edit) must keep both files consistent, and one drifts.

## Decision

`notes.md` is the single source of truth. Each note is a structured markdown fragment with key-value lines that are trivially parseable by both AI agents and any future tooling:

```markdown
### note-042 — change
status: open
route: /dashboard/billing
anchor: button.subscribe-cta (text: "Subscribe now")
anchor_confidence: exact
position: x=420, y=680
created: 2026-05-19T07:14Z
note: Move this button below the pricing table, not above.
```

The file opens with YAML frontmatter containing the embedded agent meta-prompt (tag semantics, status semantics, the "ask, don't guess" rule). The user can override the meta-prompt; the default ships with PinNote.

If external tooling needs JSON, derive it post-hoc with a ~20-line parser. Do not pay the dual-source cost upfront.

## Consequences

- `src/export.js` writes only `notes.md`.
- Round-trip updates are in-place markdown edits, not JSON patches.
- Loading a dossier reads `notes.md` directly and parses the per-note fragments back into in-memory note objects.
- The agent meta-prompt is part of every export; user-customized prompts live in localStorage / dossier config.

## Alternatives considered

- **Dual `notes.md` + `notes.json`** — rejected. Synchronization hazard outweighs convenience.
- **JSON only** — rejected. Hostile to human readers and to direct AI-agent consumption.
- **One file per note** — rejected. Fragments the dossier; harder to read, harder to round-trip.

## See also

- ADR-0005 (dossier mode writes this same file live to disk)
- ADR-0007 (round-trip mutates this file in place)
