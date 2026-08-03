"""Emit the Loodly mark and wordmark as SVG for in-app (react-native-svg) use.

Geometry mirrors `logo.py`: the `oo` of "loodly" is the ice cream — a cream
scoop cluster piles over the letter pair, and a waffle cone sits behind with its
mouth narrower than the `oo` span so it never pokes out past the letters.

There is no cream-on-red cut: the mark does not hold up on the brand red, so
every in-app surface uses the red-on-cream primary.
"""
from __future__ import annotations

RED = "#EC2828"
RED_DARK = "#C61A20"
CREAM = "#FFF7F0"
MANGO = "#FFB020"
WHITE = "#FFFFFF"

# --- icon geometry on a 0-100 viewBox -----------------------------------------
# The `oo` is drawn as two rings; the cone and cluster are placed relative to
# them. Values mirror logo.logo_mark(cone_len=1.60, cone_width=0.42,
# scoop_scale=0.92).
CX = 50.0
O_RY = 13.0            # letter `o` outer y-radius
O_RX = 12.2            # letter `o` outer x-radius
O_DX = 11.4            # half the distance between the two `o` centres
O_CY = 52.0            # `o` centre y
RING = 5.0             # letter stroke weight
OO_SPAN = 2 * O_DX + 2 * O_RX
CONE_TOP = O_CY - 6.0
# mouth half-width = 0.42 * the full `oo` span, matching logo.py
CONE_HW = 0.42 * OO_SPAN
CONE_TIP = 92.0
SR = 0.205 * OO_SPAN * 0.92   # scoop radius (scoop_scale=0.92, as logo.py)


def _cone(fill=MANGO, cell=CREAM) -> str:
    """Waffle cone: mango body, cream interior, mango cross-hatch."""
    body = (f"M{CX - CONE_HW:.2f} {CONE_TOP:.2f} "
            f"L{CX + CONE_HW:.2f} {CONE_TOP:.2f} "
            f"L{CX:.2f} {CONE_TIP:.2f} Z")
    inset = 1.7
    ih = (CONE_TIP - CONE_TOP) * (CONE_HW - inset) / CONE_HW
    inner_hw = CONE_HW - inset
    inner = (f"M{CX - inner_hw:.2f} {CONE_TOP + inset:.2f} "
             f"L{CX + inner_hw:.2f} {CONE_TOP + inset:.2f} "
             f"L{CX:.2f} {CONE_TOP + inset + ih:.2f} Z")
    # hatch lines clipped to the cream interior
    hatch = []
    for k in range(-3, 7):
        b = CONE_TOP + k * 7.4
        hatch.append(f'<path d="M{CX - 60:.2f} {b - 60:.2f} '
                     f'L{CX + 60:.2f} {b + 60:.2f}" stroke="{fill}" '
                     f'stroke-width="1.5"/>')
        hatch.append(f'<path d="M{CX - 60:.2f} {b + 60:.2f} '
                     f'L{CX + 60:.2f} {b - 60:.2f}" stroke="{fill}" '
                     f'stroke-width="1.5"/>')
    nl = chr(10)
    return f'''  <path d="{body}" fill="{fill}"/>
  <path d="{inner}" fill="{cell}"/>
  <clipPath id="coneClip"><path d="{inner}"/></clipPath>
  <g clip-path="url(#coneClip)">
{nl.join('    ' + h for h in hatch)}
  </g>'''


def _cluster(fill=CREAM, line=RED) -> str:
    """Cream scoop cluster above the `oo`, back row first."""
    # matches logo.py: cluster base sits 0.22 x-heights below the `o` top
    base = (O_CY - O_RY) + (2 * O_RY) * 0.22
    balls = [
        (CX - SR * 1.72, base - SR * 0.72, SR * 1.00),
        (CX + SR * 1.72, base - SR * 0.72, SR * 1.00),
        (CX - SR * 0.62, base - SR * 1.62, SR * 0.92),
        (CX + SR * 0.62, base - SR * 1.62, SR * 0.92),
        (CX, base - SR * 2.42, SR * 0.86),
        (CX - SR * 1.02, base - SR * 0.10, SR * 1.06),
        (CX + SR * 1.02, base - SR * 0.10, SR * 1.06),
        (CX, base - SR * 0.92, SR * 1.10),
    ]
    return chr(10).join(
        f'  <circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{fill}" '
        f'stroke="{line}" stroke-width="1.6"/>' for x, y, r in balls)


def _oo(fill=RED, counter=CREAM) -> str:
    """The kerned `oo` pair drawn as two rings, over the cone and cluster."""
    out = []
    for dx in (-O_DX, O_DX):
        out.append(f'  <ellipse cx="{CX + dx:.2f}" cy="{O_CY:.2f}" '
                   f'rx="{O_RX:.2f}" ry="{O_RY:.2f}" fill="{fill}"/>')
    for dx in (-O_DX, O_DX):
        out.append(f'  <ellipse cx="{CX + dx:.2f}" cy="{O_CY:.2f}" '
                   f'rx="{O_RX - RING:.2f}" ry="{O_RY - RING:.2f}" '
                   f'fill="{counter}"/>')
    return chr(10).join(out)


def _mark_body(mark=RED, scoop=CREAM) -> str:
    return f"""{_cone()}
{_cluster(fill=scoop, line=mark)}
{_oo(fill=mark, counter=scoop)}"""


def icon_svg(size: int = 100, *, bg: str | None = None,
             mark=RED, scoop=CREAM) -> str:
    bg_rect = (f'  <rect width="100" height="100" rx="23.5" fill="{bg}"/>\n'
               if bg else "")
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
{bg_rect}{_mark_body(mark, scoop)}
</svg>
'''


def wordmark_svg(w: int = 138, h: int = 25, *, fill=RED) -> str:
    """Single-line `loodly` wordmark for app headers — text only, no ice cream.

    Used where vertical space is too tight for the cluster (nav bars, chips).
    """
    return f'''<svg width="{w}" height="{h}" viewBox="0 0 138 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="69" y="20" text-anchor="middle" font-family="Urbanist, Avenir Next, Arial Rounded MT Bold, Helvetica, sans-serif" font-size="24" font-weight="800" letter-spacing="-1.2" fill="{fill}">loodly</text>
</svg>
'''


def lockup_svg(w: int = 232, h: int = 160, *, fill=RED, scoop=CREAM) -> str:
    """Full logo: the ice cream built into the `oo` of `loodly`.

    Splash screens and email headers. The `l` and `dly` are set as text either
    side of the drawn `oo` cone, with the pair kerned tight.
    """
    # The drawn `oo` block is scaled so its letter x-height matches the text,
    # then translated so its `o` centre line lands on the text's x-height band.
    fs = 74
    baseline = 112.0
    k = (fs * 0.355) / O_RY         # x-height half-band / drawn `o` radius
    ox = 30.0                        # where the `oo` block's left edge lands
    # the mark is centred on CX in its own coords, so back that out of the
    # translate; same for the `o` centre line versus the text x-height band
    tx = ox - (CX - OO_SPAN / 2) * k
    ty = (baseline - fs * 0.355) - O_CY * k
    dly_x = ox + OO_SPAN * k
    # viewBox is the tight content box (cluster top -> cone tip, `l` -> `y`), so
    # the SVG has no dead margin and centres correctly in a flex row.
    return f'''<svg width="{w}" height="{h}" viewBox="4 10 232 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="8" y="{baseline:.0f}" font-family="Urbanist, Avenir Next, Arial Rounded MT Bold, Helvetica, sans-serif" font-size="{fs}" font-weight="800" fill="{fill}">l</text>
  <g transform="translate({tx:.2f} {ty:.2f}) scale({k:.4f})">
{_mark_body(fill, scoop)}
  </g>
  <text x="{dly_x:.1f}" y="{baseline:.0f}" font-family="Urbanist, Avenir Next, Arial Rounded MT Bold, Helvetica, sans-serif" font-size="{fs}" font-weight="800" fill="{fill}">dly</text>
</svg>
'''


def _write_web(root: str) -> None:
    """Favicon + inline logo for the two web apps."""
    import os

    targets = [
        (os.path.join(root, "admin-global-web-new", "public"), True),
        (os.path.join(root, "landing-page-new", "public"), True),
    ]
    for p, _ in targets:
        if not os.path.isdir(p):
            print("skip (missing)", p)
            continue
        open(f"{p}/favicon.svg", "w").write(icon_svg(48))
        open(f"{p}/loodly-mark.svg", "w").write(icon_svg(40))
        open(f"{p}/loodly-logo.svg", "w").write(lockup_svg(200, 117))
        print("web svg ->", p)


if __name__ == "__main__":
    import os
    import sys

    root = sys.argv[1] if len(sys.argv) > 1 else "."
    _write_web(root)
    for app in ("mobile", "mobile-courier", "mobile-spot"):
        p = os.path.join(root, app, "assets", "images")
        if not os.path.isdir(p):
            continue
        # filenames are kept as-is so existing imports keep resolving
        open(f"{p}/bonapka.svg", "w").write(wordmark_svg())
        open(f"{p}/logo.svg", "w").write(icon_svg(80))
        open(f"{p}/gelato_logo.svg", "w").write(icon_svg(24))
        open(f"{p}/loodly_logo.svg", "w").write(icon_svg(24))
        # light variants for photo overlays (still red-on-light elsewhere)
        open(f"{p}/logo_white.svg", "w").write(wordmark_svg(25, 22, fill=WHITE))
        open(f"{p}/logo_light.svg", "w").write(
            wordmark_svg(79, 74, fill="rgba(255,255,255,0.6)"))
        open(f"{p}/logo_new.svg", "w").write(icon_svg(327, bg="#FFFFFF"))
        open(f"{p}/loodly_lockup.svg", "w").write(lockup_svg())
        # legacy stacked filename -> now the full lockup
        open(f"{p}/loodly_stacked.svg", "w").write(lockup_svg())
        print("svg ->", p)
