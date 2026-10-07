"""Draw 18 simple placeholder frames so the demo and tests work before real art exists.

Usage: python tools/make-placeholder.py [out_dir]   (default: art/placeholder)
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

S = 512
INK = (40, 32, 30, 255)
FACE = (255, 214, 153, 255)
BODY = (247, 178, 103, 255)
BLUSH = (255, 140, 140, 200)
RED = (230, 57, 70, 255)
GOLD = (255, 190, 11, 255)

POSES = ["up-left", "up", "up-right", "left", "center", "right", "down-left", "down", "down-right"]
MOODS = ["blink", "happy", "love", "surprised", "wink", "shy", "sleepy", "dizzy", "celebrate"]


def base(look=(0, 0)):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((166, 300, 346, 470), 60, fill=BODY, outline=INK, width=8)  # body never moves
    hx, hy = 256 + look[0] * 18, 210 + look[1] * 14
    d.polygon([(hx - 120, hy - 40), (hx - 95, hy - 150), (hx - 30, hy - 100)], fill=FACE, outline=INK, width=8)
    d.polygon([(hx + 120, hy - 40), (hx + 95, hy - 150), (hx + 30, hy - 100)], fill=FACE, outline=INK, width=8)
    d.ellipse((hx - 140, hy - 120, hx + 140, hy + 120), fill=FACE, outline=INK, width=8)
    return im, d, hx, hy


def eyes(d, hx, hy, look=(0, 0), r=22):
    for ex in (hx - 55, hx + 55):
        cx, cy = ex + look[0] * 12, hy - 5 + look[1] * 10
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=INK)


def arc_eye(d, cx, cy, up=True):
    box = (cx - 24, cy - 18, cx + 24, cy + 18)
    d.arc(box, 200, 340, fill=INK, width=8) if up else d.arc(box, 20, 160, fill=INK, width=8)


def heart(d, cx, cy, s=26):
    d.ellipse((cx - s, cy - s, cx, cy), fill=RED)
    d.ellipse((cx, cy - s, cx + s, cy), fill=RED)
    d.polygon([(cx - s, cy - s // 2), (cx + s, cy - s // 2), (cx, cy + s)], fill=RED)


def star(d, cx, cy, r=28):
    pts = [(cx + (r if i % 2 == 0 else r * 0.4) * math.cos(math.pi / 5 * i - math.pi / 2),
            cy + (r if i % 2 == 0 else r * 0.4) * math.sin(math.pi / 5 * i - math.pi / 2)) for i in range(10)]
    d.polygon(pts, fill=GOLD, outline=INK)


def spiral(d, cx, cy):
    for i, r in enumerate((26, 18, 10)):
        d.arc((cx - r, cy - r, cx + r, cy + r), i * 90, i * 90 + 300, fill=INK, width=5)


def mouth(d, hx, hy, kind="smile"):
    y = hy + 55
    if kind == "smile":
        d.arc((hx - 22, y - 16, hx + 22, y + 12), 20, 160, fill=INK, width=7)
    elif kind == "open":
        d.chord((hx - 30, y - 20, hx + 30, y + 30), 0, 180, fill=INK)
    elif kind == "o":
        d.ellipse((hx - 14, y - 10, hx + 14, y + 20), fill=INK)
    elif kind == "flat":
        d.line((hx - 15, y, hx + 15, y), fill=INK, width=7)
    elif kind == "wavy":
        d.line([(hx - 24, y), (hx - 12, y - 8), (hx, y), (hx + 12, y - 8), (hx + 24, y)], fill=INK, width=6)


def blush(d, hx, hy):
    for bx in (hx - 85, hx + 85):
        d.ellipse((bx - 24, hy + 22, bx + 24, hy + 42), fill=BLUSH)


def pose_frame(name):
    look = {"up-left": (-1, -1), "up": (0, -1), "up-right": (1, -1), "left": (-1, 0), "center": (0, 0),
            "right": (1, 0), "down-left": (-1, 1), "down": (0, 1), "down-right": (1, 1)}[name]
    im, d, hx, hy = base(look)
    eyes(d, hx, hy, look)
    mouth(d, hx + look[0] * 10, hy + look[1] * 6)
    return im


def mood_frame(name):
    im, d, hx, hy = base()
    ey, l, r = hy - 5, hx - 55, hx + 55
    if name == "blink":
        arc_eye(d, l, ey, up=False); arc_eye(d, r, ey, up=False); mouth(d, hx, hy)
    elif name == "happy":
        arc_eye(d, l, ey); arc_eye(d, r, ey); mouth(d, hx, hy, "open")
    elif name == "love":
        heart(d, l, ey); heart(d, r, ey); mouth(d, hx, hy, "open"); blush(d, hx, hy)
    elif name == "surprised":
        eyes(d, hx, hy, r=30); mouth(d, hx, hy, "o")
    elif name == "wink":
        arc_eye(d, l, ey); d.ellipse((r - 22, ey - 22, r + 22, ey + 22), fill=INK); mouth(d, hx, hy)
    elif name == "shy":
        eyes(d, hx, hy, look=(-1.4, 0.8), r=18); blush(d, hx, hy); mouth(d, hx, hy, "wavy")
    elif name == "sleepy":
        arc_eye(d, l, ey + 6, up=False); arc_eye(d, r, ey + 6, up=False); mouth(d, hx, hy, "flat")
    elif name == "dizzy":
        spiral(d, l, ey); spiral(d, r, ey); mouth(d, hx, hy, "wavy")
    elif name == "celebrate":
        star(d, l, ey); star(d, r, ey); mouth(d, hx, hy, "open"); blush(d, hx, hy)
    return im


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "art/placeholder")
    out.mkdir(parents=True, exist_ok=True)
    for n in POSES:
        pose_frame(n).save(out / f"{n}.png")
    for n in MOODS:
        mood_frame(n).save(out / f"{n}.png")
    print(f"wrote 18 frames to {out}")


if __name__ == "__main__":
    main()
