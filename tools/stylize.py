"""Restyle a character's 18 frames as a pencil sketch or a two-tone riso print. Pillow only, no AI.

Usage: python tools/stylize.py FRAMES_DIR STYLE [--out DIR]   (default out: FRAMES_DIR-STYLE)
Then:  python tools/build-sheets.py FRAMES_DIR-STYLE --quality 90

Every frame goes through the same filter with the same settings, so the frames still line up.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageMath, ImageOps

NAMES = ["up-left", "up", "up-right", "left", "center", "right", "down-left", "down", "down-right",
         "blink", "happy", "love", "surprised", "wink", "shy", "sleepy", "dizzy", "celebrate"]


def flat(im, bg=(255, 255, 255)):
    """RGB on a solid background, so filters don't pick up colour hidden under transparent pixels."""
    base = Image.new("RGB", im.size, bg)
    base.paste(im, mask=im.getchannel("A"))
    return base


def with_alpha(rgb, alpha):
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def sketch(im):
    """Pencil: colour-dodge the greyscale with its own blurred negative, keep some tone, warm it like graphite."""
    g = ImageOps.grayscale(flat(im))
    blur = ImageOps.invert(g).filter(ImageFilter.GaussianBlur(max(2, im.width // 90)))
    dodge = ImageMath.lambda_eval(lambda a: a["min"](a["g"] * 256 / (256 - a["b"] + 1), 255), g=g, b=blur).convert("L")
    dodge = ImageOps.autocontrast(dodge, cutoff=1).point(lambda v: int(255 * (v / 255) ** 2.2))
    shaded = ImageChops.multiply(dodge, g.point(lambda v: 150 + v * 105 // 255))
    toned = ImageOps.colorize(shaded, black=(48, 44, 42), white=(248, 245, 240))
    return with_alpha(toned, im.getchannel("A"))

def riso(im):
    """Two-tone risograph: teal for lines and shadows, fluorescent red for the fills, slightly misregistered."""
    g = ImageOps.autocontrast(ImageOps.grayscale(flat(im)), cutoff=2)
    teal = g.point(lambda v: 255 if v < 95 else 0)
    red = g.point(lambda v: 255 if v < 195 else max(0, (240 - v) * 5))
    off = max(1, im.width // 140)
    white = Image.new("RGB", im.size, (255, 255, 255))
    out = Image.composite(Image.new("RGB", im.size, (255, 78, 52)), Image.new("RGB", im.size, (250, 238, 222)), red)
    out = ImageChops.multiply(out, Image.composite(Image.new("RGB", im.size, (0, 112, 130)), white, ImageChops.offset(teal, off, off)))
    return with_alpha(out, im.getchannel("A"))


STYLES = {"sketch": sketch, "riso": riso}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("frames_dir", type=Path)
    ap.add_argument("style", choices=STYLES)
    ap.add_argument("--out", type=Path)
    args = ap.parse_args()

    missing = [n for n in NAMES if not (args.frames_dir / f"{n}.png").exists()]
    if missing:
        sys.exit(f"stylize: missing frames in {args.frames_dir}: {', '.join(missing)}")
    out = args.out or args.frames_dir.with_name(f"{args.frames_dir.name}-{args.style}")
    out.mkdir(parents=True, exist_ok=True)
    for n in NAMES:
        STYLES[args.style](Image.open(args.frames_dir / f"{n}.png").convert("RGBA")).save(out / f"{n}.png")
    print(f"wrote 18 {args.style} frames to {out}")


if __name__ == "__main__":
    main()
