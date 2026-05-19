# ADR-0003: UI is numbered pins plus a collapsible sidebar

Date: 2026-05-19
Status: Accepted

## Context

Notes need to be visible enough to support spatial recall ("the comment is on THIS button") but unobtrusive enough that the reviewer can still see and use the host page. Inline sticky-note widgets that always show the note text obstruct the very UI being reviewed. Sidebar-only approaches lose the spatial connection.

## Decision

Each saved note renders as a **small numbered pin** (~20px) next to its anchored element. Pin color encodes tag. A floating control panel in the bottom-right corner shows total count and opens a **collapsible sidebar** listing notes for the current route. The sidebar supports filtering by status (default view: open + needs-clarification).

Hovering a pin highlights the anchored element (dashed outline) and reveals a popover with the note text, tag, status, agent response, and edit/delete controls.

The overlay container uses `pointer-events: none` so it never blocks host-page clicks. Only the pins, popovers, sidebar, and control panel are interactive (`pointer-events: auto`).

## Consequences

- `src/overlay.js` owns pin rendering, the sidebar, the popover, and the floating control panel.
- All PinNote-created DOM nodes carry `data-pinnote-anno="1"` and a high z-index (`2147483647`).
- `src/capture.js` skips elements where `data-pinnote-anno="1"` is on the click target or any ancestor — this prevents PinNote from annotating its own UI.
- `src/styles.js` defines all overlay styles inline to avoid extra HTTP requests when the script is pasted into a console.

## Alternatives considered

- **Inline sticky notes** — rejected. Obstructs host UI.
- **Sidebar only** — rejected. Loses spatial recall.
- **Pins only (no sidebar)** — rejected. Hard to enumerate or filter notes once there are more than ~10 on a route.
- **Bubbles attached to elements that follow scroll** — partially adopted (pins follow elements on scroll/resize) but without persistent text rendering.

## See also

- ADR-0001 (Shift+Click activation populates this UI)
- ADR-0007 (status determines pin color and sidebar default filter)
