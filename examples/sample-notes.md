---
pinnote_session: 2026-05-19-sample
created: 2026-05-19T07:14Z
total_notes: 5
by_tag: { bug: 1, change: 2, remove: 1, unclear: 1, redundant: 0 }
by_status: { open: 3, applied: 1, skipped: 0, needs-clarification: 1 }

meta_prompt: |
  You are an AI coding agent processing a PinNote review file. Each note below
  describes a UX issue or change request anchored to a DOM element on a host
  web page.

  Tag semantics:
    bug         — something is broken or incorrect; fix it.
    change      — modify the element's behavior or appearance per the note.
    remove      — delete the element entirely.
    unclear     — open question; treat as a discussion item.
    redundant   — element duplicates something elsewhere; investigate before acting.

  Status semantics (you write back to this file):
    open                  — initial state; act on these.
    applied               — you made the change. Optionally describe in agent_response.
    skipped               — you decided not to act. Explain why in agent_response.
    needs-clarification   — you do not understand the intent or the anchor confidence
                            is too low to act safely. ASK in agent_response. Do not guess.

  Hard rules:
    1. If anything is unclear or ambiguous, set status to needs-clarification and ASK.
       Never silently guess. The default failure mode is to ASK, not to ACT.
    2. Do not delete notes. Only the user deletes. You update status in place.
    3. Preserve all fields. Edit only status and agent_response.
    4. Notes with anchor_confidence: position-only must be confirmed before acting.
---

# UX Review

## /dashboard (2 notes)

### note-001 — bug
status: applied
route: /dashboard
anchor: span.stat-card-value (text: "127")
anchor_confidence: exact
position: x=420, y=180
created: 2026-05-19T07:14Z
note: The stat shows 127 but the underlying query returns 124. Off-by-three somewhere upstream.
agent_response: Fixed. The aggregation was counting deleted rows. Filtered them out in src/lib/stats.ts:42.

### note-002 — change
status: open
route: /dashboard
anchor: button.refresh (text: "Refresh")
anchor_confidence: exact
position: x=1180, y=80
created: 2026-05-19T07:18Z
note: Move this button next to the date range picker, not floating at the top right.

## /billing (2 notes)

### note-003 — change
status: needs-clarification
route: /billing
anchor: div.invoice-table (text: "Invoice  Date  Amount  Status")
anchor_confidence: text-match
position: x=200, y=320
created: 2026-05-19T07:21Z
note: This table feels cluttered. Tidy it up.
agent_response: "Tidy it up" is too vague to act on safely. Specifically — do you want fewer columns, more whitespace between rows, a different visual hierarchy, or something else? Please clarify which dimensions feel cluttered.

### note-004 — remove
status: open
route: /billing
anchor: section.legacy-banner (text: "We are migrating our billing system…")
anchor_confidence: exact
position: x=0, y=64
created: 2026-05-19T07:23Z
note: Migration finished last quarter. Remove the banner.

## /settings/profile (1 note)

### note-005 — unclear
status: open
route: /settings/profile
anchor: button.danger-delete (text: "Delete account")
anchor_confidence: exact
position: x=420, y=720
created: 2026-05-19T07:28Z
note: Should this require a typed confirmation (typing the user's email) before submitting? Currently just a confirm dialog.
