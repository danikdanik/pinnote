# PinNote

In-page web annotation tool for UX reviews. Drop notes on a running web app, then export them as a structured markdown file an AI coding agent can act on.

PinNote is a two-way comment thread between you and the agent. You write notes by Shift+Clicking on the page. The agent reads them, applies the easy ones, and writes back questions about the unclear ones. Status flows back to PinNote so you can verify, clarify, and iterate.

## Status

v0.1.0 — light mode (localStorage) implemented.

## Installation

```bash
git clone <repo>
cd pinnote
npm install
npm run build
```

This produces `dist/pinnote.js` — a single self-contained script (~50 KB) you inject into any page.

## Usage

### Playground (quickest start)

Open `examples/playground.html` in your browser. PinNote loads automatically. Shift+Click any element to try it.

### On any page

**One-time setup (per Chrome profile):**

1. Open Chrome DevTools → Sources → Snippets.
2. Click "New snippet", paste the full contents of `dist/pinnote.js`, and save it (name it `pinnote`).
3. That snippet is now saved to your profile and available on every tab.

**To annotate a page:**

1. Open DevTools on the page you want to review.
2. Go to Sources → Snippets → right-click `pinnote` → Run (or Ctrl+Enter / Cmd+Enter).
3. Shift+Click any element to drop a note. A popover opens to write your note and pick a tag.
4. When done, click "Export" in the floating control (bottom-right) to download `notes.md`.

**To load agent responses back:**

1. After your agent has updated `notes.md` (writing `status` and `agent_response` fields), click "Load" in the floating control and pick the updated file.
2. Pins update to reflect new statuses. Applied notes turn green, needs-clarification notes turn yellow.

### Tags

| Tag | Meaning |
|---|---|
| `bug` | Something is broken or incorrect |
| `change` | Modify behavior or appearance |
| `remove` | Delete the element entirely |
| `unclear` | Open question, needs discussion |
| `redundant` | Duplicates something elsewhere |

### Note statuses

| Status | Set by | Meaning |
|---|---|---|
| `open` | You | Needs agent action |
| `applied` | Agent | Change was made |
| `skipped` | Agent | Agent chose not to act (see `agent_response`) |
| `needs-clarification` | Agent | Agent needs more info before acting |

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| Shift+Click | Drop a new note on an element |
| ⌥1–5 (Mac) / Alt+1–5 (Win/Linux) | Change tag in the popover |
| Enter | Save note |
| Shift+Enter | Newline in note text |
| Esc | Cancel / close popover |

## The round-trip workflow

1. **Annotate** — Shift+Click elements, write notes, pick tags.
2. **Export** — Click "Export" to download `notes.md`.
3. **Agent** — Give `notes.md` to your AI coding agent along with your codebase. The embedded `meta_prompt` in the file tells the agent exactly how to process it.
4. **Load** — Agent updates `notes.md` with statuses and responses. Load it back via the "Load" button.
5. **Repeat** — Clarify, add new notes, re-export.

## Development

```bash
npm run build          # one-shot build → dist/pinnote.js
npm run build --watch  # rebuild on file changes
```

Serve the examples locally:

```bash
npx serve -p 8081      # open http://localhost:8081/examples/playground.html
```

## Browser support

- Light mode (localStorage): any modern browser (Chrome, Firefox, Safari, Edge).
- Requires ES2019+ (bare `catch`, optional chaining not used — broadly compatible).

## Architecture

See [AGENTS.md](AGENTS.md) for project-level conventions used by AI coding assistants and contributors.

Decision records live in [docs/adr/](docs/adr/). Each ADR captures a non-obvious trade-off made during the design phase.

## License

MIT. See [LICENSE](LICENSE).
