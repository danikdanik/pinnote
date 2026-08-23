export const DEFAULT_META_PROMPT = `You are an AI coding agent processing a PinNote review file. Each note below
describes a UX issue or change request anchored to a DOM element on a host
web page.

Tag semantics:
  change  — modify the element's behavior or appearance per the note.
  remove  — delete the element entirely.
  add     — something is missing; create or insert per the note.
  unclear — open question; treat as a discussion item.

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
  4. Notes with anchor_confidence: position-only must be confirmed before acting.`;

export function generateMarkdown(notes, metaPrompt) {
  const byRoute = {};
  for (const note of notes) {
    if (!byRoute[note.route]) byRoute[note.route] = [];
    byRoute[note.route].push(note);
  }

  const byTag = { change: 0, remove: 0, add: 0, unclear: 0 };
  const byStatus = { open: 0, applied: 0, skipped: 0, 'needs-clarification': 0 };
  for (const note of notes) {
    if (byTag[note.tag] !== undefined) byTag[note.tag]++;
    if (byStatus[note.status] !== undefined) byStatus[note.status]++;
  }

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const sessionId = now.slice(0, 10) + '-session';

  const mp = (metaPrompt || DEFAULT_META_PROMPT).trimEnd();
  const mpIndented = mp.split('\n').map(l => '  ' + l).join('\n');

  let md = `---\n`;
  md += `pinnote_session: ${sessionId}\n`;
  md += `created: ${now}\n`;
  md += `total_notes: ${notes.length}\n`;
  md += `by_tag: { change: ${byTag.change}, remove: ${byTag.remove}, add: ${byTag.add}, unclear: ${byTag.unclear} }\n`;
  md += `by_status: { open: ${byStatus.open}, applied: ${byStatus.applied}, skipped: ${byStatus.skipped}, needs-clarification: ${byStatus['needs-clarification']} }\n\n`;
  md += `meta_prompt: |\n${mpIndented}\n`;
  md += `---\n\n`;
  md += `# UX Review\n`;

  for (const route of Object.keys(byRoute).sort()) {
    const routeNotes = byRoute[route];
    const plural = routeNotes.length === 1 ? 'note' : 'notes';
    md += `\n## ${route} (${routeNotes.length} ${plural})\n`;
    for (const note of routeNotes) {
      md += `\n### ${note.id} — ${note.tag}\n`;
      md += `status: ${note.status}\n`;
      md += `route: ${note.route}\n`;
      md += `anchor: ${note.anchor.selector} (text: "${escapeAnchorText(note.anchor.text)}")\n`;
      md += `anchor_confidence: ${note.anchor_confidence}\n`;
      md += `position: x=${note.position.x}, y=${note.position.y}\n`;
      md += `created: ${note.created}\n`;
      md += formatField('note', note.note);
      if (note.agent_response) {
        md += formatField('agent_response', note.agent_response);
      }
    }
  }

  return md;
}

function escapeAnchorText(text) {
  return (text || '').replace(/"/g, '\\"');
}

function formatField(key, value) {
  if (!value || !value.includes('\n')) return `${key}: ${value || ''}\n`;
  const lines = value.split('\n');
  return `${key}: ${lines[0]}\n` + lines.slice(1).map(l => `  ${l}`).join('\n') + '\n';
}

export function download(notes, metaPrompt) {
  const md = generateMarkdown(notes, metaPrompt);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('data-pinnote-anno', '1');
  a.href = url;
  const ts = new Date().toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '-');
  a.download = `pinnotes-${ts}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return md;
}

// Clipboard fallback for sandboxed iframes that block <a download>.
// Resolves to true if clipboard write succeeded.
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

export function parseMarkdown(text) {
  const lines = text.split('\n');
  const notes = [];
  let i = 0;

  // Skip frontmatter
  if (lines[i] === '---') {
    i++;
    while (i < lines.length && lines[i] !== '---') i++;
    i++; // skip closing ---
  }

  // Scan for note sections: ### note-NNN — tag
  while (i < lines.length) {
    const noteMatch = lines[i].match(/^### (note-\d+) — (\w+)/);
    if (noteMatch) {
      const id = noteMatch[1];
      const tag = noteMatch[2];
      i++;

      const fields = {};
      while (i < lines.length && !lines[i].startsWith('### ') && !lines[i].startsWith('## ') && !lines[i].startsWith('# ')) {
        const line = lines[i];
        const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)/);
        if (kvMatch) {
          const key = kvMatch[1];
          let value = kvMatch[2];
          // Collect continuation lines (2-space indented)
          while (i + 1 < lines.length && lines[i + 1].startsWith('  ') && !lines[i + 1].match(/^\s{2}(\w[\w_-]*):/)) {
            i++;
            value += '\n' + lines[i].slice(2);
          }
          fields[key] = value.trim();
        }
        i++;
      }

      // Parse anchor: "selector (text: "TEXT")"
      let anchor = { selector: '', text: '' };
      if (fields.anchor) {
        const am = fields.anchor.match(/^(.+?)\s+\(text:\s*"(.*)"\)\s*$/);
        if (am) {
          anchor = { selector: am[1].trim(), text: am[2] };
        } else {
          anchor = { selector: fields.anchor, text: '' };
        }
      }

      // Parse position: "x=N, y=N"
      let position = { x: 0, y: 0 };
      if (fields.position) {
        const pm = fields.position.match(/x=(\d+),\s*y=(\d+)/);
        if (pm) position = { x: parseInt(pm[1], 10), y: parseInt(pm[2], 10) };
      }

      const num = parseInt(id.replace('note-', ''), 10);
      notes.push({
        id,
        number: num,
        tag,
        status: fields.status || 'open',
        route: fields.route || '/',
        anchor,
        anchor_confidence: fields.anchor_confidence || 'text-match',
        position,
        created: fields.created || new Date().toISOString(),
        note: fields.note || '',
        agent_response: fields.agent_response || null,
      });
    } else {
      i++;
    }
  }

  return notes;
}

export function loadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(parseMarkdown(e.target.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
