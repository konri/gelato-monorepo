"""Refined logo directions in Loodly red. Round 2 — three developed options."""
from __future__ import annotations

import math

from PIL import Image, ImageDraw

RED = (236, 40, 40)
RED_DEEP = (198, 26, 32)
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


def _scoop_stack(d, S, cx, base_y, *, col, scale=1.0):
    """Soft-serve swirl: overlapping lobes tapering to a tip."""
    lobes = [(0.000, 0.000, 0.150), (-0.030, -0.105, 0.122),
             (0.028, -0.192, 0.096), (-0.014, -0.262, 0.070),
             (0.006, -0.318, 0.044)]
    for dx, dy, rr in lobes:
        r = rr * S * scale
        x = cx + dx * S * scale
        y = base_y + dy * S * scale
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)


def _cone(d, S, cx, top, half, tip, *, col, line, lw):
    d.polygon([(cx - half, top), (cx + half, top), (cx, tip)], fill=col)
    # two clean chevrons instead of a busy lattice — survives at 40px
    for k in (0.34, 0.62):
        y = top + (tip - top) * k
        w = half * (1 - k) * 1.55
        d.line([(cx - w, y - (tip - top) * 0.10), (cx, y),
                (cx + w, y - (tip - top) * 0.10)], fill=line, width=lw, joint="curve")


# --- 1: RED CONE. Solid red cone + cream swirl. Warm, food-first, our colour.
def logo_cone(size=512, *, transparent=False, bg=CREAM):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx = S * 0.5
    top, tip, half = S * 0.520, S * 0.880, S * 0.170
    _cone(d, S, cx, top, half, tip, col=RED, line=CREAM if not transparent else CREAM,
          lw=int(u * 2.2))
    _scoop_stack(d, S, cx, top - S * 0.055, col=RED)
    # cream highlight down the swirl so it is not one flat mass
    d.ellipse([cx - S * 0.055, top - S * 0.245, cx + S * 0.010, top - S * 0.120],
              fill=(255, 120, 110))
    return _fin(img, size)


# --- 2: L-BADGE. Cream disc on red, chunky L + scoop. Strongest at small size.
def logo_badge(size=512, *, transparent=False, bg=RED):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx, cy = S * 0.5, S * 0.545
    r = S * 0.315
    disc = CREAM
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=disc)
    # chunky rounded L
    lw = S * 0.093
    x0 = cx - S * 0.095
    ytop = cy - S * 0.175
    ybot = cy + S * 0.150
    d.rounded_rectangle([x0, ytop, x0 + lw, ybot], radius=lw * 0.45, fill=RED)
    d.rounded_rectangle([x0, ybot - lw, x0 + S * 0.250, ybot], radius=lw * 0.45, fill=RED)
    # scoop + cone silhouette sitting on top of the disc
    sc = S * 0.105
    d.ellipse([cx - sc, cy - r - sc * 0.72, cx + sc, cy - r + sc * 1.12], fill=disc)
    d.ellipse([cx - sc * 0.52, cy - r - sc * 1.45, cx + sc * 0.52, cy - r - sc * 0.30],
              fill=disc)
    return _fin(img, size)


# --- 3: SPOT-CONE. Map pin whose point is a cone tip — "find your loodspot".
def logo_spot(size=512, *, transparent=False, bg=WHITE):
    img, d, S, u = _sup(size)
    if not transparent:
        d.rounded_rectangle([0, 0, S, S], radius=S * 0.235, fill=bg)
    cx = S * 0.5
    r = S * 0.245
    top = S * 0.365
    tip = S * 0.885
    # teardrop: disc + tapering triangle
    d.ellipse([cx - r, top - r, cx + r, top + r], fill=RED)
    d.polygon([(cx - r * 0.845, top + r * 0.535), (cx + r * 0.845, top + r * 0.535),
               (cx, tip)], fill=RED)
    # cream scoop-pair punched into the pin (the "oo" of loodly)
    sr = r * 0.335
    for off in (-1, 1):
        d.ellipse([cx + off * sr * 1.06 - sr, top - sr * 0.62,
                   cx + off * sr * 1.06 + sr, top + sr * 1.38], fill=CREAM)
    d.ellipse([cx - sr * 0.86, top - sr * 1.62, cx + sr * 0.86, top + sr * 0.10],
              fill=CREAM)
    # waffle chevrons on the tapering tail
    for k in (0.30, 0.55):
        y = top + r * 0.62 + (tip - top - r * 0.62) * k
        w = r * 0.80 * (1 - k)
        d.line([(cx - w, y - S * 0.022), (cx, y), (cx + w, y - S * 0.022)],
               fill=CREAM, width=int(u * 1.9), joint="curve")
    return _fin(img, size)


def sheet(size=300):
    from brand import f_bold
    cons = [("1 red cone", logo_cone), ("2 L-badge", logo_badge),
            ("3 spot-cone", logo_spot)]
    pad, small = 34, 84
    W = pad + len(cons) * (size + pad)
    H = pad + size + 44 + size + 44 + small + pad
    img = Image.new("RGB", (W, H), (244, 244, 246))
    d = ImageDraw.Draw(img)
    for i, (name, fn) in enumerate(cons):
        x = pad + i * (size + pad)
        img.paste(fn(size).convert("RGB"), (x, pad))
        d.text((x + size / 2, pad + size + 22), name, font=f_bold(26),
               fill=(30, 30, 36), anchor="mm")
        y2 = pad + size + 44
        tile = Image.new("RGB", (size, size), INK)
        m = fn(size, transparent=True)
        tile.paste(m.convert("RGB"), (0, 0), m.split()[3])
        img.paste(tile, (x, y2))
        # small-size legibility row: 40 / 60 / 84 px
        y3 = y2 + size + 22
        sx = x
        for s in (40, 60, small):
            img.paste(fn(s).convert("RGB"), (sx, y3 + (small - s)))
            sx += s + 14
    return img


if __name__ == "__main__":
    sheet().save("/tmp/concepts2.png")
    print("ok")
