"""Phone/tablet UI mocks rendered into a device frame.

Each `screen_*` function paints one app screen at a fixed logical resolution
(PHONE_W x PHONE_H or TABLET_*), which `frame.py` then scales into a bezel. The
client screens mirror the real app; courier and spot screens are mocked from the
documented feature set (order queue, claim, delivery handover, incidents).
"""
from __future__ import annotations

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from brand import (
    CREAM, CREAM_SOFT, ESPRESSO, GREY, GREY_LIGHT, INK, MANGO, MINT, RED,
    RED_DARK, ROSE, ROSE_DEEP, ROSE_LIGHT, SKY, WHITE, app_icon, f_black,
    f_bold, f_reg, f_round, wordmark,
)

PHONE_W, PHONE_H = 1170, 2532          # iPhone-ish logical canvas
TABLET_W, TABLET_H = 1640, 2200        # portrait tablet canvas


# ------------------------------------------------------------- primitives ----
def card(d, box, *, radius=28, fill=WHITE, border=None, bw=2):
    d.rounded_rectangle(box, radius=radius, fill=fill,
                        outline=border, width=bw if border else 0)


def shadow_card(img, box, *, radius=28, fill=WHITE, blur=18, alpha=38):
    """Rounded card with a soft drop shadow composited underneath."""
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [box[0], box[1] + blur // 2, box[2], box[3] + blur // 2],
        radius=radius, fill=(60, 30, 45, alpha),
    )
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur / 2)))
    ImageDraw.Draw(img).rounded_rectangle(box, radius=radius, fill=fill)


def fit_font(d, text, fnt, max_w, *, path=None, min_size=18):
    """Shrink `fnt` until `text` fits `max_w` — Polish labels run long."""
    size = fnt.size
    p = path or fnt.path
    while size > min_size and d.textlength(text, font=fnt) > max_w:
        size -= 2
        fnt = ImageFont.truetype(p, size)
    return fnt


def pill(d, box, text, fnt, *, fill, fg=WHITE, radius=None, pad=28):
    r = radius if radius is not None else (box[3] - box[1]) // 2
    d.rounded_rectangle(box, radius=r, fill=fill)
    fnt = fit_font(d, text, fnt, (box[2] - box[0]) - pad * 2)
    d.text(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2 + 1), text,
           font=fnt, fill=fg, anchor="mm")


def photo(img, box, *, seed=0, kind="icecream"):
    """Procedural food-photo stand-in: warm gradient + soft blobs.

    Real photography is not available offline, so store screenshots use these
    abstract swatches; swap in real assets before submission.
    """
    w = int(box[2] - box[0])
    h = int(box[3] - box[1])
    if w <= 0 or h <= 0:
        return
    palettes = [
        [(255, 214, 224), (255, 160, 180), (250, 120, 150)],
        [(255, 236, 205), (255, 200, 130), (240, 165, 90)],
        [(226, 244, 216), (180, 225, 160), (140, 200, 120)],
        [(240, 224, 255), (210, 185, 250), (180, 150, 235)],
        [(255, 226, 214), (255, 180, 150), (245, 140, 110)],
        [(222, 238, 250), (175, 210, 240), (135, 180, 225)],
    ]
    pal = palettes[seed % len(palettes)]
    tile = Image.new("RGB", (w, h), pal[0])
    td = ImageDraw.Draw(tile)
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(int(pal[0][i] + (pal[1][i] - pal[0][i]) * t) for i in range(3))
        td.line([(0, y), (w, y)], fill=col)
    # a few overlapping soft circles suggest scoops
    rnd = [(0.28, 0.62, 0.30), (0.62, 0.44, 0.26), (0.46, 0.78, 0.22),
           (0.80, 0.72, 0.20), (0.14, 0.30, 0.18)]
    for i, (fx, fy, fr) in enumerate(rnd):
        fx = (fx + seed * 0.13) % 1.0
        rr = fr * min(w, h)
        cxx, cyy = fx * w, fy * h
        col = pal[2] if i % 2 else pal[1]
        td.ellipse([cxx - rr, cyy - rr, cxx + rr, cyy + rr], fill=col)
    tile = tile.filter(ImageFilter.GaussianBlur(min(w, h) * 0.045))
    img.paste(tile, (int(box[0]), int(box[1])))


def rounded_photo(img, box, *, seed=0, radius=24):
    w = int(box[2] - box[0])
    h = int(box[3] - box[1])
    if w <= 0 or h <= 0:
        return
    tmp = Image.new("RGB", img.size, WHITE)
    photo(tmp, box, seed=seed)
    crop = tmp.crop((int(box[0]), int(box[1]), int(box[0]) + w, int(box[1]) + h))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    img.paste(crop, (int(box[0]), int(box[1])), mask)


def status_bar(d, w, *, dark=False, time="9:41", notch=None):
    fg = INK if not dark else WHITE
    d.text((62, 60), time, font=f_bold(40), fill=fg, anchor="lm")
    # tablets have no Dynamic Island — infer from the canvas width
    if notch is None:
        notch = w <= PHONE_W
    if notch:
        d.rounded_rectangle([w / 2 - 130, 26, w / 2 + 130, 92], radius=34, fill=(10, 10, 12))
    # signal / wifi / battery glyphs
    x = w - 250
    for i in range(4):
        hh = 12 + i * 8
        d.rounded_rectangle([x + i * 18, 66 - hh / 2 + 6, x + i * 18 + 10, 72], radius=3, fill=fg)
    d.arc([x + 88, 44, x + 136, 92], start=205, end=335, fill=fg, width=7)
    d.rounded_rectangle([x + 158, 48, x + 226, 80], radius=9, outline=fg, width=4)
    d.rounded_rectangle([x + 162, 52, x + 214, 76], radius=6, fill=fg)


def tab_bar(img, w, h, active, items, *, accent=RED):
    """Floating pill tab bar matching the client app's real navigation."""
    d = ImageDraw.Draw(img)
    bar = [40, h - 200, w - 40, h - 60]
    shadow_card(img, bar, radius=70, fill=WHITE, blur=24, alpha=46)
    d = ImageDraw.Draw(img)
    n = len(items)
    slot = (bar[2] - bar[0]) / n
    for i, label in enumerate(items):
        cxx = bar[0] + slot * (i + 0.5)
        cyy = (bar[1] + bar[3]) / 2
        on = i == active
        if on:
            d.rounded_rectangle([cxx - slot * 0.44, bar[1] + 12,
                                 cxx + slot * 0.44, bar[3] - 12],
                                radius=48, fill=(243, 243, 245))
        col = accent if on else INK
        _tab_glyph(d, label, cxx, cyy - 20, col, on)
        lf = fit_font(d, label, f_bold(30) if on else f_reg(30), slot * 0.94)
        d.text((cxx, cyy + 40), label, font=lf, fill=col, anchor="mm")


def _tab_glyph(d, label, cx, cy, col, on):
    import math
    s = 22
    key = label.lower()
    if key in ("zespół", "staff"):          # two-person glyph
        for off in (-s * 0.5, s * 0.5):
            d.ellipse([cx + off - s * 0.42, cy - s * 0.9,
                       cx + off + s * 0.42, cy - s * 0.06], outline=col, width=5,
                      fill=col if on else None)
            d.arc([cx + off - s * 0.7, cy - s * 0.05, cx + off + s * 0.7, cy + s * 1.3],
                  180, 360, fill=col, width=5)
        return
    if key in ("raporty", "reports"):       # bar-chart glyph
        for i, hh in enumerate((0.45, 0.8, 0.62)):
            bx = cx - s * 0.72 + i * s * 0.72
            d.rounded_rectangle([bx - s * 0.22, cy + s - 2 * s * hh,
                                 bx + s * 0.22, cy + s], radius=3,
                                fill=col if on else None, outline=col, width=4)
        return
    if key in ("więcej", "more"):           # ellipsis glyph
        for i in (-1, 0, 1):
            d.ellipse([cx + i * s * 0.7 - 5, cy - 5, cx + i * s * 0.7 + 5, cy + 5], fill=col)
        return
    if key in ("dostawa", "delivery", "dostawy"):   # scooter-ish glyph
        d.ellipse([cx - s, cy + s * 0.2, cx - s * 0.3, cy + s * 0.9], outline=col, width=5)
        d.ellipse([cx + s * 0.3, cy + s * 0.2, cx + s, cy + s * 0.9], outline=col, width=5)
        d.line([(cx - s * 0.65, cy + s * 0.55), (cx, cy - s * 0.5),
                (cx + s * 0.65, cy + s * 0.55)], fill=col, width=5, joint="curve")
        return
    if key in ("mapa",):
        key = "map"
    if key in ("start", "home", "queue", "kolejka"):
        d.polygon([(cx, cy - s), (cx - s, cy), (cx + s, cy)], fill=col)
        d.rectangle([cx - s * 0.7, cy, cx + s * 0.7, cy + s * 0.8], fill=col)
    elif key in ("smaki", "flavours", "flavors", "menu"):
        d.ellipse([cx - s, cy - s, cx + s, cy + s], outline=col,
                  width=6, fill=col if on else None)
    elif key in ("zamówienie", "orders", "order", "zamówienia", "delivery", "dostawy"):
        d.rounded_rectangle([cx - s, cy - s * 0.4, cx + s, cy + s * 0.8], radius=5,
                            outline=col, width=6)
        d.arc([cx - s * 0.6, cy - s, cx + s * 0.6, cy + s * 0.2], 180, 360, fill=col, width=6)
    elif key in ("nagrody", "rewards", "earnings", "zarobki"):
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = s if i % 2 == 0 else s * 0.45
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        d.polygon(pts, fill=col if on else None, outline=col, width=5)
    else:  # map / punkty / more
        d.polygon([(cx - s, cy - s * 0.7), (cx - s * 0.33, cy - s),
                   (cx - s * 0.33, cy + s), (cx - s, cy + s * 0.7)], outline=col,
                  width=5, fill=col if on else None)
        d.polygon([(cx + s * 0.33, cy - s), (cx + s, cy - s * 0.7),
                   (cx + s, cy + s * 0.7), (cx + s * 0.33, cy + s)], outline=col,
                  width=5, fill=col if on else None)


def app_header(img, w, title, *, bell=1, accent=RED):
    """Logo + wordmark + bell/settings row, as in the client app."""
    d = ImageDraw.Draw(img)
    mark = app_icon(96, transparent=True)
    img.alpha_composite(mark, (56, 118))
    d.text((176, 168), title, font=f_black(58), fill=INK, anchor="lm")
    # bell
    bx, by = w - 210, 168
    d.arc([bx - 26, by - 30, bx + 26, by + 18], 180, 360, fill=INK, width=7)
    d.line([(bx - 26, by + 16), (bx + 26, by + 16)], fill=INK, width=7)
    d.line([(bx - 20, by - 6), (bx - 20, by + 16)], fill=INK, width=7)
    d.line([(bx + 20, by - 6), (bx + 20, by + 16)], fill=INK, width=7)
    d.ellipse([bx - 8, by + 20, bx + 8, by + 34], fill=INK)
    if bell:
        d.ellipse([bx + 14, by - 42, bx + 50, by - 6], fill=accent)
        d.text((bx + 32, by - 25), str(bell), font=f_bold(26), fill=WHITE, anchor="mm")
    # gear
    gx = w - 96
    d.ellipse([gx - 26, by - 26, gx + 26, by + 26], outline=INK, width=7)
    d.ellipse([gx - 9, by - 9, gx + 9, by + 9], fill=INK)
    d.line([(0, 232), (w, 232)], fill=GREY_LIGHT, width=3)


def segmented(d, w, y, labels, active, *, accent=RED):
    n = len(labels)
    slot = w / n
    for i, lab in enumerate(labels):
        cxx = slot * (i + 0.5)
        on = i == active
        d.text((cxx, y), lab, font=f_bold(42) if on else f_reg(42),
               fill=accent if on else GREY, anchor="mm")
        if on:
            d.rounded_rectangle([cxx - slot * 0.36, y + 40, cxx + slot * 0.36, y + 46],
                                radius=3, fill=accent)
    d.line([(0, y + 46), (w, y + 46)], fill=GREY_LIGHT, width=3)
