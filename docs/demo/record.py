#!/usr/bin/env python3
"""Record a demo GIF of PinNote's full round-trip workflow on the playground page.

Flow: Shift+Click an element -> type a note -> save -> repeat -> Export ->
simulate agent edits -> Load -> status colors appear.

Produces docs/demo/pinnote-demo.gif via Playwright video capture + ffmpeg.
Run with:  npm run demo:record   (or:  python3 docs/demo/record.py)

One-time setup:
  pip install -r docs/demo/requirements.txt
  python3 -m playwright install chromium
  brew install ffmpeg          # (or: apt install ffmpeg on Debian)
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed. Run: pip install -r docs/demo/requirements.txt",
          file=sys.stderr)
    sys.exit(2)

REPO = Path(__file__).resolve().parent.parent.parent
PLAYGROUND = REPO / "examples" / "playground.html"
DIST = REPO / "dist" / "pinnote.js"
DEMO_DIR = REPO / "docs" / "demo"
GIF_OUT = DEMO_DIR / "pinnote-demo.gif"

HEADLESS = os.environ.get("HEADED", "0") != "1"
VIEWPORT = {"width": 960, "height": 720}
DWELL = 1200  # ms post-state dwell for visual pacing only


# ── Helpers ─────────────────────────────────────────────────────

def ensure_build():
    """Build dist/pinnote.js if missing or stale relative to src/."""
    src_dir = REPO / "src"
    if not src_dir.is_dir():
        sys.exit(f"ERROR: {src_dir} not found — run from repo root.")
    src_mtimes = [f.stat().st_mtime for f in src_dir.glob("*.js")]
    if not DIST.exists():
        print("dist/pinnote.js missing — building...")
        subprocess.run(["npm", "run", "build"], cwd=REPO, check=True)
        return
    dist_mtime = DIST.stat().st_mtime
    if src_mtimes and max(src_mtimes) > dist_mtime:
        print("dist/pinnote.js stale — rebuilding...")
        subprocess.run(["npm", "run", "build"], cwd=REPO, check=True)


def wait_for_pin_count(page, count, timeout=5000):
    """Wait until N pins are rendered in the PinNote shadow DOM."""
    page.wait_for_function(
        f'() => document.querySelector("#pinnote-root")'
        f'.shadowRoot.querySelectorAll("[data-pinnote-pin]").length >= {count}',
        timeout=timeout,
    )


def open_new_note(page, target_selector):
    """Shift+Click a target to open the new-note popover, wait for textarea."""
    loc = page.locator(target_selector)
    loc.scroll_into_view_if_needed()
    loc.wait_for(state="visible")
    loc.click(modifiers=["Shift"])
    page.wait_for_selector('[data-pinnote-note-ta="new"]', state="visible", timeout=3000)
    page.wait_for_timeout(DWELL // 2)  # let viewer see the popover open


def type_and_save(page, text):
    """Type note text into the open new-note textarea and save via Enter."""
    ta = page.locator('[data-pinnote-note-ta="new"]')
    ta.wait_for(state="visible")
    ta.fill(text)
    page.wait_for_timeout(DWELL)  # let viewer read the typed note
    ta.press("Enter")
    # Wait for popover to close (textarea gone) — confirms save happened.
    page.wait_for_selector('[data-pinnote-note-ta="new"]', state="detached", timeout=3000)


def simulate_agent_edits(notes_md_text):
    """Mimic an AI agent writing back statuses + responses to notes.md.

    Fail-fast: if the export schema drifts (note headings, status field, or note
    field change), we raise a clear error instead of silently no-oping and
    producing a cryptic Playwright timeout downstream in the Load step.
    """
    for marker in ('### note-001', '### note-002'):
        if marker not in notes_md_text:
            sys.exit(f"ERROR: simulate_agent_edits: '{marker}' not found in export. "
                     "Export schema may have changed — update this function.")

    # note-001 -> applied
    before_001 = notes_md_text
    notes_md_text = re.sub(
        r'(### note-001.*?\nstatus: )open',
        r'\1applied',
        notes_md_text,
        flags=re.DOTALL,
    )
    if notes_md_text == before_001:
        sys.exit("ERROR: simulate_agent_edits: note-001 status not 'open' — schema drift?")
    if 'agent_response:' not in notes_md_text.split('### note-001')[1].split('### note-002')[0]:
        notes_md_text = re.sub(
            r'(### note-001.*?note: [^\n]+\n)',
            r'\1agent_response: Renamed label to "Active users" — done.\n',
            notes_md_text,
            flags=re.DOTALL,
        )

    # note-002 -> needs-clarification
    before_002 = notes_md_text
    notes_md_text = re.sub(
        r'(### note-002.*?\nstatus: )open',
        r'\1needs-clarification',
        notes_md_text,
        flags=re.DOTALL,
    )
    if notes_md_text == before_002:
        sys.exit("ERROR: simulate_agent_edits: note-002 status not 'open' — schema drift?")
    note_002_section = notes_md_text.split('### note-002')[1]
    if 'agent_response:' not in note_002_section:
        notes_md_text = re.sub(
            r'(### note-002.*?note: [^\n]+\n)',
            r'\1agent_response: Should the spinner replace the button text or overlay the whole card?\n',
            notes_md_text,
            flags=re.DOTALL,
        )
    return notes_md_text


def webm_to_gif(webm_path, gif_path):
    """Convert webm to gif via ffmpeg with a quality palette."""
    cmd = [
        "ffmpeg", "-y", "-i", str(webm_path),
        "-vf", "fps=8,scale=640:-1:flags=lanczos,split[s0][s1];"
               "[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
        str(gif_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"ERROR: ffmpeg failed:\n{result.stderr[-500:]}")


# ── Main ────────────────────────────────────────────────────────

def main():
    ensure_build()
    if not PLAYGROUND.exists():
        sys.exit(f"ERROR: {PLAYGROUND} not found — run from repo root.")
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    url = PLAYGROUND.as_uri()

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        notes_md_path = tmp / "notes.md"

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=HEADLESS)
            context = browser.new_context(
                viewport=VIEWPORT,
                record_video_dir=str(tmp),
                record_video_size=VIEWPORT,
                color_scheme="light",
                device_scale_factor=1,
            )
            page = context.new_page()
            try:
                page.goto(url)
                page.wait_for_load_state("networkidle")
                page.wait_for_selector('[data-pinnote-ctl="export"]', timeout=5000)

                # --- Note 1: Shift+Click the "Total Users" stat card ---
                open_new_note(page, ".stat-card >> nth=0")
                type_and_save(page, "Rename to 'Active users' — clearer label")
                wait_for_pin_count(page, 1)
                page.wait_for_timeout(DWELL)

                # --- Note 2: Shift+Click the Refresh button ---
                open_new_note(page, "button.refresh")
                type_and_save(page, "Add loading state while refreshing")
                wait_for_pin_count(page, 2)
                page.wait_for_timeout(DWELL)

                # --- Export ---
                export_btn = page.locator('[data-pinnote-ctl="export"]')
                with page.expect_download(timeout=5000) as dl_info:
                    export_btn.click()
                download = dl_info.value
                download.save_as(str(notes_md_path))  # save BEFORE context.close()
                page.wait_for_timeout(DWELL)

                # --- Simulate agent round-trip: edit notes.md ---
                notes_text = notes_md_path.read_text()
                edited = simulate_agent_edits(notes_text)
                edited_path = tmp / "notes-agent.md"
                edited_path.write_text(edited)

                # --- Load the agent's response ---
                load_btn = page.locator('[data-pinnote-ctl="load"]')
                with page.expect_file_chooser(timeout=5000) as fc_info:
                    load_btn.click()
                file_chooser = fc_info.value
                file_chooser.set_files(str(edited_path))

                # Wait for pins to re-render with new statuses.
                # applied = green, needs-clarification = yellow.
                page.wait_for_function(
                    '() => document.querySelector("#pinnote-root")'
                    '.shadowRoot.querySelectorAll("[data-pinnote-pin][data-status=applied]").length >= 1',
                    timeout=5000,
                )
                page.wait_for_function(
                    '() => document.querySelector("#pinnote-root")'
                    '.shadowRoot.querySelectorAll("[data-pinnote-pin][data-status=needs-clarification]").length >= 1',
                    timeout=5000,
                )
                page.wait_for_timeout(DWELL * 2)  # let viewer see the color change

            finally:
                # Video is finalized on context.close(); grab the path
                # BEFORE exiting the sync_playwright block (event loop closes after).
                video = page.video
                context.close()
                browser.close()
                webm_path = video.path()

        if not webm_path or not Path(webm_path).exists():
            sys.exit("ERROR: no video file produced by Playwright.")

        # Convert to GIF, then the tempdir cleanup removes the webm automatically.
        print(f"converting {webm_path} -> {GIF_OUT}")
        webm_to_gif(webm_path, GIF_OUT)

    if not GIF_OUT.exists() or GIF_OUT.stat().st_size == 0:
        sys.exit("ERROR: GIF was not produced.")
    print(f"done: {GIF_OUT} ({GIF_OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
