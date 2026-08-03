"""Write the on-device icon/splash PNGs into the three Expo apps.

`build.py` produces the *store listing* assets; this writes the images the apps
actually ship (`app.json` -> icon / adaptiveIcon / splash / favicon). Filenames
are kept exactly as `app.json` already references them so no config changes are
needed.

Run: python3 appicons.py ../..
"""
from __future__ import annotations

import os
import sys

from PIL import Image

from brand import CREAM_SOFT, RED, WHITE
from logo import logo, logo_mark

# app dir -> the suffix used in that app's logo filenames
APPS = {
    "mobile": "",
    "mobile-courier": "_courier",
    "mobile-spot": "_spot",
}


def _flat(img: Image.Image, bg) -> Image.Image:
    """Composite RGBA over an opaque background (stores reject alpha icons)."""
    out = Image.new("RGB", img.size, bg)
    out.paste(img.convert("RGB"), (0, 0), img.split()[3])
    return out


def _splash_art() -> Image.Image:
    """Splash art = the bare lockup, transparent, trimmed to its content.

    Expo's splash plugin scales this to `imageWidth` and centres it on
    `backgroundColor`, so the asset must carry NO padding of its own — the
    Android adaptive foreground (which does have a safe-zone margin) is the
    wrong source for this and made the splash logo look small.
    """
    return logo(420, counter=CREAM_SOFT)


def write_app(root: str, app: str, sfx: str) -> None:
    p = os.path.join(root, app, "assets", "images")
    if not os.path.isdir(p):
        print("skip (missing)", p)
        return

    def save(img, name, **kw):
        img.save(os.path.join(p, name), "PNG", optimize=True, **kw)

    # store/on-device icon — opaque, square, cream tile
    save(_flat(logo_mark(1024, transparent=True), CREAM_SOFT), f"logo_new{sfx}.png")
    # android adaptive foreground — transparent, generous safe-zone padding
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    inner = logo_mark(700, transparent=True)
    fg.alpha_composite(inner, (162, 162))
    save(fg, f"logo_full{sfx}.png")
    # web favicon
    save(_flat(logo_mark(512, transparent=True), CREAM_SOFT), "logo.png")
    # referral card art (used by ReferAppSection) — transparent lockup
    save(logo(220, counter=CREAM_SOFT), "logo_glow.png")
    # splash art — referenced by the expo-splash-screen plugin in app.json
    save(_splash_art(), f"splash{sfx}.png")
    print("icons ->", p)


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    for app, sfx in APPS.items():
        write_app(root, app, sfx)
