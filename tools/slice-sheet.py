"""Cut AI-generated (or hand-drawn) sprite sheets into the 18 named frames build-sheets.py expects.

Usage:
  python tools/slice-sheet.py OUT_DIR --composite sheet.png           9 directions left of or above 18-20 expressions
  python tools/slice-sheet.py OUT_DIR --poses dirs.png --moods exp.png  9 directions + 9 to 25 expressions

Characters are found as blobs on a cleaned alpha mask (labels, grid lines and near-zero alpha
noise are dropped), read row by row, then every frame is re-aligned on its feet and body centre,
so small body drift in generated art is corrected. A plain white background is removed when the
image has no transparency. For any other layout, use the frame picker on the demo site.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageFilter

POSES = ["up-left", "up", "up-right", "left", "center", "right", "down-left", "down", "down-right"]
MOODS = ["blink", "happy", "love", "surprised", "wink", "shy", "sleepy", "dizzy", "celebrate"]
# Order of the expressions in docs/image-prompt.md; the first 9 cover our moods.
MOODS_20 = ["blink", "happy", "love", "wink", "surprised", "shy", "sleepy", "dizzy", "celebrate"]
ALPHA_MIN = 24  # alpha below this is background noise
WHITE = 225  # every channel at or above this counts as white background
SCALE = 2  # blob search runs at 1/SCALE resolution
BODY = 0.35  # bottom fraction of a character used as its body anchor
PAD = 0.08


def remove_white_background(im):
    """Every large white region becomes transparent, wherever it is (also inside grid boxes).
    Small white areas, like eye highlights, stay; light edge pixels are softened to avoid a halo."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    lo = bytes(min(p) for p in rgb.getdata())
    white = bytearray(1 if v >= WHITE else 0 for v in lo)
    bg, seen = bytearray(w * h), bytearray(w * h)
    for start in range(w * h):
        if not white[start] or seen[start]:
            continue
        seen[start] = 1
        stack, region = [start], []
        while stack:
            i = stack.pop()
            region.append(i)
            x = i % w
            for j in (i - 1 if x else -1, i + 1 if x < w - 1 else -1, i - w, i + w):
                if 0 <= j < w * h and white[j] and not seen[j]:
                    seen[j] = 1
                    stack.append(j)
        if len(region) > w * h * 0.002:
            for i in region:
                bg[i] = 1
    alpha = bytearray(b"\xff" * (w * h))
    for i in range(w * h):
        if bg[i]:
            alpha[i] = 0
        elif lo[i] >= 170:
            x = i % w
            if (x and bg[i - 1]) or (x < w - 1 and bg[i + 1]) or (i >= w and bg[i - w]) or (i + w < w * h and bg[i + w]):
                alpha[i] = 255 * (255 - lo[i]) // (255 - 170)
    out = rgb.convert("RGBA")
    out.putalpha(Image.frombytes("L", (w, h), bytes(alpha)))
    return out


def clean(im):
    im = im.convert("RGBA")
    a = im.getchannel("A").point(lambda v: v if v >= ALPHA_MIN else 0)
    if a.histogram()[0] < im.width * im.height / 10:
        print("no transparent background found; removing the white background")
        im = remove_white_background(im)
        a = im.getchannel("A").point(lambda v: v if v >= ALPHA_MIN else 0)
    im.putalpha(a)
    return im


def blobs(im):
    """Connected components of the opaque mask. Returns full-res boxes of the character-sized ones."""
    small = im.getchannel("A").resize((im.width // SCALE, im.height // SCALE), Image.BOX)
    small = small.point(lambda v: 255 if v >= 128 else 0)
    small = small.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))  # drop thin grid lines
    w, h = small.size
    px = bytearray(1 if v else 0 for v in small.getdata())
    seen = bytearray(w * h)
    found = []
    for start in range(w * h):
        if not px[start] or seen[start]:
            continue
        seen[start] = 1
        stack, x0, y0, x1, y1, n = [start], w, h, 0, 0, 0
        while stack:
            i = stack.pop()
            x, y = i % w, i // w
            x0, y0, x1, y1, n = min(x0, x), min(y0, y), max(x1, x), max(y1, y), n + 1
            for j in (i - 1 if x else -1, i + 1 if x < w - 1 else -1, i - w, i + w):
                if 0 <= j < w * h and px[j] and not seen[j]:
                    seen[j] = 1
                    stack.append(j)
        found.append([x0, y0, x1 + 1, y1 + 1, n])

    # Size reference: the median of the character-sized blobs, so one merged blob can't hide the rest.
    tallest = max(b[3] - b[1] for b in found)
    sizes = sorted(b[3] - b[1] for b in found if b[3] - b[1] >= tallest * 0.3)
    ref = sizes[len(sizes) // 2]
    big = [b for b in found if b[3] - b[1] >= ref * 0.5]
    near = ref * 0.1
    for s in found:  # glue sparkles/hearts that float next to a character onto it
        if s in big:
            continue
        for b in big:
            gap = max(b[0] - s[2], s[0] - b[2], b[1] - s[3], s[1] - b[3], 0)
            if gap <= near:
                b[0], b[1], b[2], b[3] = min(b[0], s[0]), min(b[1], s[1]), max(b[2], s[2]), max(b[3], s[3])
                break
    return [tuple(v * SCALE for v in b[:4]) for b in big]


def reading_order(boxes):
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    row_h = sorted(b[3] - b[1] for b in boxes)[len(boxes) // 2] * 0.5
    rows, cur = [], [boxes[0]]
    for b in boxes[1:]:
        if (b[1] + b[3]) / 2 - (cur[-1][1] + cur[-1][3]) / 2 > row_h:
            rows.append(cur)
            cur = []
        cur.append(b)
    rows.append(cur)
    return [b for row in rows for b in sorted(row, key=lambda b: b[0])]


def anchor(crop):
    """(x, y) of the body centre at the feet: mean x of the bottom BODY band, lowest opaque row."""
    a = crop.getchannel("A")
    box = a.getbbox()
    band = a.crop((0, int(box[3] - (box[3] - box[1]) * BODY), crop.width, box[3]))
    xs = [x for i, v in enumerate(band.getdata()) if v for x in (i % band.width,)]
    return sum(xs) / len(xs), box[3]


def is_grid3(nine):
    """True when 9 drawings sit in 3 rows of 3."""
    ys = sorted((b[1] + b[3]) / 2 for b in nine)
    gap = sorted(b[3] - b[1] for b in nine)[4] * 0.5
    rows = [1]
    for a, b in zip(ys, ys[1:]):
        if b - a > gap:
            rows.append(1)
        else:
            rows[-1] += 1
    return rows == [3, 3, 3]


def split_sections(boxes):
    """Find the 9 directions in a composite: the leftmost 9 when every other drawing sits to their right
    (sections side by side), or the topmost 9 when every other drawing sits below them (stacked)."""
    for lo, hi in ((0, 2), (1, 3)):  # x then y
        nine = sorted(boxes, key=lambda b: b[lo])[:9]
        edge = max(b[hi] for b in nine)
        rest = [b for b in boxes if b not in nine]
        if is_grid3(nine) and all((b[lo] + b[hi]) / 2 > edge for b in rest):
            return nine, rest
    sys.exit("slice-sheet: couldn't tell the directions from the expressions in that layout.\n"
             "  Put the 3x3 directions to the left of or above the expressions, or use the frame picker on the demo site.")


def cut(path, expected, what):
    im = clean(Image.open(path))
    boxes = blobs(im)
    med = sorted(b[3] - b[1] for b in boxes)[len(boxes) // 2]
    merged = [b for b in boxes if b[3] - b[1] > med * 1.6]
    if merged:
        b = merged[0]
        sys.exit(f"slice-sheet: the drawing at x={b[0]}, y={b[1]} in {path} is much taller than the rest, so\n"
                 "  several characters are probably touching. Regenerate with more space between them,\n"
                 "  or use the frame picker on the demo site to choose the frames by hand.")
    if not expected(len(boxes)):
        sys.exit(f"slice-sheet: found {len(boxes)} characters in {path}, expected {what}.\n"
                 "  Characters may touch each other or a label may be too big. Leave clear space between cells,\n"
                 "  or use the frame picker on the demo site to choose the frames by hand.")
    return im, boxes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("--poses", type=Path)
    ap.add_argument("--moods", type=Path)
    ap.add_argument("--composite", type=Path)
    args = ap.parse_args()

    pieces = {}  # name -> RGBA crop
    if args.composite:
        im, boxes = cut(args.composite, lambda n: n in (18, 29), "29 (9 directions + 20 expressions) or 18")
        nine, rest = split_sections(boxes)
        for n, b in zip(POSES, reading_order(nine)):
            pieces[n] = im.crop(b)
        for n, b in zip(MOODS_20 if len(boxes) == 29 else MOODS, reading_order(rest)):
            pieces[n] = im.crop(b)
    elif args.poses and args.moods:
        im, boxes = cut(args.poses, lambda n: n == 9, "9 directions")
        for n, b in zip(POSES, reading_order(boxes)):
            pieces[n] = im.crop(b)
        im, boxes = cut(args.moods, lambda n: 9 <= n <= 25, "9 to 25 expressions")
        for n, b in zip(MOODS if len(boxes) == 9 else MOODS_20, reading_order(boxes)):
            pieces[n] = im.crop(b)
    else:
        ap.error("pass --poses and --moods, or --composite")

    # Generators often draw the two grids at different scales; match the moods to the poses.
    med = lambda names: sorted(pieces[n].height for n in names)[4]
    k = med(POSES) / med(MOODS)
    if abs(k - 1) > 0.01:
        print(f"scaling moods by {k:.3f} to match the poses")
        for n in MOODS:
            c = pieces[n]
            pieces[n] = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)

    anchors = {n: anchor(c) for n, c in pieces.items()}
    left = max(ax for ax, _ in anchors.values())
    right = max(c.width - ax for c, (ax, _) in zip(pieces.values(), anchors.values()))
    up = max(ay for _, ay in anchors.values())
    w, h = int(left + right), int(up)
    side = round(max(w, h) / (1 - 2 * PAD))
    fx, fy = (side - w) // 2 + left, (side - h) // 2 + up  # where every frame's feet land

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for n in POSES + MOODS:
        ax, ay = anchors[n]
        frame = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        frame.paste(pieces[n], (round(fx - ax), round(fy - ay)))
        frame.save(args.out_dir / f"{n}.png")
    print(f"wrote 18 frames ({side}x{side}) to {args.out_dir}")


if __name__ == "__main__":
    main()
