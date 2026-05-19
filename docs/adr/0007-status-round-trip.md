# ADR-0007: Status round-trip and the "ask, don't guess" rule

Date: 2026-05-19
Status: Accepted

## Context

Without a return channel, `notes.md` is fire-and-forget: the user hands it to an agent, the agent does what it can, and the user has no structured way to know what was applied, what was skipped, or what the agent did not understand. Verification falls back to manual code-diffing. The audit trail vanishes.

The user's hard constraint: an agent must never silently guess. If a note's intent is unclear, the agent must stop and ask.

## Decision

Each note carries two mutable fields the agent writes during round-trip:

- `status` — one of `open` (default), `applied`, `skipped`, `needs-clarification`.
- `agent_response` — free text the agent writes to explain a skip, ask a clarifying question, or describe what was applied.

The protocol, encoded in the default meta-prompt:

1. The agent reads `notes.md` and processes each `status: open` note.
2. If the agent applies the change, set `status: applied` and (optionally) describe what was done in `agent_response`.
3. If the agent decides not to apply (out of scope, unsafe, low-confidence anchor), set `status: skipped` and explain why in `agent_response`.
4. If intent is unclear, ambiguous, or the anchor confidence is `position-only`, set `status: needs-clarification` and ASK the question in `agent_response`. Never guess.
5. The agent never deletes notes. Only the user deletes.

The user reloads the dossier in PinNote. Pins are color-coded by status (green = applied, gray = skipped, yellow = needs-clarification, default = open). The sidebar defaults to "open + needs-clarification" so resolved items recede from view but remain on file.

The user answers clarifications by editing the note text, flips `status` back to `open`, and re-exports for a second pass. Loop continues until every note is green or gray.

## Consequences

- `src/export.js` writes the status and agent_response fields for every note.
- `src/overlay.js` renders pins with status-aware colors and filters the sidebar by status.
- `src/storage.js` parses `status` and `agent_response` back from `notes.md` when loading a dossier.
- The default meta-prompt explicitly encodes the protocol AND the "ask, don't guess" rule AND the "agent never deletes" rule.
- The dossier becomes a durable artifact — a complete record of what changed, what didn't, and why.

## Alternatives considered

- **One-way export, no status field** — rejected. No audit trail; no place for the agent to ask questions; verification falls back to manual diffing.
- **Free-form `agent_notes` text only, no status enum** — rejected. Loses programmatic filtering and pin coloring.
- **Agent allowed to delete applied notes** — rejected. Erases history; breaks second-pass workflow; makes verification impossible.
- **`status: in-progress` intermediate state** — rejected for v1. Adds complexity without a clear use case in a synchronous round-trip.

## See also

- ADR-0006 (status fields are part of the single markdown file)
- `examples/sample-notes.md` (shows the protocol in practice)
