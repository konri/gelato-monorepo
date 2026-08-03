"""Device bezels and the marketing-screenshot composition.

`compose()` produces one finished store screenshot: brand-red background,
headline, and a framed device shot.
"""
from __future__ import annotations

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from brand import (
    CREAM, CREAM_SOFT, CRIMSON, ESPRESSO, INK, RED, SCARLET, WHITE,
    f_black, f_bold, f_round, wordmark,
)


def phone_frame(shot: Image.Image, *, radius_ratio=0.075, bezel_ratio=0.026,
                notch=False) -> Image.Image:
    """Wrap `shot` in a dark rounded bezel with a subtle metallic rim."""
    w, h = shot.size
    b = int(min(w, h) * bezel_ratio)
    R = int(min(w, h) * radius_ratio)
    W, H = w + b * 2, h + b * 2

    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=R + b, fill=(26, 26, 30, 255))
    # brushed rim highlight
    d.rounded_rectangle([2, 2, W - 3, H - 3], radius=R + b - 2,
                        outline=(96, 96, 104, 255), width=max(2, b // 6))

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=R, fill=255)
    frame.paste(shot.convert("RGB"), (b, b), mask)
    return frame


def tablet_frame(shot: Image.Image) -> Image.Image:
    return phone_frame(shot, radius_ratio=0.035, bezel_ratio=0.030)


def _bg(size, *, top=CREAM_SOFT, bottom=(255, 226, 205)):
    """Warm cream field with an oversized circle motif behind the device.

    Cream rather than the old brand-red wash: the logo does not hold up on red,
    so every marketing surface that carries the lockup is light.
    """
    w, h = size
    img = Image.new("RGB", size, top)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(int(top[i] + (bottom[i] - top[i]) * (t * 0.85)) for i in range(3))
        d.line([(0, y), (w, y)], fill=col)
    circle = Image.new("RGBA", size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(circle)
    r = w * 0.62
    cd.ellipse([w * 0.5 - r, h * 0.30, w * 0.5 + r, h * 0.30 + r * 2],
               fill=RED + (26,))
    img = Image.alpha_composite(img.convert("RGBA"), circle)
    return img.convert("RGB")


def _wrap(d, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if d.textlength(trial, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def compose(size, shot, headline, *, tablet=False, logo=False,
            device_scale=0.86, align="center") -> Image.Image:
    """Lay a framed device shot over the branded background with a headline."""
    W, H = size
    img = _bg((W, H)).convert("RGBA")
    d = ImageDraw.Draw(img)

    pad = int(W * 0.075)
    y = int(H * 0.055)

    if logo:
        # red-on-cream primary: the background is light, so no inverse cut.
        wm = wordmark(int(H * 0.052), stacked=False)
        wm.thumbnail((int(W * 0.52), int(H * 0.11)), Image.LANCZOS)
        img.alpha_composite(wm, (pad, y))
        y += wm.height + int(H * 0.03)

    if headline:
        fs = int(H * (0.036 if tablet else 0.030))
        fnt = f_black(fs)
        lines = _wrap(d, headline, fnt, W - pad * 2)
        lh = int(fs * 1.28)
        for i, line in enumerate(lines):
            if align == "left":
                d.text((pad, y + i * lh), line, font=fnt, fill=INK, anchor="la")
            else:
                d.text((W / 2, y + i * lh), line, font=fnt, fill=INK, anchor="ma")
        y += lh * len(lines) + int(H * 0.035)

    # fit the framed device into the remaining space
    frame = tablet_frame(shot) if tablet else phone_frame(shot)
    avail_h = int((H - y) * (0.99 if tablet else 1.02))
    avail_w = int(W * (0.80 if tablet else 0.72) * (device_scale / 0.86))
    scale = min(avail_w / frame.width, avail_h / frame.height)
    fw, fh = int(frame.width * scale), int(frame.height * scale)
    frame = frame.resize((fw, fh), Image.LANCZOS)

    fx = (W - fw) // 2
    fy = y

    # drop shadow under the device
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [fx + 18, fy + 30, fx + fw + 18, fy + fh + 30],
        radius=int(min(fw, fh) * 0.09), fill=(120, 60, 40, 72))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(34)))
    img.alpha_composite(frame, (fx, fy))
    return img.convert("RGB")


def feature_graphic(size, headline, sub, shot=None) -> Image.Image:
    """Google Play 1024x500 feature graphic: wordmark left, device right."""
    W, H = size
    img = _bg((W, H)).convert("RGBA")
    d = ImageDraw.Draw(img)

    wm = wordmark(int(H * 0.30))
    wm.thumbnail((int(W * 0.34), int(H * 0.58)), Image.LANCZOS)
    img.alpha_composite(wm, (int(W * 0.055), int(H * 0.08)))

    fnt = f_black(int(H * 0.088))
    lines = _wrap(d, headline, fnt, int(W * 0.46))
    ty = int(H * 0.08) + wm.height + int(H * 0.05)
    for i, line in enumerate(lines):
        d.text((int(W * 0.055), ty + i * int(H * 0.105)), line,
               font=fnt, fill=INK, anchor="la")
    d.text((int(W * 0.055), ty + len(lines) * int(H * 0.105) + int(H * 0.03)),
           sub, font=f_bold(int(H * 0.058)), fill=ESPRESSO, anchor="la")

    if shot is not None:
        frame = phone_frame(shot)
        scale = (H * 1.12) / frame.height
        frame = frame.resize((int(frame.width * scale), int(frame.height * scale)),
                             Image.LANCZOS)
        frame = frame.rotate(-9, resample=Image.BICUBIC, expand=True)
        img.alpha_composite(frame, (int(W * 0.62), int(-H * 0.10)))
    return img.convert("RGB")
