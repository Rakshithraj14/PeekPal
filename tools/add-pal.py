"""Add a pal from a "Submit a pal" issue to the demo gallery. Run by .github/workflows/pal-submission.yml.

Reads ISSUE_BODY and ISSUE_NUMBER from the environment, downloads the attached zip, checks both
sheets, re-encodes them into demo/public/pals and adds the character to demo/src/lib/pals.ts.
Writes id and name to $GITHUB_OUTPUT. Exits with a message (posted on the issue) when something is off.
"""
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PALS = ROOT / "demo/public/pals"
LIST = ROOT / "demo/src/lib/pals.ts"
MAX_ZIP = 12 * 1024 * 1024


def fail(msg):
    print(msg)
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"error={msg}\n")
    sys.exit(1)


def fields(body):
    """### Label / value pairs of an issue form."""
    parts = re.split(r"^### (.+)$", body.replace("\r\n", "\n"), flags=re.M)
    return {k.strip(): v.strip() for k, v in zip(parts[1::2], parts[2::2])}


def sheet(data):
    im = Image.open(io.BytesIO(data))
    w, h = im.size
    if w != h or w % 3 or not 150 <= w <= 3072:
        fail(f"Each sheet should be a square 3x3 grid (the Download button makes them); got {w}x{h}.")
    return im.convert("RGBA")


def main():
    f = fields(os.environ["ISSUE_BODY"])
    issue = os.environ["ISSUE_NUMBER"]
    line = lambda k: " ".join(f.get(k, "").split())  # one line, no stray whitespace
    name, blurb, credit = line("Name")[:40], line("One line about it")[:140], line("Credit")
    if not name or not blurb:
        fail("The Name and One line fields are both needed.")
    if credit and credit != "_No response_":
        blurb += f" By {credit[:40]}."

    url = re.search(r"https://github\.com/user-attachments/files/\d+/[\w.-]+\.zip", f.get("Sprite sheets", ""))
    if not url:
        fail("I couldn't find an attached zip. Drag the zip from the Download button into the Sprite sheets box.")
    with urllib.request.urlopen(url.group(0), timeout=60) as r:
        data = r.read(MAX_ZIP + 1)
    if len(data) > MAX_ZIP:
        fail("The zip is bigger than 12 MB.")

    found = {}
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for info in z.infolist():
            m = re.search(r"-(poses|moods)\.(webp|png)$", info.filename)
            if m and info.file_size <= 8 * 1024 * 1024:
                found[m.group(1)] = sheet(z.read(info))
    if set(found) != {"poses", "moods"}:
        fail("The zip should hold a ...-poses and a ...-moods sheet (.webp or .png).")

    taken = set(re.findall(r"id: '([^']+)'", LIST.read_text(encoding="utf-8")))
    pid = re.sub(r"[^a-z0-9]+", "-", name.lower().split(" the ")[0]).strip("-") or "pal"
    if pid in taken:
        pid = f"{pid}-{issue}"

    for kind, im in found.items():
        im.save(PALS / f"{pid}-{kind}.webp", quality=90, method=6)

    entry = (
        "  {\n"
        f"    id: '{pid}',\n"
        f"    name: {json.dumps(name)},\n"
        f"    blurb: {json.dumps(blurb)},\n"
        f"    poses: '/pals/{pid}-poses.webp',\n"
        f"    moods: '/pals/{pid}-moods.webp',\n"
        "    colourOnly: true,\n"
        "  },\n"
    )
    src = LIST.read_text(encoding="utf-8")
    start = src.index("export const characters")
    end = src.index("\n]\n", start) + 1
    LIST.write_text(src[:end] + entry + src[end:], encoding="utf-8")

    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(f"id={pid}\nname={name}\n")
    print(f"added {name} as {pid}")


if __name__ == "__main__":
    main()
