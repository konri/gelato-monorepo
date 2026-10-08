"""Loodly brand primitives: palette, wordmark, app icon.

Everything is drawn procedurally with PIL so the whole kit can be regenerated at
any resolution.

The mark lives in `logo.py`: the `oo` of "loodly" IS the ice cream — the pair is
kerned tight so the two counters read as scoops, a cream scoop cluster piles
over them, and a waffle cone sits behind, its mouth narrower than the `oo` span
so the cone never pokes out past the letters. `wordmark()` and `app_icon()` here
are thin adapters over that geometry, kept so existing call sites resolve
unchanged.

There is deliberately no cream-on-red treatment: the mark reads poorly on the
brand red (the cluster loses its keylines and the counters fill in), so every
surface uses the red-on-cream primary instead.
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------- palette ----
# Brand red comes from the running client app (constants/colors.ts); berry /
# espresso / cream come from the landing page tailwind theme. The marketing
# background is a red-family wash (SCARLET/CRIMSON) rather than the old pink.
RED = (236, 40, 40)
RED_DARK = (198, 26, 32)
RED_LIGHT = (247, 106, 96)
SCARLET = (226, 58, 54)
CRIMSON = (176, 26, 34)
# Legacy rose names kept as red-tinted neutrals so older call sites still read
# sensibly; nothing brand-critical uses them any more.
ROSE = (232, 96, 92)
ROSE_LIGHT = (247, 150, 142)
ROSE_DEEP = (188, 40, 44)
BERRY = (192, 38, 163)
# The logo colour: the landing / client-app berry (the logo was RED before).
# RED stays the UI red of the screenshot mocks (screens.py, ui.py, frame.py).
LOGO = BERRY
ESPRESSO = (58, 21, 38)
INK = (42, 16, 28)
CREAM = (255, 244, 232)
CREAM_SOFT = (255, 248, 240)
WHITE = (255, 255, 255)
MINT = (139, 195, 74)
MANGO = (255, 176, 32)
SKY = (108, 195, 224)
GREY = (120, 122, 130)
GREY_LIGHT = (232, 232, 236)

FONT_DIR = "/System/Library/Fonts"
F_ROUND = f"{FONT_DIR}/Supplemental/Arial Rounded Bold.ttf"
F_BLACK = f"{FONT_DIR}/Supplemental/Arial Black.ttf"
F_BOLD = f"{FONT_DIR}/Supplemental/Arial Bold.ttf"
F_REG = f"{FONT_DIR}/Supplemental/Arial.ttf"
F_AVENIR = f"{FONT_DIR}/Avenir Next.ttc"


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size, index=index)


def f_round(size: int):
    return font(F_ROUND, size)


def f_black(size: int):
    return font(F_BLACK, size)


def f_bold(size: int):
    return font(F_BOLD, size)


def f_reg(size: int):
    return font(F_REG, size)


# --------------------------------------------------------------- wordmark ----
def wordmark(height: int = 240, *, core=LOGO, light=CREAM, dark=RED_DARK,
             text="loodly", stacked=True, mark=True) -> Image.Image:
    """The `loodly` logo — see `logo.logo()` for the geometry.

    The ice cream is built into the `oo`, so the mark is no longer a separate
    element beside the text: `stacked` and `mark` are accepted and ignored, kept
    only so older call sites keep working. Returns RGBA trimmed to content.
    """
    from logo import logo as _logo

    # `core` is the letter colour; the scoop keylines follow it so the cluster
    # stays attached to the letterforms in any single-colour context.
    return _logo(int(height * 0.74), letters=core, keyline=core,
                 counter=CREAM_SOFT)


# ------------------------------------------------------------------- icon ----
def app_icon(size: int = 1024, *, bg=CREAM_SOFT, transparent=False,
             mark_col=LOGO, scoop_col=CREAM, squircle=False) -> Image.Image:
    """The `oo`-cone mark on a square — see `logo.logo_mark()`.

    `scoop_col` is accepted and ignored (the cluster is always cream); it is
    kept so older call sites keep resolving.
    """
    from logo import logo_mark

    img = logo_mark(size, transparent=True, letters=mark_col, keyline=mark_col,
                    counter=CREAM_SOFT)
    if transparent and not squircle:
        return img

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    if not transparent:
        d.rounded_rectangle([0, 0, size - 1, size - 1],
                            radius=size * 0.235, fill=bg + (255,))
    out.alpha_composite(img)

    if squircle:
        mask = Image.new("L", (size * 2, size * 2), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size * 2 - 1, size * 2 - 1], radius=int(size * 2 * 0.235), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
        clipped = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        clipped.paste(out, (0, 0), mask)
        out = clipped
    return out


def icon_flat(size: int = 1024, *, bg=CREAM_SOFT) -> Image.Image:
    """App-store icon: full-bleed square, no transparency (Apple requirement)."""
    img = app_icon(size, transparent=True)
    out = Image.new("RGB", (size, size), bg)
    out.paste(img.convert("RGB"), (0, 0), img.split()[3])
    return out


# NOTE: there is intentionally no `icon_on_red()`. The mark does not hold up as
# cream on the brand red, so the red tile treatment was dropped brand-wide.


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "brand", "_preview")
    os.makedirs(out, exist_ok=True)
    wordmark(200).save(f"{out}/wordmark.png")
    wordmark(120, stacked=False).save(f"{out}/wordmark-inline.png")
    icon_flat(512).save(f"{out}/icon.png")
    print("wrote preview to", out)
