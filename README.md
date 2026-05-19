# PinNote

Drop notes on any live web page, then hand them to an AI agent to act on.

Shift+Click any element to pin a note to it. When you're done, export a `notes.md` file. Give that file to your AI coding agent. It reads the notes, applies changes, and writes status back. Load the updated file to see what was done.

## Build

```bash
npm install && npm run build
```

This produces `dist/pinnote.js` — a single self-contained script you inject into any page.

## Example
<img width="1845" height="1118" alt="image" src="https://github.com/user-attachments/assets/1b65cd57-5796-4f98-8de4-7a0f56cbbb14" />

## Quickstart

Open `examples/playground.html` in your browser. PinNote loads automatically. Shift+Click any element to try it.

## Using it on any site

**One-time setup per Chrome profile:**

1. Open DevTools (F12) → Sources → Snippets
2. Click "New snippet", paste the full contents of `dist/pinnote.js`, name it `pinnote`
3. The snippet is saved to your profile permanently

**To annotate a page:**

1. Open DevTools on the page you want to review
2. Sources → Snippets → right-click `pinnote` → Run (or Cmd+Enter)
3. Shift+Click any element to drop a note
4. Click **Export** (bottom-right control bar) to download `notes.md`

**To load agent responses back:**

1. After your agent updates `notes.md` with statuses and responses, click **Load**
2. Pins update: green = applied, yellow = needs clarification, gray = skipped

## Tags

| Key | Tag | Meaning |
|-----|-----|---------|
| ⌥1 / Alt+1 | `change` | This needs to be different |
| ⌥2 / Alt+2 | `remove` | Delete this |
| ⌥3 / Alt+3 | `add` | Something is missing here |
| ⌥4 / Alt+4 | `unclear` | Confusing — needs clarification (default) |

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Shift+Click | Drop a note on an element |
| ⌥1–4 / Alt+1–4 | Change tag while writing a note |
| Enter | Save note |
| Shift+Enter | Newline in note text |
| Esc | Cancel / close |

## The workflow

1. **Annotate** — Shift+Click elements, write notes
2. **Export** — Download `notes.md`
3. **Agent** — Give the file to your AI agent. The embedded prompt in the file tells it exactly how to process notes and write back statuses
4. **Load** — Agent updates `notes.md`; load it back to see results
5. **Repeat** — Clarify, add new notes, re-export

## License

MIT
