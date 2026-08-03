"""One function per mocked app screen, keyed by (app, screen, locale).

Copy lives in `L`, a nested dict keyed by locale, so EN and PL screenshots are
generated from the same drawing code.
"""
from __future__ import annotations

from PIL import Image, ImageDraw, ImageFilter

from brand import (
    CREAM, CREAM_SOFT, ESPRESSO, GREY, GREY_LIGHT, INK, MANGO, MINT, RED,
    RED_DARK, ROSE, ROSE_DEEP, ROSE_LIGHT, SKY, WHITE, app_icon, f_black,
    f_bold, f_reg, f_round,
)
from ui import (
    PHONE_H, PHONE_W, app_header, card, photo, pill, rounded_photo, segmented,
    shadow_card, status_bar, tab_bar,
)

# ------------------------------------------------------------------- copy ----
L = {
    "en": {
        "tabs": ["Start", "Flavours", "Order", "Rewards", "Map"],
        "ctabs": ["Queue", "Delivery", "Earnings", "Map", "More"],
        "stabs": ["Queue", "Menu", "Staff", "Reports", "More"],
        "news": "News", "account": "Account", "quests": "Quests",
        "balance": "Your balance", "points": "points",
        "redeem": "Redeem points", "qr": "Your QR code",
        "flavours": "Flavours", "flav_sub": "Ice cream spots in Warsaw",
        "see": "See flavours", "order": "Order", "order_now": "Order now",
        "my_orders": "My orders", "pick_spot": "Choose a spot to order from",
        "free_del": "Free delivery over 40 zł", "add": "Add",
        "sorbets": "Sorbets", "milk": "Milk based", "gelato": "Gelato",
        "rewards": "Rewards", "your_points": "Your points",
        "my_rewards": "My rewards", "avail": "Available rewards",
        "active": "Active", "valid": "Valid until 8/1/2026",
        "spots": "Spots", "open": "Open", "radius": "Delivery within 5 km",
        "kcal": "kcal", "pts": "pts",
        # courier
        "c_avail": "Available orders", "c_claim": "Claim", "c_active": "Active delivery",
        "c_pickup": "Pick up at", "c_dropoff": "Deliver to", "c_pin": "Delivery PIN",
        "c_nav": "Navigate", "c_done": "Mark delivered", "c_earn": "This week",
        "c_deliveries": "deliveries", "c_payout": "Payout", "c_rating": "Rating",
        "c_incident": "Report incident", "c_dist": "away",
        # spot
        "s_queue": "Order queue", "s_new": "New", "s_prep": "In preparation",
        "s_ready": "Ready", "s_claim": "Claim order", "s_ready_btn": "Mark ready",
        "s_menu": "Menu editor", "s_avail": "Available today",
        "s_staff": "Staff", "s_shift": "On shift", "s_today": "Today",
        "s_orders": "orders", "s_revenue": "Revenue", "s_reports": "Reports",
    },
    "pl": {
        "tabs": ["Start", "Smaki", "Zamówienie", "Nagrody", "Punkty"],
        "ctabs": ["Kolejka", "Dostawa", "Zarobki", "Mapa", "Więcej"],
        "stabs": ["Kolejka", "Menu", "Zespół", "Raporty", "Więcej"],
        "news": "Aktualności", "account": "Konto", "quests": "Zadania",
        "balance": "Twoje saldo", "points": "punktów",
        "redeem": "Wymień punkty", "qr": "Twój kod QR",
        "flavours": "Smaki", "flav_sub": "Lodziarnie w mieście Warszawa",
        "see": "Zobacz smaki", "order": "Zamówienie", "order_now": "Zamów teraz",
        "my_orders": "Moje zamówienia", "pick_spot": "Wybierz lokal do zamówienia",
        "free_del": "Darmowy dowóz od 40 zł", "add": "Dodaj",
        "sorbets": "Sorbety", "milk": "Na bazie mleka", "gelato": "Gelato",
        "rewards": "Nagrody", "your_points": "Twoje punkty",
        "my_rewards": "Moje nagrody", "avail": "Dostępne nagrody",
        "active": "Aktywna", "valid": "Ważne do 1.08.2026",
        "spots": "Lokale", "open": "Otwarte", "radius": "Dowóz w promieniu 5 km",
        "kcal": "kcal", "pts": "pkt",
        "c_avail": "Dostępne zamówienia", "c_claim": "Przyjmij",
        "c_active": "Aktywna dostawa", "c_pickup": "Odbiór w",
        "c_dropoff": "Dostawa do", "c_pin": "PIN dostawy",
        "c_nav": "Nawiguj", "c_done": "Oznacz dostarczone", "c_earn": "Ten tydzień",
        "c_deliveries": "dostaw", "c_payout": "Wypłata", "c_rating": "Ocena",
        "c_incident": "Zgłoś zdarzenie", "c_dist": "od Ciebie",
        "s_queue": "Kolejka zamówień", "s_new": "Nowe",
        "s_prep": "W przygotowaniu", "s_ready": "Gotowe",
        "s_claim": "Przyjmij", "s_ready_btn": "Oznacz gotowe",
        "s_menu": "Edytor menu", "s_avail": "Dostępne dzisiaj",
        "s_staff": "Zespół", "s_shift": "Na zmianie", "s_today": "Dzisiaj",
        "s_orders": "zamówień", "s_revenue": "Przychód", "s_reports": "Raporty",
    },
}

FLAVOURS = [
    ("Mango Sorbet", "Tropical vegan", "12 zł", 110, 1),
    ("Strawberry Sorbet", "Vegan, dairy-free", "12 zł", 120, 0),
    ("Dark Chocolate", "70% cocoa", "13 zł", 230, 4),
    ("Vanilla Bean", "Milk-based classic", "13 zł", 220, 1),
    ("Pistachio Gelato", "Sicilian style", "14 zł", 240, 2),
]

SPOTS = [
    ("Loodly Amber Mokotów", "ul. Puławska 120, 02-620 Warszawa", 2),
    ("Loodly Espresso Warsaw Center", "ul. Nowy Świat 15, 00-029 Warszawa", 3),
]


def _blank(w=PHONE_W, h=PHONE_H, bg=WHITE):
    img = Image.new("RGBA", (w, h), bg + (255,))
    return img, ImageDraw.Draw(img)


# ------------------------------------------------------- client: 1 account ----
def client_account(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h)
    status_bar(d, w)
    app_header(img, w, "loodly")
    d = ImageDraw.Draw(img)
    segmented(d, w, 330, [t["news"], t["account"], t["quests"]], 1)

    # points card, gold-outlined like the real screen
    box = [56, 430, w - 56, 990]
    shadow_card(img, box, radius=34, fill=(250, 250, 251))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=34, outline=MANGO, width=5)
    d.text((104, 500), t["balance"], font=f_reg(38), fill=(150, 110, 60), anchor="lm")
    d.text((104, 610), "334", font=f_black(150), fill=ESPRESSO, anchor="lm")
    d.text((104, 730), t["points"], font=f_reg(40), fill=(150, 110, 60), anchor="lm")
    btn = [104, 800, w - 104, 950]
    d.rounded_rectangle(btn, radius=22, fill=WHITE, outline=MANGO, width=5)
    d.text((w / 2, 875), t["redeem"], font=f_bold(46), fill=RED, anchor="mm")

    # QR card
    qbox = [56, 1040, w - 56, 2100]
    shadow_card(img, qbox, radius=34, fill=WHITE)
    d = ImageDraw.Draw(img)
    d.text((104, 1120), t["qr"], font=f_bold(46), fill=INK, anchor="lm")
    d.ellipse([w - 190, 1085, w - 110, 1165], fill=(255, 244, 205))
    _sun(d, w - 150, 1125, 15, MANGO)
    side = w - 220
    qr = [110, 1210, 110 + side, 1210 + side]
    d.rounded_rectangle(qr, radius=16, fill=WHITE, outline=RED, width=6)
    _qr(d, [qr[0] + 46, qr[1] + 46, qr[2] - 46, qr[3] - 46])
    d.text((w / 2, qr[3] + 76), "8245 · 9143 · 7806", font=f_bold(40),
           fill=GREY, anchor="mm")

    tab_bar(img, w, h, 0, t["tabs"])
    return img


def _qr(d, box, n=25):
    """Deterministic pseudo-QR block pattern (never scanned; visual only)."""
    x0, y0, x1, y1 = box
    # square cells, centred: the card is taller than it is wide
    cell = min(x1 - x0, y1 - y0) / n
    x0 += ((x1 - x0) - cell * n) / 2
    y0 += ((y1 - y0) - cell * n) / 2
    state = 0x2F6E1
    for r in range(n):
        for c in range(n):
            state = (state * 1103515245 + 12345) & 0x7FFFFFFF
            if (state >> 16) & 1:
                d.rectangle([x0 + c * cell, y0 + r * cell,
                             x0 + (c + 1) * cell - 1, y0 + (r + 1) * cell - 1], fill=INK)
    # finder patterns
    for (fr, fc) in [(0, 0), (0, n - 7), (n - 7, 0)]:
        bx = [x0 + fc * cell, y0 + fr * cell, x0 + (fc + 7) * cell, y0 + (fr + 7) * cell]
        d.rectangle(bx, fill=WHITE)
        d.rectangle(bx, outline=INK, width=int(cell))
        d.rectangle([bx[0] + 2 * cell, bx[1] + 2 * cell,
                     bx[2] - 2 * cell, bx[3] - 2 * cell], fill=INK)


# ------------------------------------------------------- client: 2 spots -----
def client_spots(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h)
    status_bar(d, w)
    d.text((60, 260), t["flavours"], font=f_black(76), fill=INK, anchor="lm")
    d.text((60, 340), t["flav_sub"], font=f_reg(38), fill=GREY, anchor="lm")
    d.line([(0, 400), (w, 400)], fill=GREY_LIGHT, width=3)

    y = 450
    for i, (name, addr, seed) in enumerate(SPOTS):
        box = [60, y, w - 60, y + 790]
        shadow_card(img, box, radius=30, fill=WHITE)
        rounded_photo(img, [box[0], box[1], box[2], box[1] + 400], seed=seed, radius=30)
        d = ImageDraw.Draw(img)
        d.rectangle([box[0], box[1] + 370, box[2], box[1] + 400], fill=WHITE)
        d.text((box[0] + 40, box[1] + 470), name, font=f_bold(48), fill=INK, anchor="lm")
        addr_line(d, box[0] + 40, box[1] + 545, addr, f_reg(34))
        pill(d, [box[0] + 40, box[1] + 620, box[0] + 400, box[1] + 720],
             t["see"], f_bold(40), fill=RED)
        y += 830

    tab_bar(img, w, h, 1, t["tabs"])
    return img


# ------------------------------------------------------- client: 3 menu ------
def client_menu(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h)
    status_bar(d, w)
    d.text((60, 250), t["order"], font=f_black(76), fill=INK, anchor="lm")
    segmented(d, w, 370, [t["order_now"], t["my_orders"]], 0)
    d.text((60, 500), SPOTS[1][0], font=f_bold(52), fill=INK, anchor="lm")
    d.text((60, 565), t["radius"], font=f_reg(34), fill=GREY, anchor="lm")

    groups = [(t["sorbets"], FLAVOURS[0:2]), (t["milk"], FLAVOURS[2:4]),
              (t["gelato"], FLAVOURS[4:5])]
    y = 650
    for title, items in groups:
        d.text((60, y + 30), title, font=f_bold(46), fill=INK, anchor="lm")
        y += 90
        for name, sub, price, _kcal, seed in items:
            box = [60, y, w - 60, y + 190]
            card(d, box, radius=22, fill=WHITE, border=GREY_LIGHT, bw=3)
            rounded_photo(img, [box[0] + 4, box[1] + 4, box[0] + 190, box[3] - 4],
                          seed=seed, radius=18)
            d = ImageDraw.Draw(img)
            d.text((box[0] + 226, y + 62), name, font=f_bold(42), fill=INK, anchor="lm")
            d.text((box[0] + 226, y + 116), sub, font=f_reg(32), fill=GREY, anchor="lm")
            d.text((box[0] + 226, y + 160), price, font=f_bold(36), fill=RED, anchor="lm")
            pill(d, [box[2] - 250, y + 45, box[2] - 30, y + 145],
                 t["add"], f_bold(38), fill=RED)
            y += 215
        y += 30

    tab_bar(img, w, h, 2, t["tabs"])
    return img


# ------------------------------------------------------ client: 4 rewards ----
def client_rewards(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h)
    status_bar(d, w)
    d.text((60, 250), t["rewards"], font=f_black(76), fill=INK, anchor="lm")

    box = [60, 330, w - 60, 520]
    d.rounded_rectangle(box, radius=24, fill=RED)
    _star(d, 145, 425, 46, WHITE)
    d.text((225, 390), t["your_points"], font=f_reg(34), fill=(255, 210, 210), anchor="lm")
    d.text((225, 455), "334 " + t["pts"], font=f_black(58), fill=WHITE, anchor="lm")

    d.text((60, 610), t["my_rewards"], font=f_bold(46), fill=INK, anchor="lm")
    rb = [60, 660, w - 60, 830]
    card(d, rb, radius=22, fill=WHITE, border=ROSE_LIGHT, bw=3)
    rounded_photo(img, [rb[0] + 4, rb[1] + 4, rb[0] + 170, rb[3] - 4], seed=1, radius=18)
    d = ImageDraw.Draw(img)
    d.text((rb[0] + 206, rb[1] + 62), "Free Ice Cream", font=f_bold(42), fill=INK, anchor="lm")
    d.text((rb[0] + 206, rb[1] + 118), t["valid"], font=f_reg(32), fill=GREY, anchor="lm")
    pill(d, [rb[2] - 250, rb[1] + 50, rb[2] - 30, rb[1] + 120], t["active"],
         f_bold(32), fill=(226, 246, 230), fg=(38, 130, 60))

    d.text((60, 910), t["avail"], font=f_bold(46), fill=INK, anchor="lm")
    grid = [("Free Delivery", "200 " + t["pts"], 5, True),
            ("Free Coffee", "300 " + t["pts"], 4, True),
            ("Free Portion", "500 " + t["pts"], 1, False),
            ("50% Off", "800 " + t["pts"], 3, False)]
    gy = 970
    for i, (name, cost, seed, on) in enumerate(grid):
        col = i % 2
        row = i // 2
        bx = 60 + col * ((w - 120) / 2 + 20)
        by = gy + row * 480
        box = [bx, by, bx + (w - 140) / 2, by + 440]
        shadow_card(img, box, radius=24, fill=WHITE)
        rounded_photo(img, [box[0], box[1], box[2], box[1] + 250], seed=seed, radius=24)
        d = ImageDraw.Draw(img)
        d.rectangle([box[0], box[1] + 220, box[2], box[1] + 250], fill=WHITE)
        d.text((box[0] + 28, box[1] + 305), name, font=f_bold(38), fill=INK, anchor="lm")
        pill(d, [box[0] + 24, box[1] + 350, box[0] + 250, box[1] + 420], cost,
             f_bold(32), fill=(255, 235, 238) if on else (240, 240, 242),
             fg=RED if on else GREY)

    tab_bar(img, w, h, 3, t["tabs"])
    return img


def _pin(d, cx, cy, r, col):
    """Small map-pin marker — drawn, since Arial has no U+1F4CD."""
    d.ellipse([cx - r, cy - r * 1.25, cx + r, cy + r * 0.45], fill=col)
    d.polygon([(cx - r * 0.5, cy + r * 0.2), (cx + r * 0.5, cy + r * 0.2),
               (cx, cy + r * 1.3)], fill=col)
    d.ellipse([cx - r * 0.34, cy - r * 0.75, cx + r * 0.34, cy - r * 0.07], fill=WHITE)


def addr_line(d, x, y, text, fnt, *, col=GREY, pin_col=RED):
    """`pin + address` row used on spot cards."""
    r = fnt.size * 0.34
    _pin(d, x + r, y - 2, r, pin_col)
    d.text((x + r * 2.8, y), text, font=fnt, fill=col, anchor="lm")


def _sun(d, cx, cy, r, col):
    """Brightness-toggle glyph — drawn, since Arial has no U+2600."""
    import math
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    for i in range(8):
        a = i * math.pi / 4
        d.line([(cx + math.cos(a) * r * 1.5, cy + math.sin(a) * r * 1.5),
                (cx + math.cos(a) * r * 2.1, cy + math.sin(a) * r * 2.1)],
               fill=col, width=max(2, int(r * 0.28)))


def _heart(d, cx, cy, r, col, *, fill=False):
    """Outlined heart — replaces the U+2661 glyph Arial cannot render."""
    lobes = [(cx - r * 0.5, cy - r * 0.42), (cx + r * 0.5, cy - r * 0.42)]
    body = [(cx - r, cy - r * 0.15), (cx + r, cy - r * 0.15), (cx, cy + r)]
    if fill:
        for lx, ly in lobes:
            d.ellipse([lx - r * 0.56, ly - r * 0.56, lx + r * 0.56, ly + r * 0.56], fill=col)
        d.polygon(body, fill=col)
        return
    lw = max(3, int(r * 0.22))
    for lx, ly in lobes:
        d.arc([lx - r * 0.56, ly - r * 0.56, lx + r * 0.56, ly + r * 0.56],
              180, 360, fill=col, width=lw)
    d.line([(cx - r * 1.06, cy - r * 0.34), (cx, cy + r)], fill=col, width=lw)
    d.line([(cx + r * 1.06, cy - r * 0.34), (cx, cy + r)], fill=col, width=lw)


def _bubble(d, cx, cy, r, col):
    """Speech-bubble glyph for the comment action."""
    lw = max(3, int(r * 0.2))
    d.rounded_rectangle([cx - r, cy - r * 0.8, cx + r, cy + r * 0.5],
                        radius=int(r * 0.35), outline=col, width=lw)
    d.polygon([(cx - r * 0.45, cy + r * 0.45), (cx - r * 0.1, cy + r * 0.45),
               (cx - r * 0.5, cy + r)], fill=col)


def _star(d, cx, cy, r, col):
    import math
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=col)


# ---------------------------------------------------------- client: 5 map ----
def client_map(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img = Image.new("RGBA", (w, h), (232, 240, 226, 255))
    d = ImageDraw.Draw(img)
    # map: parks, water, road network
    for (bx, by, bw2, bh2, col) in [
        (0, 300, w, 600, (214, 234, 206)), (0, 1500, w * 0.6, 500, (214, 234, 206)),
        (w * 0.62, 900, w * 0.38, 420, (206, 226, 240)),
    ]:
        d.rounded_rectangle([bx, by, bx + bw2, by + bh2], radius=60, fill=col)
    for i in range(9):
        y = 180 + i * 260
        d.line([(0, y + (i % 3) * 30), (w, y - (i % 2) * 40)], fill=(226, 226, 226), width=16)
    for i in range(6):
        x = 90 + i * 210
        d.line([(x, 100), (x + (i % 3) * 40, h)], fill=(226, 226, 226), width=14)
    d.line([(0, 760), (w, 700)], fill=(250, 226, 170), width=26)
    d.line([(520, 100), (610, h)], fill=(250, 226, 170), width=22)

    # delivery radius
    d.ellipse([w * 0.5 - 470, 900, w * 0.5 + 470, 1840],
              fill=(255, 226, 226, 90), outline=(236, 90, 90), width=6)
    status_bar(d, w)
    pill(d, [56, 190, 330, 300], t["spots"], f_bold(44), fill=WHITE, fg=INK)

    # pin
    px, py = w * 0.5, 1360
    d.ellipse([px - 56, py - 56, px + 56, py + 56], fill=RED, outline=WHITE, width=8)
    d.polygon([(px - 26, py + 40), (px + 26, py + 40), (px, py + 96)], fill=RED)
    d.ellipse([px - 14, py - 26, px + 14, py + 2], fill=WHITE)
    d.rectangle([px - 7, py - 4, px + 7, py + 26], fill=WHITE)

    # bottom spot carousel
    box = [56, h - 620, w - 200, h - 240]
    shadow_card(img, box, radius=28, fill=WHITE)
    rounded_photo(img, [box[0], box[1], box[2], box[1] + 250], seed=2, radius=28)
    d = ImageDraw.Draw(img)
    d.rectangle([box[0], box[1] + 220, box[2], box[1] + 250], fill=WHITE)
    pill(d, [box[0] + 24, box[1] + 24, box[0] + 250, box[1] + 96], t["open"],
         f_bold(34), fill=(56, 172, 84))
    d.ellipse([box[2] - 110, box[1] + 24, box[2] - 24, box[1] + 110], fill=WHITE)
    _heart(d, box[2] - 67, box[1] + 68, 22, INK)
    d.text((box[0] + 30, box[1] + 305), SPOTS[0][0], font=f_bold(44), fill=INK, anchor="lm")
    addr_line(d, box[0] + 30, box[1] + 360, SPOTS[0][1], f_reg(30))
    # peek of next card
    nb = [w - 170, h - 620, w + 200, h - 240]
    shadow_card(img, nb, radius=28, fill=WHITE)
    rounded_photo(img, [nb[0], nb[1], nb[2], nb[1] + 250], seed=3, radius=28)

    tab_bar(img, w, h, 4, t["tabs"])
    return img


# --------------------------------------------------------- client: 6 news ----
def client_news(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h)
    status_bar(d, w)
    app_header(img, w, "loodly")
    d = ImageDraw.Draw(img)
    segmented(d, w, 330, [t["news"], t["account"], t["quests"]], 0)

    photo(img, [0, 420, w, 1420], seed=0)
    d = ImageDraw.Draw(img)
    _heart(d, 90, 1500, 30, INK)
    _bubble(d, 200, 1498, 30, INK)
    d.text((60, 1600), "2 " + ("polubień" if loc == "pl" else "likes"),
           font=f_bold(44), fill=INK, anchor="lm")
    d.text((60, 1690), "New Summer Flavors!", font=f_black(50), fill=INK, anchor="lm")
    body = ("Spróbuj nowych sezonowych smaków: Sorbet Arbuzowy\ni Gelato Cytrynowo-Bazyliowe!"
            if loc == "pl" else
            "Try our new seasonal summer tastes: Watermelon\nSorbet and Lemon Basil Gelato!")
    d.multiline_text((60, 1770), body, font=f_reg(40), fill=(70, 74, 84), spacing=18)
    d.text((60, 1930), ("Zobacz wszystkie komentarze (2)" if loc == "pl"
                        else "View all comments (2)"), font=f_reg(36), fill=GREY, anchor="lm")

    tab_bar(img, w, h, 0, t["tabs"])
    return img


# ================================================================ COURIER ====
def courier_queue(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h, CREAM_SOFT)
    status_bar(d, w)
    app_header(img, w, "loodly", bell=2)
    d = ImageDraw.Draw(img)
    d.text((60, 330), t["c_avail"], font=f_black(64), fill=INK, anchor="lm")

    rows = [(SPOTS[0][0], "1.2 km", "18 zł", "3 × Gelato"),
            (SPOTS[1][0], "2.6 km", "24 zł", "2 × Sorbet, 1 × Coffee"),
            (SPOTS[0][0], "3.4 km", "21 zł", "4 × Vanilla Bean")]
    y = 430
    for name, dist, fee, items in rows:
        box = [56, y, w - 56, y + 330]
        shadow_card(img, box, radius=28, fill=WHITE)
        d = ImageDraw.Draw(img)
        d.text((box[0] + 36, y + 70), name, font=f_bold(44), fill=INK, anchor="lm")
        d.text((box[0] + 36, y + 136), items, font=f_reg(34), fill=GREY, anchor="lm")
        addr_line(d, box[0] + 36, y + 196, f"{dist} {t['c_dist']}", f_reg(32))
        d.text((box[2] - 36, y + 70), fee, font=f_black(52), fill=(38, 130, 60), anchor="rm")
        pill(d, [box[2] - 320, y + 220, box[2] - 36, y + 300], t["c_claim"],
             f_bold(42), fill=RED)
        y += 360

    tab_bar(img, w, h, 0, t["ctabs"])
    return img


def courier_delivery(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img = Image.new("RGBA", (w, h), (232, 240, 226, 255))
    d = ImageDraw.Draw(img)
    for i in range(9):
        d.line([(0, 200 + i * 250), (w, 160 + i * 250)], fill=(226, 226, 226), width=16)
    for i in range(6):
        d.line([(80 + i * 220, 100), (120 + i * 220, h)], fill=(226, 226, 226), width=14)
    d.rounded_rectangle([0, 1300, w * 0.55, 1750], radius=60, fill=(214, 234, 206))
    # route
    route = [(200, 1500), (400, 1180), (700, 1050), (860, 720), (620, 480)]
    d.line(route, fill=(40, 110, 230), width=22, joint="curve")
    d.ellipse([180, 1480, 220, 1520], fill=WHITE, outline=(40, 110, 230), width=10)
    px, py = route[-1]
    d.ellipse([px - 44, py - 44, px + 44, py + 44], fill=RED, outline=WHITE, width=8)
    d.polygon([(px - 20, py + 32), (px + 20, py + 32), (px, py + 78)], fill=RED)
    status_bar(d, w)

    box = [40, h - 900, w - 40, h - 60]
    shadow_card(img, box, radius=40, fill=WHITE, blur=30, alpha=54)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([w / 2 - 70, box[1] + 26, w / 2 + 70, box[1] + 38],
                        radius=6, fill=GREY_LIGHT)
    d.text((box[0] + 44, box[1] + 110), t["c_active"], font=f_bold(40), fill=RED, anchor="lm")
    d.text((box[0] + 44, box[1] + 190), t["c_pickup"], font=f_reg(32), fill=GREY, anchor="lm")
    d.text((box[0] + 44, box[1] + 250), SPOTS[1][0], font=f_bold(44), fill=INK, anchor="lm")
    d.text((box[0] + 44, box[1] + 330), t["c_dropoff"], font=f_reg(32), fill=GREY, anchor="lm")
    d.text((box[0] + 44, box[1] + 390), "ul. Marszałkowska 84/92",
           font=f_bold(44), fill=INK, anchor="lm")

    pinbox = [box[0] + 44, box[1] + 450, box[2] - 44, box[1] + 610]
    d.rounded_rectangle(pinbox, radius=22, fill=(255, 244, 232), outline=MANGO, width=4)
    d.text((pinbox[0] + 30, pinbox[1] + 50), t["c_pin"], font=f_reg(32),
           fill=(150, 110, 60), anchor="lm")
    d.text((pinbox[0] + 30, pinbox[1] + 112), "4 7 2 9", font=f_black(64),
           fill=ESPRESSO, anchor="lm")

    pill(d, [box[0] + 44, box[1] + 650, w / 2 - 10, box[1] + 770], t["c_nav"],
         f_bold(42), fill=INK)
    pill(d, [w / 2 + 10, box[1] + 650, box[2] - 44, box[1] + 770], t["c_done"],
         f_bold(38), fill=(38, 150, 70))
    return img


def courier_earnings(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h, CREAM_SOFT)
    status_bar(d, w)
    d.text((60, 260), t["c_earn"], font=f_black(76), fill=INK, anchor="lm")

    box = [56, 350, w - 56, 700]
    d.rounded_rectangle(box, radius=34, fill=RED)
    d.text((box[0] + 44, box[1] + 80), t["c_payout"], font=f_reg(38),
           fill=(255, 208, 208), anchor="lm")
    d.text((box[0] + 44, box[1] + 190), "1 248 zł", font=f_black(130),
           fill=WHITE, anchor="lm")
    d.text((box[2] - 44, box[1] + 260), "42 " + t["c_deliveries"], font=f_bold(38),
           fill=(255, 208, 208), anchor="rm")

    # weekly bar chart
    cbox = [56, 760, w - 56, 1400]
    shadow_card(img, cbox, radius=30, fill=WHITE)
    d = ImageDraw.Draw(img)
    days = (["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"] if loc == "pl"
            else ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    vals = [0.42, 0.58, 0.35, 0.71, 0.88, 1.0, 0.66]
    base = cbox[3] - 130
    top = cbox[1] + 90
    slot = (cbox[2] - cbox[0] - 100) / 7
    for i, (day, v) in enumerate(zip(days, vals)):
        bx = cbox[0] + 50 + slot * (i + 0.5)
        bh = (base - top) * v
        col = RED if v == 1.0 else ROSE
        d.rounded_rectangle([bx - slot * 0.3, base - bh, bx + slot * 0.3, base],
                            radius=14, fill=col)
        d.text((bx, base + 50), day, font=f_reg(32), fill=GREY, anchor="mm")

    # rating
    rbox = [56, 1460, w - 56, 1740]
    shadow_card(img, rbox, radius=30, fill=WHITE)
    d = ImageDraw.Draw(img)
    d.text((rbox[0] + 44, rbox[1] + 80), t["c_rating"], font=f_reg(38), fill=GREY, anchor="lm")
    d.text((rbox[0] + 44, rbox[1] + 170), "4,9", font=f_black(88), fill=INK, anchor="lm")
    for i in range(5):
        _star(d, rbox[0] + 260 + i * 90, rbox[1] + 165, 36, MANGO)

    pill(d, [56, 1810, w - 56, 1950], t["c_incident"], f_bold(44),
         fill=WHITE, fg=RED)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([56, 1810, w - 56, 1950], radius=70, outline=RED, width=5)
    d.text((w / 2, 1880), t["c_incident"], font=f_bold(44), fill=RED, anchor="mm")

    tab_bar(img, w, h, 2, t["ctabs"])
    return img


# =================================================================== SPOT ====
def spot_queue(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h, CREAM_SOFT)
    status_bar(d, w)
    app_header(img, w, "loodly", bell=3)
    d = ImageDraw.Draw(img)
    d.text((60, 330), t["s_queue"], font=f_black(64), fill=INK, anchor="lm")

    dlv = "Dowóz" if loc == "pl" else "Delivery"
    pick = "Odbiór" if loc == "pl" else "Pickup"
    rows = [
        (t["s_new"], "#1042", "Anna K.", "2 × Mango Sorbet", RED, t["s_claim"], dlv),
        (t["s_prep"], "#1041", "Marek W.", "1 × Dark Chocolate, 1 × Coffee", MANGO,
         t["s_ready_btn"], pick),
        (t["s_ready"], "#1039", "Julia S.", "3 × Vanilla Bean", MINT, None, dlv),
        (t["s_new"], "#1043", "Piotr N.", "1 × Pistachio Gelato", RED, t["s_claim"], pick),
        (t["s_prep"], "#1040", "Ewa T.", "2 × Strawberry Sorbet", MANGO,
         t["s_ready_btn"], dlv),
    ]
    y = 430
    for status, num, who, items, col, action, kind in rows:
        box = [56, y, w - 56, y + 330]
        shadow_card(img, box, radius=28, fill=WHITE)
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([box[0], box[1], box[0] + 14, box[3]], radius=7, fill=col)
        pill(d, [box[0] + 40, y + 34, box[0] + 340, y + 110], status, f_bold(34),
             fill=col, pad=18)
        d.text((box[2] - 36, y + 72), num, font=f_bold(40), fill=GREY, anchor="rm")
        d.text((box[0] + 40, y + 170), who, font=f_bold(46), fill=INK, anchor="lm")
        d.text((box[0] + 40, y + 232), items, font=f_reg(32), fill=GREY, anchor="lm")
        pill(d, [box[0] + 40, y + 262, box[0] + 250, y + 316], kind, f_bold(28),
             fill=(243, 240, 246), fg=ESPRESSO, pad=14)
        if action:
            pill(d, [box[2] - 400, y + 252, box[2] - 36, y + 320], action,
                 f_bold(36), fill=INK, pad=18)
        y += 356

    tab_bar(img, w, h, 0, t["stabs"])
    return img


def spot_menu(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h, CREAM_SOFT)
    status_bar(d, w)
    d.text((60, 260), t["s_menu"], font=f_black(70), fill=INK, anchor="lm")
    d.text((60, 340), t["s_avail"], font=f_reg(38), fill=GREY, anchor="lm")

    y = 430
    for i, (name, sub, price, kcal, seed) in enumerate(FLAVOURS):
        on = i != 2
        box = [56, y, w - 56, y + 230]
        shadow_card(img, box, radius=26, fill=WHITE)
        rounded_photo(img, [box[0] + 6, box[1] + 6, box[0] + 224, box[3] - 6],
                      seed=seed, radius=20)
        d = ImageDraw.Draw(img)
        d.text((box[0] + 262, y + 72), name, font=f_bold(44), fill=INK, anchor="lm")
        d.text((box[0] + 262, y + 130), f"{sub} · {kcal} {t['kcal']}",
               font=f_reg(32), fill=GREY, anchor="lm")
        d.text((box[0] + 262, y + 184), f"{price}  ·  +50 {t['pts']}",
               font=f_bold(34), fill=RED, anchor="lm")
        # availability toggle
        tb = [box[2] - 160, y + 80, box[2] - 40, y + 150]
        d.rounded_rectangle(tb, radius=35, fill=(56, 172, 84) if on else GREY_LIGHT)
        kx = tb[2] - 35 if on else tb[0] + 35
        d.ellipse([kx - 28, y + 87, kx + 28, y + 143], fill=WHITE)
        y += 260

    tab_bar(img, w, h, 1, t["stabs"])
    return img


def spot_reports(loc, w=PHONE_W, h=PHONE_H):
    t = L[loc]
    img, d = _blank(w, h, CREAM_SOFT)
    status_bar(d, w)
    d.text((60, 260), t["s_reports"], font=f_black(76), fill=INK, anchor="lm")

    # two KPI tiles
    for i, (label, val, col) in enumerate([
        (t["s_today"] + " · " + t["s_orders"], "38", INK),
        (t["s_revenue"], "1 640 zł", (38, 130, 60)),
    ]):
        bx = 56 + i * ((w - 112) / 2 + 20)
        box = [bx, 360, bx + (w - 132) / 2, 620]
        shadow_card(img, box, radius=28, fill=WHITE)
        d = ImageDraw.Draw(img)
        d.text((box[0] + 34, box[1] + 70), label, font=f_reg(32), fill=GREY, anchor="lm")
        d.text((box[0] + 34, box[1] + 170), val, font=f_black(72), fill=col, anchor="lm")

    # hourly line chart
    cbox = [56, 680, w - 56, 1320]
    shadow_card(img, cbox, radius=30, fill=WHITE)
    d = ImageDraw.Draw(img)
    vals = [0.15, 0.22, 0.35, 0.30, 0.52, 0.68, 0.85, 1.0, 0.78, 0.55, 0.34, 0.20]
    base, top = cbox[3] - 120, cbox[1] + 90
    pts = []
    for i, v in enumerate(vals):
        x = cbox[0] + 60 + (cbox[2] - cbox[0] - 120) * i / (len(vals) - 1)
        pts.append((x, base - (base - top) * v))
    d.polygon(pts + [(pts[-1][0], base), (pts[0][0], base)], fill=(255, 232, 236))
    d.line(pts, fill=RED, width=10, joint="curve")
    for x, yy in pts:
        d.ellipse([x - 11, yy - 11, x + 11, yy + 11], fill=WHITE, outline=RED, width=6)
    for i, lab in enumerate(["10", "12", "14", "16", "18", "20"]):
        x = cbox[0] + 60 + (cbox[2] - cbox[0] - 120) * (i * 2.2) / (len(vals) - 1)
        d.text((x, base + 50), lab, font=f_reg(30), fill=GREY, anchor="mm")

    # staff on shift
    sbox = [56, 1380, w - 56, 1900]
    shadow_card(img, sbox, radius=30, fill=WHITE)
    d = ImageDraw.Draw(img)
    d.text((sbox[0] + 40, sbox[1] + 70), t["s_shift"], font=f_bold(46), fill=INK, anchor="lm")
    for i, (nm, hrs) in enumerate([("Anna K.", "08:00 – 16:00"),
                                   ("Marek W.", "10:00 – 18:00"),
                                   ("Julia S.", "12:00 – 20:00")]):
        yy = sbox[1] + 170 + i * 110
        d.ellipse([sbox[0] + 40, yy - 42, sbox[0] + 124, yy + 42], fill=ROSE_LIGHT)
        d.text((sbox[0] + 82, yy), nm[0], font=f_black(44), fill=WHITE, anchor="mm")
        d.text((sbox[0] + 156, yy), nm, font=f_bold(40), fill=INK, anchor="lm")
        d.text((sbox[2] - 40, yy), hrs, font=f_reg(34), fill=GREY, anchor="rm")

    tab_bar(img, w, h, 3, t["stabs"])
    return img


CLIENT = [client_account, client_spots, client_menu, client_rewards,
          client_map, client_news]
COURIER = [courier_queue, courier_delivery, courier_earnings]
SPOT = [spot_queue, spot_menu, spot_reports]
