"""Build the whole Loodly store-asset kit.

Layout produced under store-assets/:
    <app>/{ios,android}/{phone,tablet}/{en,pl}/NN-name.png
    <app>/icon/...
    brand/...

iOS screenshots are exported at both required sizes (6.5" 1284x2778 and
5.5" 1242x2208), plus iPad 12.9" 2048x2732. Android uses 1080x1920 phone,
1200x1920 7" tablet and 1600x2560 10" tablet, plus the 1024x500 feature
graphic. Every file is a no-alpha PNG, as both stores require.
"""
from __future__ import annotations

import os

from PIL import Image

import screens
from brand import icon_flat, app_icon, wordmark
from frame import compose, feature_graphic
from screens import L
from ui import PHONE_H, PHONE_W, TABLET_H, TABLET_W

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# ---------------------------------------------------------------- targets ----
IOS_PHONE = [("6.5-1284x2778", (1284, 2778)), ("5.5-1242x2208", (1242, 2208))]
IOS_TABLET = [("12.9-2048x2732", (2048, 2732))]
AND_PHONE = [("1080x1920", (1080, 1920))]
AND_TABLET = [("7in-1200x1920", (1200, 1920)), ("10in-1600x2560", (1600, 2560))]

# ------------------------------------------------------ 8 panels per app -----
# (screen fn, headline key) — headlines are per-locale marketing copy.
COPY = {
    "client": {
        "en": [
            ("client_news", "Loodly — your ice cream spot in your pocket", True),
            ("client_account", "Collect points with every scoop you buy", False),
            ("client_spots", "Find the nearest Loodly spot and today's flavours", False),
            ("client_menu", "Order delivery or collect it at the spot", False),
            ("client_rewards", "Swap points for rewards — every tenth portion is free", False),
            ("client_map", "See delivery range and opening hours on the map", False),
            ("client_account", "Show your QR code at the counter to earn points", False),
            ("client_menu", "Check ingredients, allergens and nutrition", False),
        ],
        "pl": [
            ("client_news", "Loodly — Twoja lodziarnia w kieszeni", True),
            ("client_account", "Zbieraj punkty za każdą kupioną gałkę", False),
            ("client_spots", "Znajdź najbliższy lokal Loodly i dzisiejsze smaki", False),
            ("client_menu", "Zamów z dostawą lub odbierz w lokalu", False),
            ("client_rewards", "Wymieniaj punkty na nagrody — co dziesiąta porcja gratis", False),
            ("client_map", "Sprawdź zasięg dowozu i godziny otwarcia na mapie", False),
            ("client_account", "Pokaż kod QR przy kasie i zdobywaj punkty", False),
            ("client_menu", "Sprawdź skład, alergeny i wartości odżywcze", False),
        ],
    },
    "courier": {
        "en": [
            ("courier_queue", "Loodly Courier — deliver ice cream, earn more", True),
            ("courier_queue", "Claim orders near you with one tap", False),
            ("courier_delivery", "Turn-by-turn navigation to spot and customer", False),
            ("courier_delivery", "Confirm handover with the customer's delivery PIN", False),
            ("courier_earnings", "Track earnings and payouts every week", False),
            ("courier_earnings", "Build your rating with every delivery", False),
            ("courier_queue", "See distance, items and fee before you accept", False),
            ("courier_earnings", "Report an incident and we re-dispatch the order", False),
        ],
        "pl": [
            ("courier_queue", "Loodly Kurier — dowoź lody, zarabiaj więcej", True),
            ("courier_queue", "Przyjmuj zamówienia w okolicy jednym dotknięciem", False),
            ("courier_delivery", "Nawigacja do lokalu i do klienta krok po kroku", False),
            ("courier_delivery", "Potwierdź odbiór PIN-em dostawy od klienta", False),
            ("courier_earnings", "Śledź zarobki i wypłaty w każdym tygodniu", False),
            ("courier_earnings", "Buduj swoją ocenę z każdą dostawą", False),
            ("courier_queue", "Zobacz odległość, produkty i stawkę przed przyjęciem", False),
            ("courier_earnings", "Zgłoś zdarzenie — przekierujemy zamówienie", False),
        ],
    },
    "spot": {
        "en": [
            ("spot_queue", "Loodly Spot — run your ice cream shop", True),
            ("spot_queue", "One live queue for delivery and pickup orders", False),
            ("spot_queue", "Claim an order and mark it ready in one tap", False),
            ("spot_menu", "Toggle today's flavours in and out of the menu", False),
            ("spot_menu", "Set prices and loyalty points per item", False),
            ("spot_reports", "Track orders and revenue hour by hour", False),
            ("spot_reports", "Manage staff accounts and shifts", False),
            ("spot_reports", "Export daily reports for your accountant", False),
        ],
        "pl": [
            ("spot_queue", "Loodly Spot — prowadź swoją lodziarnię", True),
            ("spot_queue", "Jedna kolejka na zamówienia z dowozem i odbiorem", False),
            ("spot_queue", "Przyjmij zamówienie i oznacz gotowe jednym dotknięciem", False),
            ("spot_menu", "Włączaj i wyłączaj dzisiejsze smaki w menu", False),
            ("spot_menu", "Ustaw ceny i punkty lojalnościowe dla produktu", False),
            ("spot_reports", "Śledź zamówienia i przychód godzina po godzinie", False),
            ("spot_reports", "Zarządzaj kontami pracowników i zmianami", False),
            ("spot_reports", "Eksportuj dzienne raporty dla księgowej", False),
        ],
    },
}

APP_DIR = {"client": "loodly-client", "courier": "loodly-courier", "spot": "loodly-spot"}


def ensure(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


_CACHE: dict = {}


def shot(name: str, loc: str, *, tablet=False) -> Image.Image:
    """Render (and memoise) one app screen."""
    key = (name, loc, tablet)
    if key not in _CACHE:
        fn = getattr(screens, name)
        if tablet:
            _CACHE[key] = fn(loc, TABLET_W, TABLET_H)
        else:
            _CACHE[key] = fn(loc, PHONE_W, PHONE_H)
    return _CACHE[key]


def save(img: Image.Image, path: str) -> None:
    img.convert("RGB").save(path, "PNG", optimize=True)


def slug(name: str) -> str:
    return name.replace("_", "-")


def build_screenshots(app: str) -> None:
    base = os.path.join(ROOT, APP_DIR[app])
    for loc in ("en", "pl"):
        panels = COPY[app][loc]

        # ---- iOS phone (both required sizes) + Android phone
        for platform, targets, sub in (
            ("ios", IOS_PHONE, "phone"),
            ("android", AND_PHONE, "phone"),
        ):
            for tag, size in targets:
                out = ensure(os.path.join(base, platform, sub, tag, loc))
                for i, (fn, head, logo) in enumerate(panels, 1):
                    img = compose(size, shot(fn, loc), head, logo=logo)
                    save(img, os.path.join(out, f"{i:02d}-{slug(fn)}.png"))

        # ---- tablets
        for platform, targets in (("ios", IOS_TABLET), ("android", AND_TABLET)):
            for tag, size in targets:
                out = ensure(os.path.join(base, platform, "tablet", tag, loc))
                for i, (fn, head, logo) in enumerate(panels, 1):
                    img = compose(size, shot(fn, loc, tablet=True), head,
                                  tablet=True, logo=logo)
                    save(img, os.path.join(out, f"{i:02d}-{slug(fn)}.png"))

        # ---- Google Play feature graphic
        out = ensure(os.path.join(base, "android", "feature-graphic", loc))
        head, sub_ = _feature_copy(app, loc)
        save(feature_graphic((1024, 500), head, sub_, shot(panels[1][0], loc)),
             os.path.join(out, "feature-graphic-1024x500.png"))


def _feature_copy(app: str, loc: str):
    table = {
        ("client", "en"): ("Ice cream, delivered", "Collect points. Claim rewards."),
        ("client", "pl"): ("Lody z dostawą", "Zbieraj punkty. Odbieraj nagrody."),
        ("courier", "en"): ("Deliver with Loodly", "Flexible hours. Weekly payouts."),
        ("courier", "pl"): ("Dowoź z Loodly", "Elastyczne godziny. Wypłaty co tydzień."),
        ("spot", "en"): ("Run your spot", "Live order queue. Menu. Reports."),
        ("spot", "pl"): ("Prowadź lokal", "Kolejka zamówień. Menu. Raporty."),
    }
    return table[(app, loc)]


def build_icons(app: str) -> None:
    base = ensure(os.path.join(ROOT, APP_DIR[app], "icon"))
    # Apple: 1024x1024, no alpha, square (Apple applies the mask itself)
    save(icon_flat(1024), os.path.join(base, "ios-appstore-1024.png"))
    # Google Play: 512x512, alpha allowed
    app_icon(512).save(os.path.join(base, "play-store-512.png"), "PNG", optimize=True)
    # in-app / adaptive source
    app_icon(1024, transparent=True).save(
        os.path.join(base, "adaptive-foreground-1024.png"), "PNG", optimize=True)
    save(icon_flat(180), os.path.join(base, "ios-app-180.png"))


def build_brand() -> None:
    base = ensure(os.path.join(ROOT, "brand"))
    for h, name in ((320, "lockup-320"), (640, "lockup-640"), (1200, "lockup-1200")):
        wordmark(h).save(os.path.join(base, f"{name}.png"), "PNG", optimize=True)
    # single-line lockup for headers / email
    wordmark(200, stacked=False).save(os.path.join(base, "lockup-inline.png"),
                                      "PNG", optimize=True)
    app_icon(1024, transparent=True).save(os.path.join(base, "icon-1024.png"),
                                          "PNG", optimize=True)
    save(icon_flat(1024), os.path.join(base, "icon-1024-flat.png"))
    # palette swatch sheet
    _palette_sheet().save(os.path.join(base, "palette.png"), "PNG", optimize=True)


def _palette_sheet() -> Image.Image:
    from PIL import ImageDraw

    from brand import (CREAM, CRIMSON, ESPRESSO, INK, MANGO, MINT, RED,
                       RED_DARK, RED_LIGHT, SCARLET, SKY, f_bold, f_reg)
    swatches = [("Loodly Red", RED), ("Red Dark", RED_DARK),
                ("Red Light", RED_LIGHT), ("Scarlet", SCARLET),
                ("Crimson", CRIMSON), ("Cream", CREAM), ("Ink", INK),
                ("Espresso", ESPRESSO), ("Mango", MANGO), ("Mint", MINT),
                ("Sky", SKY)]
    cw, ch = 240, 300
    cols = 6
    rows = (len(swatches) + cols - 1) // cols
    img = Image.new("RGB", (cw * cols, ch * rows + 90), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((24, 40), "Loodly palette", font=f_bold(46), fill=INK, anchor="lm")
    for i, (name, col) in enumerate(swatches):
        x = (i % cols) * cw
        y = 90 + (i // cols) * ch
        d.rectangle([x + 16, y + 16, x + cw - 16, y + ch - 110], fill=col)
        d.text((x + 20, y + ch - 84), name, font=f_bold(26), fill=INK, anchor="lm")
        d.text((x + 20, y + ch - 48), "#%02X%02X%02X" % col, font=f_reg(24),
               fill=(110, 110, 118), anchor="lm")
    return img


def main() -> None:
    build_brand()
    print("brand/ done")
    for app in ("client", "courier", "spot"):
        build_icons(app)
        build_screenshots(app)
        print(f"{APP_DIR[app]}/ done")


if __name__ == "__main__":
    main()
