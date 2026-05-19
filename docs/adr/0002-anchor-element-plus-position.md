# ADR-0002: Notes anchor to an element with a position fallback

Date: 2026-05-19
Status: Accepted

## Context

Notes must survive page reloads, viewport resizes, and minor reflows. Pure pixel coordinates fail at any layout change. Pure CSS selectors fail when class names or DOM structure change. The downstream AI agent reading the export needs an unambiguous handle on the target element, not "the note at (450, 820)."

## Decision

Each note stores three forms of anchoring:

1. **CSS selector** — best-effort unique path to the clicked element (preference order: `[data-testid]` → `[id]` → tag + class chain → structural nth-child path).
2. **Element text snippet** — first ~80 chars of the element's `textContent`, trimmed.
3. **Position fallback** — `(x, y)` viewport-relative integer coordinates at capture time.

An `anchor_confidence` field summarizes which fields are reliable: `exact` (unique selector + text match), `text-match` (selector ambiguous, text identifies), `position-only` (anchor element no longer in DOM; coordinates only).

The export prioritizes selector + text. Coordinates are present but treated as a fallback the agent uses only when explicitly told to.

## Consequences

- `src/capture.js` builds the three-part anchor on Shift+Click.
- `src/overlay.js` re-positions pins on `resize` and `scroll` events using the current element's bounding rect; if the element is missing, falls back to coordinates and marks the pin as orphaned.
- `src/export.js` writes all three fields plus `anchor_confidence` for every note.
- The agent meta-prompt instructs the agent to verify a low-confidence anchor before acting; if confidence is `position-only`, set `status: needs-clarification` and ask.

## Alternatives considered

- **Position-only** — rejected. Brittle across reflows and viewport changes.
- **Selector-only** — rejected. Brittle across utility-class churn (Tailwind, etc.) and structural refactors.
- **DOM path string only** — rejected. Less interpretable to a human reader of the export.

## See also

- ADR-0006 (markdown export format — defines how these fields surface)
- ADR-0007 (status round-trip — defines how confidence drives agent behavior)
