"""Logo concept explorations in the Loodly brand red — for picking a direction."""
from __future__ import annotations

import math

from PIL import Image, ImageDraw, ImageFilter

RED = (236, 40, 40)
RED_DEEP = (198, 26, 32)
RED_LIGHT = (247, 106, 96)
CREAM = (255, 247, 240)
WHITE = (255, 255, 255)
INK = (34, 20, 24)
MANGO = (255, 176, 32)


def _sup(size):
    S = size * 3
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img), S, S / 100.0


def _fin(img, size):
    return img.resize((size, size), Image.LANCZOS)


# --- A: pin-cone. The map pin IS the cone -> "spots + ice cream" in one shape.
def concept_a(size=512, *, transparent=False, bg=WHITE):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx = S * 0.5
    # teardrop pin body pointing down
    top, r = S * 0.30, S * 0.235
    tip = S * 0.865
    d.ellipse([cx - r, top - r, cx + r, top + r], fill=RED)
    d.polygon([(cx - r * 0.86, top + r * 0.52), (cx + r * 0.86, top + r * 0.52),
               (cx, tip)], fill=RED)
    # swirl scoop rising out of the pin, in cream
    sw_cy = top - r * 0.30
    for i, (dx, dy, rr) in enumerate([(-0.42, 0.16, 0.40), (0.42, 0.16, 0.40),
                                      (0.0, -0.16, 0.46), (0.0, -0.66, 0.30)]):
        d.ellipse([cx + dx * r - rr * r, sw_cy + dy * r - rr * r,
                   cx + dx * r + rr * r, sw_cy + dy * r + rr * r], fill=CREAM)
    # waffle notch on the lower cone
    for i in range(-2, 3):
        x = cx + i * r * 0.30
        d.line([(x, top + r * 0.72), (cx + i * r * 0.10, tip - S * 0.03)],
               fill=RED_DEEP, width=int(u * 1.1))
    return _fin(img, size)


# --- B: bold "L" monogram carved from a scoop, tight and app-icon friendly.
def concept_b(size=512, *, transparent=False, bg=RED):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx, cy = S * 0.5, S * 0.5
    # cream disc
    r = S * 0.335
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM)
    # a chunky L cut into it
    lw = S * 0.088
    x0, y0 = cx - S * 0.10, cy - S * 0.175
    d.rounded_rectangle([x0, y0, x0 + lw, cy + S * 0.135], radius=lw * 0.42, fill=RED)
    d.rounded_rectangle([x0, cy + S * 0.135 - lw, x0 + S * 0.235, cy + S * 0.135],
                        radius=lw * 0.42, fill=RED)
    # single scoop + drip above, so it still reads as ice cream
    d.ellipse([cx - r * 0.30, cy - r * 1.42, cx + r * 0.30, cy - r * 0.82], fill=CREAM)
    d.ellipse([cx + r * 0.42, cy + r * 0.62, cx + r * 0.66, cy + r * 0.86], fill=CREAM)
    return _fin(img, size)


# --- C: cone + swirl in a red keyline circle "badge", flat and modern.
def concept_c(size=512, *, transparent=False, bg=CREAM):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx = S * 0.5
    lw = int(u * 3.4)
    # cone
    top, half = S * 0.545, S * 0.175
    tip = S * 0.845
    d.polygon([(cx - half, top), (cx + half, top), (cx, tip)], fill=RED)
    for i in range(-1, 2):
        d.line([(cx + i * half * 0.6, top + S * 0.03), (cx + i * half * 0.2, tip - S * 0.03)],
               fill=CREAM, width=int(u * 1.4))
    # soft-serve swirl: three offset lobes tapering upward
    lobes = [(0.0, 0.485, 0.205), (-0.055, 0.375, 0.165), (0.05, 0.285, 0.125),
             (0.0, 0.215, 0.082)]
    for dx, fy, rr in lobes:
        d.ellipse([cx + dx * S - rr * S, fy * S - rr * S,
                   cx + dx * S + rr * S, fy * S + rr * S], fill=RED)
    # cherry
    d.ellipse([cx + S * 0.055, S * 0.135, cx + S * 0.145, S * 0.225], fill=MANGO)
    return _fin(img, size)


# --- D: two scoops forming the "oo" of loodly — wordmark-native mark.
def concept_d(size=512, *, transparent=False, bg=WHITE):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx, cy = S * 0.5, S * 0.46
    r = S * 0.20
    lw = int(u * 6.2)
    for off in (-1, 1):
        ox = cx + off * r * 1.02
        d.ellipse([ox - r, cy - r, ox + r, cy + r], outline=RED, width=lw)
        d.ellipse([ox - r * 0.34, cy - r * 0.34, ox + r * 0.34, cy + r * 0.34], fill=RED)
    # cone under the pair
    d.polygon([(cx - r * 0.86, cy + r * 0.90), (cx + r * 0.86, cy + r * 0.90),
               (cx, S * 0.90)], fill=RED_DEEP)
    return _fin(img, size)


def sheet(size=300):
    """Contact sheet: each concept on a light and a dark tile."""
    cons = [("A pin-cone", concept_a), ("B L-monogram", concept_b),
            ("C swirl badge", concept_c), ("D oo-scoops", concept_d)]
    from brand import f_bold
    pad = 30
    W = pad + len(cons) * (size + pad)
    H = pad + size + 60 + size + pad + 40
    img = Image.new("RGB", (W, H), (244, 244, 246))
    d = ImageDraw.Draw(img)
    for i, (name, fn) in enumerate(cons):
        x = pad + i * (size + pad)
        img.paste(fn(size).convert("RGB"), (x, pad))
        d.text((x + size / 2, pad + size + 30), name, font=f_bold(26),
               fill=(30, 30, 36), anchor="mm")
        # on-red tile to check contrast
        tile = Image.new("RGB", (size, size), RED if i != 1 else INK)
        m = fn(size, transparent=True)
        tile.paste(m.convert("RGB"), (0, 0), m.split()[3])
        img.paste(tile, (x, pad + size + 60))
    return img


if __name__ == "__main__":
    sheet().save("/tmp/concepts.png")
    print("ok")
