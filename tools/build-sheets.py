"""Turn 18 named transparent PNG frames into {name}-poses.webp and {name}-moods.webp.

Usage: python tools/build-sheets.py FRAMES_DIR [--name NAME] [--out DIR] [--cell 256] [--quality 90]

All frames are cropped to ONE shared bounding box (never per frame, or the character jumps),
padded to a square, scaled to --cell and laid out in two 3x3 grids, row by row.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

POSES = ["up-left", "up", "up-right", "left", "center", "right", "down-left", "down", "down-right"]
MOODS = ["blink", "happy", "love", "surprised", "wink", "shy", "sleepy", "dizzy", "celebrate"]
ALPHA_MIN = 8  # alpha at or below this counts as empty (cleans generator noise)
PAD = 0.06  # padding added back around the shared box, as a fraction of the square


def opaque_mask(im):
    return im.getchannel("A").point(lambda a: 255 if a > ALPHA_MIN else 0)


def lowest_row(im):
    box = opaque_mask(im).getbbox()
    return box[3] if box else 0


def load(frames_dir):
    frames, problems = {}, []
    for n in POSES + MOODS:
        p = frames_dir / f"{n}.png"
        if not p.exists():
            problems.append(f"missing  {p.name}")
            continue
        im = Image.open(p)
        if im.mode != "RGBA" or im.getchannel("A").getextrema()[0] > ALPHA_MIN:
            problems.append(f"no alpha {p.name} (needs a transparent background)")
        frames[n] = im.convert("RGBA")
    sizes = {im.size for im in frames.values()}
    if len(sizes) > 1:
        ref = frames.get("center", next(iter(frames.values()))).size
        problems += [f"size     {n}.png is {im.size[0]}x{im.size[1]}, expected {ref[0]}x{ref[1]}"
                     for n, im in frames.items() if im.size != ref]
    if problems:
        sys.exit("build-sheets: fix these frames first:\n  " + "\n  ".join(problems))
    return frames


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("frames_dir", type=Path)
    ap.add_argument("--name", help="output name (default: folder name)")
    ap.add_argument("--out", type=Path, default=Path("."))
    ap.add_argument("--cell", type=int, default=256)
    ap.add_argument("--quality", type=int, default=0, help="webp quality 1-100 (default: lossless)")
    args = ap.parse_args()

    frames = load(args.frames_dir)
    name = args.name or args.frames_dir.name

    boxes = [opaque_mask(im).getbbox() for im in frames.values()]
    if None in boxes:
        sys.exit("build-sheets: a frame is completely transparent")
    l, t = min(b[0] for b in boxes), min(b[1] for b in boxes)
    r, b = max(b[2] for b in boxes), max(b[3] for b in boxes)
    side = round(max(r - l, b - t) / (1 - 2 * PAD))
    ox, oy = (side - (r - l)) // 2, (side - (b - t)) // 2

    cells = {}
    for n, im in frames.items():
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(im.crop((l, t, r, b)), (ox, oy))
        cells[n] = sq.resize((args.cell, args.cell), Image.LANCZOS)

    args.out.mkdir(parents=True, exist_ok=True)
    save = {"lossless": True} if not args.quality else {"quality": args.quality}
    for sheet, names in (("poses", POSES), ("moods", MOODS)):
        out = Image.new("RGBA", (args.cell * 3, args.cell * 3), (0, 0, 0, 0))
        for i, n in enumerate(names):
            out.paste(cells[n], ((i % 3) * args.cell, (i // 3) * args.cell))
        path = args.out / f"{name}-{sheet}.webp"
        out.save(path, "WEBP", **save)
        print(f"wrote {path}")

    # Feet check: lowest opaque row of each cell vs the center frame.
    ref, limit, bad = lowest_row(cells["center"]), args.cell * 0.02, 0
    print(f"\nfeet offset from center (limit {limit:.1f}px):")
    for n in POSES + MOODS:
        off = lowest_row(cells[n]) - ref
        flag = "  <-- WARN: body moved" if abs(off) > limit else ""
        bad += bool(flag)
        print(f"  {n:<11} {off:+d}px{flag}")
    print("\nok, frames line up" if not bad else f"\n{bad} frame(s) drift; the character will jump on those")


if __name__ == "__main__":
    main()
