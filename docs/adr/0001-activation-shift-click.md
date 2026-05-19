# ADR-0001: Activation via Shift+Click

Date: 2026-05-19
Status: Accepted

## Context

PinNote runs inside a live web page that the user is actively interacting with. The capture mechanism must distinguish "I am using the app" from "I am authoring a note." Any approach that hijacks normal clicks breaks the host page; any approach that requires explicit mode-switching interrupts the review flow.

## Decision

Shift+Click drops a note. The capture handler `preventDefault` and `stopPropagation` on Shift+Click so the underlying control does not also activate. Normal clicks pass through untouched.

While Shift is held and the cursor hovers an element, that element is visually highlighted (subtle dashed outline) to preview which element will be targeted on click.

## Consequences

- `src/capture.js` owns the keyboard/mouse handler and the pre-click highlight state.
- Native Shift+Click for text selection is unavailable while PinNote is loaded. Users select text with click-drag or keyboard.
- The host page is fully usable during a review; no "annotation mode" toggle is required.

## Alternatives considered

- **Always-on click capture** — rejected. Breaks all normal interaction with the host page.
- **Toggle mode (floating button enters/exits annotation mode)** — rejected. Forces constant mode-switching as the reviewer flows between using the app and noting issues. Adds two extra clicks per note.
- **Hybrid (modifier + toggle)** — rejected for v1. Two ways to do the same thing increase code and onboarding cost without solving a real user need.

## See also

- ADR-0002 (anchor model — defines what gets captured on click)
- ADR-0003 (UI model — pins and sidebar render the captured anchors)
