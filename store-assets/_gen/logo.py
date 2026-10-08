"""Loodly integrated logo: the `oo` in "loodly" IS the ice cream.

Composition, back to front:
  1. waffle cone — apex down, its mouth hidden behind the `oo`
  2. scoop cluster — cream scoops with red keylines, piled over the `oo`
  3. the wordmark — red rounded letters, with the `oo` pair kerned tight so the
     two counters read as a scoop pair sitting on the cone

Everything is procedural (PIL only) so the mark can be re-cut at any size.
Run `python3 logo.py` to write previews into ../brand/_preview/.
"""
from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw

from brand import CREAM, CREAM_SOFT, LOGO, MANGO, RED, RED_DARK, WHITE, F_ROUND, font

MANGO_DEEP = (240, 150, 12)

SS = 3  # supersample factor


# ------------------------------------------------------------------ pieces ----
def _cone(d_size, cx, top_y, half_w, tip_y, *, fill, cell, lw, hatch_from=None):
    """Waffle cone: cream body, mango rim, mango diagonal cross-hatch."""
    layer = Image.new("RGBA", d_size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)

    tri = [(cx - half_w, top_y), (cx + half_w, top_y), (cx, tip_y)]
    ld.polygon(tri, fill=fill)
    # cream interior, inset so a solid mango rim survives at small sizes
    inset = lw * 1.5
    ratio = (half_w - inset) / half_w
    ih = (tip_y - top_y) * ratio
    ld.polygon([(cx - half_w + inset, top_y + inset),
                (cx + half_w + -inset, top_y + inset),
                (cx, top_y + inset + ih)], fill=cell)

    # cross-hatch, clipped to the cream interior
    hatch = Image.new("RGBA", d_size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(hatch)
    step = half_w * 0.52
    reach = (tip_y - top_y) + half_w * 2
    for k in range(-14, 15):
        b = top_y + k * step
        hd.line([(cx - reach, b - reach), (cx + reach, b + reach)],
                fill=fill, width=max(2, int(lw * 0.72)))
        hd.line([(cx - reach, b + reach), (cx + reach, b - reach)],
                fill=fill, width=max(2, int(lw * 0.72)))
    # hatch only from `hatch_from` down, so it never speckles the `o` counters
    hy = max(top_y + inset, hatch_from if hatch_from is not None else top_y + inset)
    hw = half_w * (1 - (hy - top_y) / (tip_y - top_y)) - inset
    mask = Image.new("L", d_size, 0)
    ImageDraw.Draw(mask).polygon(
        [(cx - hw, hy), (cx + hw, hy), (cx, top_y + inset + ih)], fill=255)
    layer.paste(hatch, (0, 0), Image.composite(
        mask, Image.new("L", d_size, 0), hatch.split()[3]))
    return layer


def _scoops(d_size, cx, base_y, span, *, fill, line, lw, scale=1.0):
    """Cream scoop cluster piled above the `oo`, drawn back row first.

    `scale` shrinks the whole cluster about its base, so it can be tuned to
    match the cone length without the pile detaching from the letters.
    """
    layer = Image.new("RGBA", d_size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    r = span * 0.205 * scale               # single scoop radius

    def ball(x, y, rr):
        ld.ellipse([x - rr, y - rr, x + rr, y + rr], fill=fill,
                   outline=line, width=int(lw))

    # back row — wide and low, tucked behind the front scoops
    ball(cx - r * 1.72, base_y - r * 0.72, r * 1.00)
    ball(cx + r * 1.72, base_y - r * 0.72, r * 1.00)
    ball(cx - r * 0.62, base_y - r * 1.62, r * 0.92)
    ball(cx + r * 0.62, base_y - r * 1.62, r * 0.92)
    ball(cx, base_y - r * 2.42, r * 0.86)
    # front row — sits lowest, overlapping the letters' shoulders
    ball(cx - r * 1.02, base_y - r * 0.10, r * 1.06)
    ball(cx + r * 1.02, base_y - r * 0.10, r * 1.06)
    ball(cx, base_y - r * 0.92, r * 1.10)
    return layer


# ---------------------------------------------------------------- assembly ----
def logo(height=600, *, letters=LOGO, scoop=CREAM_SOFT, keyline=LOGO,
         cone=MANGO, cone_cell=CREAM_SOFT, transparent=True, bg=WHITE,
         text="loodly", oo_kern=-0.13, tracking=-0.015, counter=None,
         cone_len=1.22, cone_width=0.42, scoop_scale=0.84, cone_top=0.86):
    """Full lockup. `height` is the nominal cap height of the letters.

    Defaults are the approved cut: short cone whose mouth stays fully behind
    the `oo`, with the scoop cloud scaled to match.

    `cone_len`    tip drop below the baseline, in `o` x-heights
    `cone_width`  mouth half-width as a fraction of the `oo` span
    `cone_top`    how far above the baseline the mouth sits, in `o` x-heights
    `scoop_scale` size of the scoop cloud about its base
    """
    fs = int(height * SS)
    W, H = int(fs * 7.6), int(fs * 4.2)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fnt = font(F_ROUND, fs)
    probe = ImageDraw.Draw(img)

    # per-glyph advances so the `oo` pair can be pulled together
    chars = list(text)
    adv = [probe.textlength(c, font=fnt) for c in chars]
    tr = fs * tracking
    oo = [i for i, c in enumerate(chars) if c == "o"]
    o1, o2 = oo[0], oo[1]

    xs, x = [], 0.0
    for i, c in enumerate(chars):
        xs.append(x)
        gap = tr + (fs * oo_kern if i == o1 else 0.0)
        x += adv[i] + gap
    word_w = x - tr

    ox = (W - word_w) / 2
    baseline = H * 0.68
    xs = [ox + v for v in xs]

    # x-height band of the `oo` (drives scoop + cone placement)
    bb = fnt.getbbox("o")
    o_top = baseline - (bb[3] - bb[1])
    o_h = bb[3] - bb[1]
    oo_l = xs[o1]
    oo_r = xs[o2] + adv[o2]
    oo_cx = (oo_l + oo_r) / 2
    oo_span = oo_r - oo_l

    lw = fs * 0.030

    # 1. cone — mouth narrower than the `oo` span and pushed up behind the
    #    letters, so the `oo` reads as the scoops sitting *in* the cone rather
    #    than the cone poking out past them
    img.alpha_composite(_cone((W, H), oo_cx, baseline - o_h * cone_top,
                              oo_span * cone_width, baseline + o_h * cone_len,
                              fill=cone, cell=cone_cell, lw=lw * 1.25,
                              hatch_from=baseline + o_h * 0.04))
    # 2. scoops — resting on the `oo` shoulders
    img.alpha_composite(_scoops((W, H), oo_cx, o_top + o_h * 0.22, oo_span,
                                fill=scoop, line=keyline, lw=lw,
                                scale=scoop_scale))
    # 3. flood the two `o` counters so the scoops behind them don't show
    #    through as bumps; the letter ring drawn next restores the outline.
    d = ImageDraw.Draw(img)
    if counter is not None:
        for i in (o1, o2):
            gw = adv[i]
            gcx = xs[i] + gw / 2
            gcy = baseline - o_h / 2
            rx, ry = gw * 0.50, o_h * 0.52
            d.ellipse([gcx - rx, gcy - ry, gcx + rx, gcy + ry], fill=counter)
    for i, c in enumerate(chars):
        d.text((xs[i], baseline), c, font=fnt, fill=letters, anchor="ls")

    img = img.resize((W // SS, H // SS), Image.LANCZOS)
    img = img.crop(img.getbbox())
    if transparent:
        return img
    flat = Image.new("RGB", img.size, bg)
    flat.paste(img.convert("RGB"), (0, 0), img.split()[3])
    return flat


def logo_mark(size=1024, *, transparent=True, bg=CREAM_SOFT, letters=LOGO,
              scoop=CREAM_SOFT, keyline=LOGO, cone=MANGO, cone_cell=CREAM_SOFT,
              counter=None):
    """Square icon cut: just the `oo` cone, no `l`/`dly`.

    Standing alone the mark can carry a slightly longer cone and fuller cloud
    than the lockup, where `dly` does part of the balancing.
    """
    m = logo(int(size * 0.42), text="oo", letters=letters, scoop=scoop,
             keyline=keyline, cone=cone, cone_cell=cone_cell, oo_kern=-0.13,
             counter=cone_cell if counter is None else counter,
             cone_len=1.60, cone_width=0.42,
             scoop_scale=0.92)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    s = min(size * 0.78 / m.width, size * 0.84 / m.height)
    m = m.resize((int(m.width * s), int(m.height * s)), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    if transparent:
        return canvas
    out = Image.new("RGB", (size, size), bg)
    out.paste(canvas.convert("RGB"), (0, 0), canvas.split()[3])
    return out


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "brand", "_preview")
    os.makedirs(out, exist_ok=True)
    # counters filled explicitly so the transparent cut matches the flat one
    logo(320, counter=CREAM_SOFT, transparent=False).save(f"{out}/logo-white.png")
    logo(320, counter=CREAM_SOFT).save(f"{out}/logo.png")
    # on red: letters go cream, scoop keylines go red so the cluster still
    # separates from the letterforms
    logo(320, letters=CREAM, keyline=RED, scoop=CREAM_SOFT, counter=RED,
         transparent=False, bg=RED).save(f"{out}/logo-on-red.png")

    logo_mark(512, transparent=False).save(f"{out}/logo-mark.png")
    logo_mark(512).save(f"{out}/logo-mark-transparent.png")
    # on red the counters must go red too, or the `oo` disappears into the cream
    logo_mark(512, transparent=False, bg=RED, letters=CREAM, keyline=RED,
              counter=RED).save(f"{out}/logo-mark-on-red.png")
    logo_mark(120, transparent=False).save(f"{out}/logo-mark-120.png")
    logo_mark(60, transparent=False).save(f"{out}/logo-mark-60.png")
    print("wrote", out)
