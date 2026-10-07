# Loodly: final brief for the multi-category landing and the `/for-business` pitch

Creative director's merge of Direction A (warm storytelling) and Direction B (business value), dated 2026-10-06.

- **Workspace:** `landing-page-new` in the `feature/brands` worktree.
- **Readers:** the landing builder, the pitch builder and the animation builder. Each one owns the files listed in §6.1.
- **Source of truth:** where this brief and the two source briefs disagree, this brief wins.
- **Verification:** every product claim below was checked against the code, or against `BRANDS_SPEC.md` A1–A5, §1.4, §2.7, §3, §4.8 and §7.6. The main corrections are listed in §0.3.

---

## 0. Guardrails and verified facts

### 0.1 Hard rules

- **No made-up numbers.** No fabricated statistics, testimonials, client logos or vendor names, and no outcome promises such as "+30% visits" or "faster service".
- **Allowed example values.** Mock UI values (for example a points balance in a phone mock-up) are fine only inside a visibly captioned "Example app screen". Time-of-day kickers in the story ("7:30") are a storytelling device, not data.
- **Receipts and invoices.** Never name a receipt, invoice or POS vendor. Payment methods (card, BLIK, Apple Pay, Google Pay) may be named, because the code supports them (`mobile/app/order/payment.tsx`, `app/components/checkout/StripePayment.tsx`). Do not name the payment provider.
- **A4 wording in customer copy (landing `/`, spots pages).**
  - Never use a generic noun as a stand-in for a brand: no "marka", "brand", "бренд", "place", or "lodziarnia" used to mean "the business where you collect points".
  - A single location is "lokal" / "location" / "заклад".
  - The generic line is "Jedna karta wszędzie" / "One card everywhere" / "Одна картка всюди".
  - Per-brand points are explained neutrally: "pod tą samą nazwą" / "under the same name" / "під тією самою назвою", or "każde logo ma swoje saldo" ("every logo has its own balance").
  - Category nouns are allowed only as a list of kinds of business (hero, categories strip, SEO, and the owner-facing teaser).
- **B2B copy (`/for-business`).** This page is business-facing, so "marka" / "brand" / "бренд" are allowed there, as in the console (spec §3.4).
- **Runtime assets.** No external network assets at runtime. Everything ships in the static export (`output: 'export'`). The only runtime calls are the existing API and Google Maps.
- **Reduced motion.** Respect `prefers-reduced-motion`. Lottie shows its poster frame, CSS float animations stop, and smooth scroll is off.
- **Files and keys nobody touches:**
  - `app/account`, `app/components/account`, `app/checkout`, `app/auth`, `app/lib/account-api.ts`;
  - the `common.json` keys `auth`, `account`, `quests`, `prizes`, `checkout`, `orders`.
- **No git writes.** Do not commit, stash, checkout, reset, clean or push.

### 0.2 Verified product facts this copy relies on

| Claim used in copy | Where it was verified |
|---|---|
| The customer card is one `GL-` code, shown as a QR code or a Code 128 barcode; "bigger and brighter" button | Spec §0.1, §5.4 |
| Points belong to a brand and work at all its locations; rewards are per brand | Spec §0, A4 |
| Staff scan with the camera, a handheld scanner, or a keyboard-wedge scanner. Loodly Spot also has a web build with a scanner input | Spec §4.8; `mobile-spot/package.json` `build:web`; `QrScanner.tsx` `WebScannerInput` |
| Laser scanners often cannot read screens; imager (2D) scanners can | Spec §7.6 |
| Counter exchange of points for a reward is in v1 | A3 |
| Promotions (brand tasks) are scheduled multipliers ×1.5, ×2, ×3 or custom, for all locations or selected ones. The console example is "×2, Thursday 10:00–14:00". A promotion can apply to app orders, counter awards or both | Spec §2.7.4, §3.3 PromotionsPage |
| Birthday points are a per-brand opt-in. The referral bonus goes to both people on the friend's first purchase credit | D3, A2 |
| Each menu product sets its own points (`loyaltyPoints` / `pointsPerUnit`), with a per-PLN fallback | `mobile-spot/components/molecules/MenuItemModal.tsx`; spec §2.7.3 |
| Menu items have photos, prices, allergens, an optional kcal value, and a sold-out toggle (employees can toggle it) | `MenuItemModal.tsx`; `mobile-spot/app/menu/index.tsx` (`isAvailable`); spec §1.4 |
| Menu and opening hours are set in **Loodly Spot**. The brand profile, locations, rewards, promotions and staff are set in the **brand console** (web) | Spec §3.3 CreateSpotPage success text, §1.4 |
| Loodly (platform) creates the brand and its first brand admin and sends an email invitation. The brand name is set by Loodly | Spec §0.2, E5, §3.3 CreateBrandPage |
| New locations start as drafts and are activated later; billing quota counts active locations | E3, §3.3 SpotsPage |
| Roles: BRAND_ADMIN covers the whole brand and every spot in the app, plus brand reports. SPOT_ADMIN covers one or more spots. EMPLOYEE covers one spot and awards by template only | Spec §0.3, §1.4, E6 |
| Safeguards: self-award guard, `manualAwardCap`, optional `staffDailyAwardCap` | Spec §2.7.6 |
| New orders ring in Loodly Spot | `mobile-spot/hooks/useOrderAlertSound.ts` |
| Couriers use **Loodly Courier**. Each location has courier applications and a `courierPayout`. The customer sees a live map | `mobile-courier/app.json`; `loodly-be/prisma/schema.prisma` (`CourierApplication`, `courierPayout`) |
| Payment: card, BLIK, Apple Pay and Google Pay online, or cash at pickup when the location turns off online payment | `mobile/app/order/payment.tsx`; `CheckoutClient.tsx:55-86` |
| Reports are PDFs: orders, points, courier and staff sessions per location (with logo), plus brand-wide orders and points | `loodly-be/src/routes/reports.ts`; spec §2.9 |
| The website also takes orders (it has a checkout) | `app/checkout`, `app/components/checkout` |
| Spot news exists (spot admins post it) | Spec §1.4 |
| App names: **Loodly**, **Loodly Spot**, **Loodly Courier** | each `app.json` |
| Contact: `kontakt@loodly.pl` (`app/terms/TermsContentPl.tsx:179,252,321`). **No Loodly phone number exists**; the numbers in the policy belong to the data-protection authority | grep of `app/` |
| Domain `https://loodly.pl` | terms and policy pages |
| Store URLs come from `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL`. Both are unset (no `.env`), so the badges link to `#` today | `LandingSections.tsx` |
| `qrcode.react@4` is already a dependency | `package.json` |
| `lottie-web@5.13.0` ships `build/player/lottie_light.js` (about 46 KB gzipped) **with its own `lottie_light.d.ts`**, so no custom type declaration is needed. `goToAndStop("poster")` resolves a marker by name | checked in a scratch install |
| `t()` returns strings only; arrays need keyed objects. Interpolation is `{{x}}`. Plurals use `key_one/_few/_many` when a `count` param is given | `app/i18n/I18nProvider.tsx` |

### 0.3 Corrections to the source briefs

1. **Menu location (A).** Brief A said the menu is set up "in the brand console in the browser". It is set up in **Loodly Spot**. The setup act now says so.
2. **Lottie types (A).** Brief A's `types/lottie-web-light.d.ts` is not needed; the package already ships `lottie_light.d.ts`.
3. **Contrast on berry (B).** Brief B allowed `text-white/90` on berry. That is 4.46:1, which fails for body text. Use solid white on berry, or white/80 on berry-dark or espresso.
4. **Poster images (B).** Brief B's custom poster renderer (`poster.mjs`) is dropped. It is a second, drift-prone Lottie renderer. Reduced motion uses lottie's own `goToAndStop("poster")`.
5. **Unbacked claims (B).** "Szybki start" (quick start) and "Więcej powrotów" (more repeat visits) are dropped as hero chips; they are outcome claims we cannot back, and setup time "depends". "So your team doesn't retype orders" is dropped; the integration's exact function is unconfirmed.
6. **Spelling (B).** Brief B used UK spelling. The existing EN file uses US spelling ("flavors"), so EN copy is **US** (favorites, catalog, program, neighborhood).
7. **Category nouns.** "Confectioneries" reads as a translation; EN uses "**pastry shops**". "Cake shops" is British. In PL "cukiernie" stays; in UA "кондитерські" stays.
8. **Merch labels on the consumer page.** Merch on the consumer page is **not** labelled "Kubek Loodly". Rewards belong to brands, so a "Loodly mug" would imply that Loodly hands them out. The merch is drawn with the Loodly logo, and a note says these are examples.
9. **Scene 4 toggle (B).** Brief B's menu-scene toggle coordinates pointed at the wrong card. They are recomputed in §4.4.
10. **Existing contrast bug.** The `SpotCard` "open now" badge is white text on pistachio (2.10:1). Change it to espresso text on pistachio.

### 0.4 Contrast pairs (computed, WCAG 2.x)

**Safe:**
- espresso on cream, cream-soft, cream-deep or white (≥ 14:1);
- `espresso/65` on cream (5.03), cream-soft (4.92) or white (5.15). On cream-deep use `espresso/75` (6.47);
- berry text on white (5.19), cream (4.93) or cream-soft (4.69);
- `berry-dark` on cream-soft (7.77) or on a `berry/10` tint (7.38);
- solid white on berry (5.19), berry-dark (8.60) or espresso (15.97);
- `white/80` on berry-dark (5.97) or espresso (10.6);
- espresso on mango (8.73) or pistachio (7.61);
- `cream/60` on espresso-dark (6.78).

**Never:**
- white on strawberry (2.65), mango (1.83) or pistachio (2.10);
- `white/90` or lighter on berry (4.46);
- `espresso/60` or lighter as text on cream (4.30);
- berry text on cream-deep (4.33);
- berry text on a `berry/10` tint (4.46).

---

## 1. Positioning and voice

### 1.1 One-liners

| | PL (primary) | EN (US) | UA |
|---|---|---|---|
| Consumer | Lody, kawa i wypieki z okolicy w jednej aplikacji: zamawiasz z odbiorem lub dostawą, pokazujesz jedną kartę i wymieniasz punkty na nagrody. | Ice cream, coffee and pastries from your neighborhood in one app: order for pickup or delivery, show one card and swap points for rewards. | Морозиво, кава й випічка поруч — в одному додатку: замовляйте із самовивозом або доставкою, показуйте одну картку й обмінюйте бали на нагороди. |
| Business | Zamówienia, punkty i dostawy — jeden system dla Twoich lokali, od jednego lokalu po sieć w kilku miastach, połączony z systemem, w którym wystawiasz paragony i faktury. | Orders, points and delivery — one system for your locations, from a single shop to a chain across cities, connected to the system you use for receipts and invoices. | Замовлення, бали й доставка — одна система для ваших закладів, від одного до мережі в кількох містах, у зв'язці із системою, де ви видаєте чеки й рахунки-фактури. |

### 1.2 Voice

**Three pillars, both pages:**
1. **Ciepło / Warm / Тепло.** Use people words: lada (counter), stały klient (regular), "dzień dobry" (good morning).
2. **Prosto / Simple / Просто.** Short sentences and everyday words. No "POS", "CRM" or "omnichannel".
3. **Uczciwie / Honest / Чесно.** Describe mechanisms, not promised outcomes. Use "na przykład", "możesz" and "jeśli lokal oferuje" ("for example", "you can", "if the location offers it").

**Consumer page (Direction A):**
- The neighborhood, the morning coffee, regulars, and older customers who like a simple card.
- Emotional anchor (used once): PL "Jak dawna karta z pieczątkami — tylko że się nie gubi." / EN "Like the old stamp card — except you can't lose it." / UA "Як стара картка зі штампами — тільки її не загубиш."

**Business page (Direction B):** partner-like and concrete, for owners with one to about six locations. Lead with what the system does, then show it.

**Register:**
- PL uses "Ty" with a capitalised "Twój/Twoim".
- UA uses lowercase "ви".
- PL is gender-neutral: no "Gotowy?".
- No "pkt" inside sentences.
- Emoji are decorative only, with `aria-hidden`.

### 1.3 Glossary

| Concept | PL | EN | UA |
|---|---|---|---|
| spot | lokal | location | заклад |
| brand (B2B page only) | marka | brand | бренд |
| points / reward / card | punkty / nagroda / karta | points / reward / card | бали / нагорода / картка |
| admin web | panel marki | brand console | панель бренду |
| staff app | aplikacja Loodly Spot | the Loodly Spot app | додаток Loodly Spot |
| courier app | Loodly Courier | Loodly Courier | Loodly Courier |
| brand task | promocja | promotion | акція |
| receipts and invoices | paragony i faktury | receipts and invoices | чеки й рахунки-фактури |
| pickup / delivery | odbiór / dostawa | pickup / delivery | самовивіз / доставка |
| brand admin / spot admin / employee | administrator marki / administrator lokalu / pracownik | brand admin / location admin / employee | адміністратор бренду / адміністратор закладу / працівник |
| categories | lodziarnie, piekarnie, kawiarnie, cukiernie | ice cream shops, bakeries, cafés, pastry shops | морозиварні, пекарні, кав'ярні, кондитерські |
| generic loyalty line | Jedna karta wszędzie | One card everywhere | Одна картка всюди |

The console calls brand tasks "Promotions", so the pitch says "promocja" / "promotion" / "акція".

---

## 2. Landing (`/`)

### 2.1 Section map (`app/page.tsx`)

New order:

`Hero → Categories → HowItWorks → Loyalty → Rewards → Features → AppSection → Teaser → BottomCta → Footer`

**Removed:** `Stats` (fabricated numbers) and `FlavorOfDay` (an invented flavor). Delete the components and their `stats.*` and `flavor.*` keys; nothing else uses them.

`<main id="main">` on every page you are allowed to edit (§2.4).

| # | Section (id) | Background | Content and build notes |
|---|---|---|---|
| 1 | `Hero` (`top`) | cream-soft → cream gradient (as today) | Badge "Nie tylko lody". H1, subtitle, CTAs. Graphic, floats and the business link are below this table |
| 2 | `Categories` (`categories`) | **berry band** (takes the old Stats slot, keeping the color rhythm) | h2 and subtitle in solid white. Four white cards (`rounded-3xl p-6`): illustration `h-24` on a cream-soft circle, name h3 in espresso, one-liner in `espresso/70`. Illustrations: ice cream → `ConeGraphic`, bakery → `BreadLoafGraphic`, café → `CoffeeCupGraphic`, pastry → `CakeSliceGraphic`. White pill CTA with berry text → `/spots`. Grid 2×2 below `lg`, 4 columns from `lg` |
| 3 | `HowItWorks` (`how`) | cream | Same layout. Replace the emoji with inline SVG icons (pin, bag, coin, gift) at `h-9 w-9` in berry |
| 4 | `Loyalty` (`loyalty`) | `bg-gradient-to-br from-berry-dark to-espresso` | Left: badge, h2 "Jedna karta wszędzie", lead (white/80), three rules (icon + h3 + body), white pill CTA → `#rewards`. Right: `PointsWalletMock` (§2.2) inside `<figure>` with a figcaption (white/80) and an sr-only `loyalty.mock_alt` |
| 5 | `Rewards` (`rewards`) | cream-soft | h2, subtitle, then two groups, each an h3 with a `<ul>` of tiles: "Z menu" (coffee, croissant, scoop) and "Gadżety z logo" (umbrella, mug, tote, cap, thermal, tshirt). Uses `<RewardGrid variant="landing" />` (§5). Note line under the grid in `espresso/70`. Grid: 2 columns below `sm`, 3 from `sm`, inside the section, never page-wide scroll |
| 6 | `Features` (`features`) | cream | Six cards with keys `pickup, delivery, pay, menu, map, news`. Inline SVG icons; no emoji |
| 7 | `AppSection` (`app`) | cream-soft | Copy, four points and store badges (rules below). Phone mock-up: the `LoodlyMark` header replaces "Loodly 🍦", plus a mini order card (croissant and cup icons from `TreatGraphics`, two skeleton bars, `app.mock_title`, a pistachio chip with `app.mock_status` in espresso). The QR block rule is below |
| 8 | `Teaser` (`business`) | cream with an espresso-dark card | Card `rounded-[2rem] bg-espresso-dark p-8 sm:p-12`: h2 white, body `cream/80`, white pill CTA (berry text) → `/for-business`. A small `PlatformTrio` thumbnail (§3.4) on the right from `lg` |
| 9 | `BottomCta` | `from-berry to-berry-dark` (fixes the 2.65:1 strawberry gradient) | h2 white, subtitle **solid white**, white pill → `#app`. Decorations: `CroissantGraphic` and `ScoopGraphic` at 40% opacity, `aria-hidden` |
| 10 | `Footer` (`contact`) | espresso-dark | Rules below |

**Hero details:**
- **Graphic:** `HeroTreatsGraphic` (§2.2) replaces `ConeGraphic`.
- **Floating background:** keep `ScoopGraphic`; add a small `CroissantGraphic` and `CoffeeCupGraphic`.
- **CTAs:** primary "Znajdź lokal" → `/spots`; secondary "Pobierz aplikację" → `#app`.
- **Business link:** under the CTAs, a text link `hero.business_link` → `/for-business`, berry and underlined.

**AppSection details:**
- **Store badges:** render a badge only when its env URL is set (no more `#`). If neither is set, show a berry pill `app.web_cta` → `/spots` and the line `app.web_hint`.
- **QR block:** render a real `QRCodeSVG` (from `qrcode.react`) only when the new `NEXT_PUBLIC_APP_DOWNLOAD_URL` is set; otherwise remove the block. The hint text is at least 12px in `espresso/75`.

**Footer details:**
- The logo `<img src="/loodly-logo.svg" alt="Loodly">` sits on a cream chip (`rounded-2xl bg-cream px-3 py-2`) and replaces "🍦 Loodly".
- The tagline is in `cream/60`.
- Column "Firma": `footer.business` → `/for-business`, `nav.spots` → `/spots`, and `footer.email_label` → `mailto:` built from `BUSINESS_CONTACT.email` (hidden when empty).
- Column "Informacje prawne": as today.
- **Remove** "O nas" and "Kariera" (both pointed at `/`) and their keys.
- Social icons render only for non-empty `SOCIAL_LINKS` entries; all are empty today, so none show.
- The bottom row (copyright and "made") stays.

**Other landing tasks:**
- **Spots wording.** Change the PL/EN/UA "punkt / spot / точка" values in `spots.*` and `spot.*` to lokal / location / заклад (§2.3 lists the keys). This completes L1a(4) for those namespaces; tell the parity task.
- **Placeholders.** Replace generic 🍦/🍨 placeholders with a decorative mark (`<LoodlyMark className="h-12 w-12" />`, `aria-hidden`) at `SpotCard.tsx:39`, `SpotDetail.tsx:56,82,169`, `SpotsExplorer.tsx:120,129`, `SpotsMap.tsx:248`, `SpotMenu.tsx:118` and `not-found.tsx:44`.
  - In `SpotMenu.tsx:148` and `MenuItemDetailModal.tsx:65`, keep 🍦 for `kind === "taste"`, but replace the "🥤" product fallback with the mark (a croissant must not show a soft drink).
  - Leave `BoxPickerModal.tsx:152` (scoop picker) alone.
- **Contrast fix:** the `SpotCard` open badge becomes `bg-pistachio text-espresso`.
- **Reduced motion** in `app/globals.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .animate-float-slow, .animate-float-medium, .animate-fade-up { animation: none !important; }
    html { scroll-behavior: auto; }
  }
  ```
  New code uses `motion-safe:` variants (for example `motion-safe:hover:scale-105`).

**Header (`app/components/Header.tsx`, API stays `<Header/>`):**
- **Links:** How it works `/#how`, Locations `/spots`, Rewards `/#rewards`, App `/#app`, and For business `/for-business`. The last is an outlined pill (`border-2 border-berry/30 text-berry`) with `aria-current="page"` when the pathname starts with `/for-business`; it comes from `usePathname`.
- **Desktop nav** from `lg:` (there is not enough room for 5 links plus language plus login at `md`).
- **Below `lg`:** a menu button.
  - 44×44, `aria-expanded`, `aria-controls="mobile-nav"`, label `nav.menu_open` / `nav.menu_close`.
  - It opens a panel under the bar with the same 5 links as 48px rows.
  - The panel closes on Escape (focus returns to the button), on a link click and on a route change.
- **Skip link:** first in the header, `sr-only focus:not-sr-only`, `nav.skip` → `#main`.
- **Focus:** `focus-visible:outline-2 outline-offset-2 outline-berry` on all links and buttons.
- **Nav landmark:** `<nav aria-label={t("nav.main_nav")}>`.

### 2.2 Landing graphics

- **`app/components/TreatGraphics.tsx`.** Same API and flat cartoon style as `IceCreamGraphics` (`SVGProps`, `fill="none"`, palette fills, one white highlight at 35–50%).
  - `CoffeeCupGraphic`: to-go cup with a berry sleeve, cream lid and steam in `espresso/20`.
  - `CroissantGraphic`: five-segment crescent in `#e8a866`, separators `#d18f4e`, highlights cream-deep at 60%.
  - `BreadLoafGraphic`: `#e8a866` loaf with three `#d18f4e` scoring cuts and a cream-deep top highlight.
  - `CakeSliceGraphic`: strawberry and cream layers, berry jam line, cherry `#e11d48`.
  - `HeroTreatsGraphic`: a 420×420 cluster.
    - The cone (reuse the `ConeGraphic` shapes) sits back centre; the to-go cup front left; the cake slice front right; the croissant bottom centre.
    - A small white "card" chip (rounded 18, shadow) at top right, rotated +8°, holds the mark and 10 decorative barcode bars.
    - Behind it all, a strawberry/20 blur blob (as today).
- **`app/components/landing/PointsWalletMock.tsx`.** An HTML/CSS phone (`w-64 rounded-[2.5rem] border-8 border-espresso bg-cream p-3`), so its text is real and localized.
  - Header `loyalty.mock_title`.
  - Three rows. Each row has: a 40px category icon circle (cup, croissant, cone from `TreatGraphics`, on cream-deep); a **skeleton bar instead of a brand name** (no invented brands, `bg-espresso/15 h-3 w-24`); and a mango coin with `t("loyalty.mock_points", { count, n })`, using the balances 1 250, 380 and 95.
  - Below the rows, a white card: `loyalty.mock_card`, a decorative barcode (aria-hidden bars), and a two-segment pill `loyalty.mock_qr | loyalty.mock_barcode` with the barcode side active.
  - Format `n` with `Intl.NumberFormat(locale)` and pass `count` for the plural.
  - The balances 1 250, 380 and 95 all take the "many" form in PL and UA, so they avoid the UA 21/31 plural bug (§7).
- **`app/components/brand/LoodlyMark.tsx`** (shared, built first, §5.1).

### 2.3 `common.json` copy

**How to apply, per locale:**
- **REPLACE** these objects entirely: `site`, `hero`, `how`, `features`, `app`, `cta`.
- **ADD:** `categories`, `loyalty`, `rewards`, `teaser`.
- **MERGE** the listed keys into `nav`, `footer`, `spots`, `spot`. Unlisted keys stay; `nav.home` is used by `not-found`.
- **DELETE:** `stats`, `flavor`, `footer.about`, `footer.careers`.
- **Never add** a top-level `business` key to `common.json`; it is the pitch namespace (§6.2).

`layout.tsx` imports `site.title` and `site.description` from the PL file (§2.5).

#### PL

```json
{
  "site": {
    "title": "Loodly — lodziarnie, piekarnie, kawiarnie i cukiernie",
    "description": "Zamawiaj z lokalnych lodziarni, piekarni, kawiarni i cukierni — z odbiorem lub dostawą. Jedna karta wszędzie: zbieraj punkty i wymieniaj je na nagrody."
  },
  "nav": {
    "how": "Jak to działa",
    "spots": "Lokale",
    "rewards": "Nagrody",
    "app": "Aplikacja",
    "business": "Dla firm",
    "menu_open": "Otwórz menu",
    "menu_close": "Zamknij menu",
    "skip": "Przejdź do treści",
    "main_nav": "Menu główne"
  },
  "hero": {
    "badge": "Nie tylko lody",
    "title": "Lody, kawa i wypieki z okolicy — w jednej aplikacji",
    "subtitle": "Zamawiaj z lodziarni, piekarni, kawiarni i cukierni w swoim mieście — z odbiorem w lokalu albo z dostawą. Przy kasie pokazujesz jedną kartę, zbierasz punkty i wymieniasz je na nagrody.",
    "cta_find": "Znajdź lokal",
    "cta_download": "Pobierz aplikację",
    "cta_order": "Zamów teraz",
    "business_link": "Prowadzisz lokal? Zobacz Loodly dla firm"
  },
  "categories": {
    "title": "Od porannej kawy po lody na deser",
    "subtitle": "Lokale z Twojej okolicy w jednej aplikacji. Sprawdź, co jest w Twoim mieście.",
    "cta": "Zobacz lokale",
    "icecream": { "name": "Lodziarnie", "desc": "Gałki, desery i lody na wynos" },
    "bakery": { "name": "Piekarnie", "desc": "Świeży chleb i drożdżówki — zamów wcześniej, odbierz po drodze" },
    "cafe": { "name": "Kawiarnie", "desc": "Kawa na wynos zamówiona z telefonu" },
    "confectionery": { "name": "Cukiernie", "desc": "Ciasta, torty i słodkości na każdą okazję" }
  },
  "how": {
    "title": "Jak to działa?",
    "subtitle": "Od zamówienia do nagrody w czterech krokach.",
    "step1": { "title": "Wybierz lokal", "description": "Wybierz miasto i lokal na mapie. Od razu zobaczysz menu, godziny otwarcia i to, czy jest odbiór albo dostawa." },
    "step2": { "title": "Zamów albo pokaż kartę", "description": "Zamów w aplikacji z odbiorem lub dostawą. Kupujesz na miejscu? Pokaż kartę Loodly przy kasie." },
    "step3": { "title": "Zbieraj punkty", "description": "Punkty dostajesz za zamówienia w aplikacji i za zakupy przy kasie — trafiają prosto na Twoją kartę." },
    "step4": { "title": "Odbierz nagrodę", "description": "Gdy uzbierasz dość punktów, wymień je na nagrodę w aplikacji albo przy kasie." }
  },
  "loyalty": {
    "badge": "Program lojalnościowy",
    "title": "Jedna karta wszędzie",
    "lead": "Jak dawna karta z pieczątkami — tylko że się nie gubi. Masz ją w telefonie i pokazujesz w każdym lokalu w Loodly.",
    "r1_title": "Punkty zostają tam, gdzie je zbierasz",
    "r1_body": "Każde logo w aplikacji ma swoje saldo. Punkty wymienisz w każdym lokalu pod tą samą nazwą — za rogiem albo w innym mieście.",
    "r2_title": "Kod QR albo kod kreskowy",
    "r2_body": "Wybierz, co wygodniejsze — obsługa zeskanuje kod przy kasie. Jednym dotknięciem powiększysz go i rozjaśnisz ekran.",
    "r3_title": "Czasem punktów jest więcej",
    "r3_body": "Na przykład podwójne punkty w czwartki od 10 do 14. Bywają też punkty na urodziny i za polecenie znajomego — wszystko zobaczysz w aplikacji.",
    "cta": "Zobacz przykładowe nagrody",
    "mock_title": "Twoje punkty",
    "mock_card": "Twoja karta Loodly",
    "mock_qr": "Kod QR",
    "mock_barcode": "Kod kreskowy",
    "mock_points_one": "{{n}} punkt",
    "mock_points_few": "{{n}} punkty",
    "mock_points_many": "{{n}} punktów",
    "mock_caption": "Przykładowy widok aplikacji",
    "mock_alt": "Przykładowy ekran aplikacji: karta z kodem i trzy osobne salda punktów."
  },
  "rewards": {
    "title": "Na co wymienisz punkty?",
    "subtitle": "Kilka przykładów: od kawy i croissanta po parasol z logo. Każdy katalog nagród jest inny — aktualne nagrody i ich cenę w punktach zobaczysz w aplikacji.",
    "group_menu": "Z menu",
    "group_merch": "Gadżety z logo",
    "items": {
      "coffee": "Kawa gratis",
      "croissant": "Croissant gratis",
      "scoop": "Gałka lodów gratis",
      "umbrella": "Parasol",
      "mug": "Kubek",
      "tote": "Torba bawełniana",
      "cap": "Czapka z daszkiem",
      "thermal": "Kubek termiczny",
      "tshirt": "Koszulka"
    },
    "note": "Gadżety pokazujemy z logo Loodly — to tylko przykłady."
  },
  "features": {
    "title": "Dlaczego Loodly?",
    "subtitle": "Wszystko, czego potrzebujesz, żeby wygodnie kupować w okolicy.",
    "pickup": { "title": "Odbiór w lokalu", "description": "Zamów wcześniej w aplikacji i odbierz zamówienie, gdy będzie gotowe. Przy odbiorze pokazujesz kartę, a punkty trafiają na Twoje konto." },
    "delivery": { "title": "Dostawa z podglądem na mapie", "description": "Jeśli lokal dowozi, zamówisz dostawę pod drzwi i zobaczysz kuriera na mapie." },
    "pay": { "title": "Płać, jak wolisz", "description": "Online — kartą, BLIK-iem, Apple Pay lub Google Pay — albo na miejscu przy odbiorze, jeśli lokal na to pozwala." },
    "menu": { "title": "Aktualne menu", "description": "Ceny, opisy i alergeny w jednym miejscu. Gdy coś się skończy, obsługa od razu oznacza to w menu." },
    "map": { "title": "Lokale na mapie", "description": "Wybierz miasto i sprawdź, co jest teraz otwarte, gdzie zamówisz dostawę, a gdzie odbiór osobisty." },
    "news": { "title": "Nowości i promocje", "description": "Wiadomości i promocje z lokali, które lubisz, w jednym miejscu w aplikacji." }
  },
  "app": {
    "title": "Wszystko w aplikacji Loodly",
    "subtitle": "Menu, zamówienia, karta i nagrody — zawsze pod ręką.",
    "point1": "Przeglądaj menu i godziny otwarcia lokali w swoim mieście",
    "point2": "Zamawiaj z odbiorem lub dostawą i śledź zamówienie",
    "point3": "Pokazuj przy kasie jedną kartę — kod QR albo kod kreskowy",
    "point4": "Zbieraj punkty i wymieniaj je na nagrody",
    "ios": "Pobierz w App Store",
    "android": "Pobierz w Google Play",
    "qr_hint": "Zeskanuj, aby pobrać",
    "web_cta": "Zamów przez stronę",
    "web_hint": "Możesz też zamawiać na loodly.pl — bez instalowania aplikacji.",
    "mock_title": "Twoje zamówienie",
    "mock_status": "Gotowe do odbioru"
  },
  "teaser": {
    "title": "Prowadzisz lodziarnię, piekarnię, kawiarnię albo cukiernię?",
    "body": "Przyjmuj zamówienia online, nagradzaj stałych klientów i współpracuj z kurierami — w jednym systemie, od jednego lokalu po kilka miast.",
    "cta": "Poznaj Loodly dla firm"
  },
  "cta": {
    "ready": "Masz ochotę na coś dobrego?",
    "subtitle": "Pobierz Loodly, znajdź lokal w swojej okolicy i zbieraj punkty od pierwszych zakupów.",
    "download_now": "Pobierz aplikację"
  },
  "footer": {
    "tagline": "Lodziarnie, piekarnie, kawiarnie i cukiernie z Twojej okolicy — zamówienia, dostawa i jedna karta na punkty.",
    "business": "Dla firm",
    "email_label": "Napisz do nas",
    "made": "Zrobione z ❤️ dla lokalnych smaków"
  },
  "spots": {
    "title": "Lokale w Twoim mieście",
    "subtitle": "Wybierz miasto i znajdź najbliższy lokal na mapie.",
    "count_one": "{{count}} lokal",
    "count_few": "{{count}} lokale",
    "count_many": "{{count}} lokali",
    "loading": "Ładowanie lokali…",
    "none": "W tym mieście nie ma jeszcze lokali — zajrzyj wkrótce!",
    "error": "Nie udało się załadować lokali. Spróbuj ponownie później.",
    "view_spot": "Zobacz lokal",
    "map_unavailable": "Mapa niedostępna — brak klucza Google Maps. Lokale poniżej."
  },
  "spot": {
    "back": "Wróć do lokali",
    "order_here": "Zamów z tego lokalu",
    "menu_empty": "Ten lokal nie dodał jeszcze żadnych produktów.",
    "not_found": "Nie znaleziono lokalu."
  }
}
```

#### EN

```json
{
  "site": {
    "title": "Loodly — ice cream shops, bakeries, cafés & pastry shops",
    "description": "Order from local ice cream shops, bakeries, cafés and pastry shops for pickup or delivery. One card everywhere: collect points and swap them for rewards."
  },
  "nav": {
    "how": "How it works",
    "spots": "Locations",
    "rewards": "Rewards",
    "app": "App",
    "business": "For business",
    "menu_open": "Open menu",
    "menu_close": "Close menu",
    "skip": "Skip to content",
    "main_nav": "Main menu"
  },
  "hero": {
    "badge": "Not just ice cream",
    "title": "Ice cream, coffee and pastries from your neighborhood — in one app",
    "subtitle": "Order from ice cream shops, bakeries, cafés and pastry shops in your city — for pickup or delivery. Show one card at the counter, collect points and swap them for rewards.",
    "cta_find": "Find a location",
    "cta_download": "Get the app",
    "cta_order": "Order now",
    "business_link": "Own a shop or café? See Loodly for business"
  },
  "categories": {
    "title": "From morning coffee to ice cream for dessert",
    "subtitle": "Local favorites in one app. See what's in your city.",
    "cta": "Browse locations",
    "icecream": { "name": "Ice cream shops", "desc": "Scoops, sundaes and ice cream to go" },
    "bakery": { "name": "Bakeries", "desc": "Fresh bread and pastries — order ahead, pick up on your way" },
    "cafe": { "name": "Cafés", "desc": "Coffee to go, ordered from your phone" },
    "confectionery": { "name": "Pastry shops", "desc": "Cakes, tarts and sweet treats for any occasion" }
  },
  "how": {
    "title": "How it works",
    "subtitle": "From order to reward in four steps.",
    "step1": { "title": "Pick a location", "description": "Choose your city and a location on the map. You'll see the menu, opening hours and whether it offers pickup or delivery." },
    "step2": { "title": "Order or show your card", "description": "Order in the app for pickup or delivery. Buying in person? Show your Loodly card at the counter." },
    "step3": { "title": "Collect points", "description": "You earn points for app orders and for purchases at the counter — they go straight to your card." },
    "step4": { "title": "Get your reward", "description": "Once you have enough points, swap them for a reward in the app or at the counter." }
  },
  "loyalty": {
    "badge": "Loyalty program",
    "title": "One card everywhere",
    "lead": "Like the old stamp card — except you can't lose it. It's on your phone, and you show it at every location on Loodly.",
    "r1_title": "Points stay where you earn them",
    "r1_body": "Every logo in the app has its own balance. Spend the points at any location under the same name — around the corner or in another city.",
    "r2_title": "QR code or barcode",
    "r2_body": "Pick whichever you prefer — staff scan it at the counter. One tap makes the code bigger and your screen brighter.",
    "r3_title": "Sometimes you get extra points",
    "r3_body": "Like double points on Thursdays from 10 a.m. to 2 p.m. There can also be points on your birthday and for inviting a friend — you'll see it all in the app.",
    "cta": "See example rewards",
    "mock_title": "Your points",
    "mock_card": "Your Loodly card",
    "mock_qr": "QR code",
    "mock_barcode": "Barcode",
    "mock_points_one": "{{n}} point",
    "mock_points_few": "{{n}} points",
    "mock_points_many": "{{n}} points",
    "mock_caption": "Example app screen",
    "mock_alt": "Example app screen: a card with a code and three separate points balances."
  },
  "rewards": {
    "title": "What can you get for your points?",
    "subtitle": "A few examples, from a coffee and a croissant to an umbrella with a logo. Every rewards catalog is different — you'll find the current rewards and their prices in points in the app.",
    "group_menu": "From the menu",
    "group_merch": "Merch with a logo",
    "items": {
      "coffee": "Free coffee",
      "croissant": "Free croissant",
      "scoop": "Free scoop of ice cream",
      "umbrella": "Umbrella",
      "mug": "Mug",
      "tote": "Tote bag",
      "cap": "Baseball cap",
      "thermal": "Travel mug",
      "tshirt": "T-shirt"
    },
    "note": "Merch is shown with the Loodly logo — these are just examples."
  },
  "features": {
    "title": "Why Loodly?",
    "subtitle": "Everything you need to shop local, the easy way.",
    "pickup": { "title": "Pickup at the location", "description": "Order ahead in the app and pick it up when it's ready. Show your card at pickup and the points land in your account." },
    "delivery": { "title": "Delivery you can follow on the map", "description": "Where a location delivers, order to your door and watch your courier on the map." },
    "pay": { "title": "Pay your way", "description": "Online — by card, BLIK, Apple Pay or Google Pay — or in person at pickup, where the location allows it." },
    "menu": { "title": "Up-to-date menus", "description": "Prices, descriptions and allergens, all together. When something sells out, staff mark it right away." },
    "map": { "title": "Locations on the map", "description": "Pick your city and see what's open now, where you can get delivery and where to pick up." },
    "news": { "title": "News and offers", "description": "Updates and offers from the locations you like, all together in the app." }
  },
  "app": {
    "title": "It's all in the Loodly app",
    "subtitle": "Menus, orders, your card and rewards — always at hand.",
    "point1": "Browse menus and opening hours of locations in your city",
    "point2": "Order for pickup or delivery and follow your order",
    "point3": "Show one card at the counter — QR code or barcode",
    "point4": "Collect points and swap them for rewards",
    "ios": "Download on the App Store",
    "android": "Get it on Google Play",
    "qr_hint": "Scan to download",
    "web_cta": "Order on the website",
    "web_hint": "You can also order at loodly.pl — no app needed.",
    "mock_title": "Your order",
    "mock_status": "Ready for pickup"
  },
  "teaser": {
    "title": "Run an ice cream shop, bakery, café or pastry shop?",
    "body": "Take online orders, reward your regulars and work with couriers — in one system, from a single location to several cities.",
    "cta": "Explore Loodly for business"
  },
  "cta": {
    "ready": "Craving something good?",
    "subtitle": "Get Loodly, find a location near you and start collecting points with your first purchase.",
    "download_now": "Get the app"
  },
  "footer": {
    "tagline": "Ice cream shops, bakeries, cafés and pastry shops near you — ordering, delivery and one card for points.",
    "business": "For business",
    "email_label": "Email us",
    "made": "Made with ❤️ for local flavors"
  },
  "spots": {
    "title": "Locations in your city",
    "subtitle": "Pick a city and find the nearest location on the map.",
    "count_one": "{{count}} location",
    "count_few": "{{count}} locations",
    "count_many": "{{count}} locations",
    "loading": "Loading locations…",
    "none": "No locations in this city yet — check back soon!",
    "error": "Couldn't load locations. Please try again later.",
    "view_spot": "View location",
    "map_unavailable": "Map unavailable — no Google Maps key set. Locations are listed below."
  },
  "spot": {
    "back": "Back to locations",
    "order_here": "Order from this location",
    "menu_empty": "This location hasn't added any products yet.",
    "not_found": "Location not found.",
    "pickup_available": "Pickup at the location — no address or GPS needed."
  }
}
```

#### UA

```json
{
  "site": {
    "title": "Loodly — морозиварні, пекарні, кав'ярні та кондитерські",
    "description": "Замовляйте в місцевих морозиварнях, пекарнях, кав'ярнях і кондитерських — із самовивозом або доставкою. Одна картка всюди: збирайте бали й обмінюйте їх на нагороди."
  },
  "nav": {
    "how": "Як це працює",
    "spots": "Заклади",
    "rewards": "Нагороди",
    "app": "Додаток",
    "business": "Для бізнесу",
    "menu_open": "Відкрити меню",
    "menu_close": "Закрити меню",
    "skip": "Перейти до вмісту",
    "main_nav": "Головне меню"
  },
  "hero": {
    "badge": "Не лише морозиво",
    "title": "Морозиво, кава й випічка поруч — в одному додатку",
    "subtitle": "Замовляйте в морозиварнях, пекарнях, кав'ярнях і кондитерських свого міста — із самовивозом або доставкою. На касі показуйте одну картку, збирайте бали й обмінюйте їх на нагороди.",
    "cta_find": "Знайти заклад",
    "cta_download": "Завантажити додаток",
    "cta_order": "Замовити зараз",
    "business_link": "Маєте заклад? Дізнайтеся про Loodly для бізнесу"
  },
  "categories": {
    "title": "Від ранкової кави до морозива на десерт",
    "subtitle": "Заклади поруч — в одному додатку. Подивіться, що є у вашому місті.",
    "cta": "Переглянути заклади",
    "icecream": { "name": "Морозиварні", "desc": "Кульки, десерти й морозиво з собою" },
    "bakery": { "name": "Пекарні", "desc": "Свіжий хліб і випічка — замовте заздалегідь, заберіть дорогою" },
    "cafe": { "name": "Кав'ярні", "desc": "Кава з собою, замовлена з телефона" },
    "confectionery": { "name": "Кондитерські", "desc": "Торти, тістечка й солодощі на будь-яку нагоду" }
  },
  "how": {
    "title": "Як це працює?",
    "subtitle": "Від замовлення до нагороди — чотири кроки.",
    "step1": { "title": "Оберіть заклад", "description": "Оберіть місто й заклад на карті. Одразу побачите меню, години роботи та чи є самовивіз або доставка." },
    "step2": { "title": "Замовте або покажіть картку", "description": "Замовляйте в додатку із самовивозом або доставкою. Купуєте на місці? Покажіть картку Loodly на касі." },
    "step3": { "title": "Збирайте бали", "description": "Бали нараховуються за замовлення в додатку й за покупки на касі — одразу на вашу картку." },
    "step4": { "title": "Отримайте нагороду", "description": "Коли балів достатньо, обміняйте їх на нагороду в додатку або на касі." }
  },
  "loyalty": {
    "badge": "Програма лояльності",
    "title": "Одна картка всюди",
    "lead": "Як стара картка зі штампами — тільки її не загубиш. Вона у вашому телефоні, і ви показуєте її в кожному закладі в Loodly.",
    "r1_title": "Бали залишаються там, де ви їх збираєте",
    "r1_body": "Кожен логотип у додатку має власний баланс. Обміняти бали можна в будь-якому закладі під тією самою назвою — за рогом чи в іншому місті.",
    "r2_title": "QR-код або штрихкод",
    "r2_body": "Обирайте, що зручніше, — персонал відсканує код на касі. Одним дотиком ви збільшите код і зробите екран яскравішим.",
    "r3_title": "Іноді балів більше",
    "r3_body": "Наприклад, подвійні бали щочетверга з 10 до 14. Бувають і бали на день народження та за запрошення друга — усе це видно в додатку.",
    "cta": "Переглянути приклади нагород",
    "mock_title": "Ваші бали",
    "mock_card": "Ваша картка Loodly",
    "mock_qr": "QR-код",
    "mock_barcode": "Штрихкод",
    "mock_points_one": "{{n}} бал",
    "mock_points_few": "{{n}} бали",
    "mock_points_many": "{{n}} балів",
    "mock_caption": "Приклад екрана додатка",
    "mock_alt": "Приклад екрана додатка: картка з кодом і три окремі баланси балів."
  },
  "rewards": {
    "title": "На що обміняти бали?",
    "subtitle": "Кілька прикладів: від кави й круасана до парасольки з логотипом. Каталоги нагород різні — актуальні нагороди та їхню ціну в балах ви побачите в додатку.",
    "group_menu": "З меню",
    "group_merch": "Речі з логотипом",
    "items": {
      "coffee": "Кава в подарунок",
      "croissant": "Круасан у подарунок",
      "scoop": "Кулька морозива в подарунок",
      "umbrella": "Парасолька",
      "mug": "Чашка",
      "tote": "Сумка-шопер",
      "cap": "Кепка",
      "thermal": "Термочашка",
      "tshirt": "Футболка"
    },
    "note": "Речі показано з логотипом Loodly — це лише приклади."
  },
  "features": {
    "title": "Чому Loodly?",
    "subtitle": "Усе, щоб зручно купувати поруч.",
    "pickup": { "title": "Самовивіз із закладу", "description": "Замовте заздалегідь у додатку й заберіть, коли буде готово. Покажіть картку під час отримання — і бали надійдуть на ваш рахунок." },
    "delivery": { "title": "Доставка, яку видно на карті", "description": "Якщо заклад доставляє, замовляйте до дверей і стежте за кур'єром на карті." },
    "pay": { "title": "Платіть, як зручно", "description": "Онлайн — карткою, BLIK, Apple Pay чи Google Pay — або на місці під час самовивозу, якщо заклад це дозволяє." },
    "menu": { "title": "Актуальне меню", "description": "Ціни, описи й алергени в одному місці. Коли щось закінчується, персонал одразу позначає це в меню." },
    "map": { "title": "Заклади на карті", "description": "Оберіть місто й подивіться, що відкрито зараз, де є доставка, а де — самовивіз." },
    "news": { "title": "Новини й акції", "description": "Новини та акції улюблених закладів — в одному місці в додатку." }
  },
  "app": {
    "title": "Усе — в додатку Loodly",
    "subtitle": "Меню, замовлення, картка й нагороди — завжди під рукою.",
    "point1": "Переглядайте меню й години роботи закладів у своєму місті",
    "point2": "Замовляйте із самовивозом або доставкою та стежте за замовленням",
    "point3": "Показуйте на касі одну картку — QR-код або штрихкод",
    "point4": "Збирайте бали й обмінюйте їх на нагороди",
    "ios": "Завантажити в App Store",
    "android": "Завантажити в Google Play",
    "qr_hint": "Скануйте, щоб завантажити",
    "web_cta": "Замовити на сайті",
    "web_hint": "Можна замовляти й на loodly.pl — без встановлення додатка.",
    "mock_title": "Ваше замовлення",
    "mock_status": "Готове до видачі"
  },
  "teaser": {
    "title": "Маєте морозиварню, пекарню, кав'ярню чи кондитерську?",
    "body": "Приймайте онлайн-замовлення, винагороджуйте постійних клієнтів і працюйте з кур'єрами — в одній системі, від одного закладу до кількох міст.",
    "cta": "Дізнатися про Loodly для бізнесу"
  },
  "cta": {
    "ready": "Хочеться чогось смачного?",
    "subtitle": "Завантажте Loodly, знайдіть заклад поруч і збирайте бали з першої покупки.",
    "download_now": "Завантажити додаток"
  },
  "footer": {
    "tagline": "Морозиварні, пекарні, кав'ярні й кондитерські поруч — замовлення, доставка та одна картка для балів.",
    "business": "Для бізнесу",
    "email_label": "Напишіть нам",
    "made": "Зроблено з ❤️ для місцевих смаків"
  },
  "spots": {
    "title": "Заклади у вашому місті",
    "subtitle": "Оберіть місто та знайдіть найближчий заклад на карті.",
    "count_one": "{{count}} заклад",
    "count_few": "{{count}} заклади",
    "count_many": "{{count}} закладів",
    "loading": "Завантаження закладів…",
    "none": "У цьому місті поки немає закладів — зазирніть згодом!",
    "error": "Не вдалося завантажити заклади. Спробуйте пізніше.",
    "view_spot": "Переглянути заклад",
    "map_unavailable": "Карта недоступна — не задано ключ Google Maps. Заклади нижче."
  },
  "spot": {
    "back": "Назад до закладів",
    "order_here": "Замовити в цьому закладі",
    "menu_empty": "Цей заклад ще не додав жодних товарів.",
    "not_found": "Заклад не знайдено.",
    "pickup_available": "Самовивіз із закладу — адреса й GPS не потрібні."
  }
}
```

The PL `spot.pickup_available` ("Odbiór w lokalu — bez adresu i GPS.") already uses "lokal", so the PL block does not override it.

### 2.4 `<main id="main">` targets

Add `id="main"` to `<main>` in:
- `app/page.tsx`
- `app/spots/page.tsx`
- `app/policy/page.tsx`
- `app/terms/page.tsx`
- `app/not-found.tsx`
- the new `app/for-business/page.tsx`

The account and checkout pages are out of scope; open item 9.

### 2.5 SEO (`app/layout.tsx`, static, PL)

Import the PL `common.json` and set:

```ts
metadataBase: new URL("https://loodly.pl"),
title: pl.site.title,
description: pl.site.description,
openGraph: { title: pl.site.title, description: pl.site.description, siteName: "Loodly", locale: "pl_PL", type: "website" },
```

There is no OG image yet (§7).

---

## 3. Pitch page (`/for-business`)

### 3.1 Route

`app/for-business/page.tsx` is a **server component**. Static export writes `out/for-business.html`, the same way `/policy` works.

```tsx
import type { Metadata } from "next";
import pl from "../../public/locales/pl/business.json";
export const metadata: Metadata = {
  title: pl.meta.title,
  description: pl.meta.description,
  alternates: { canonical: "/for-business" },
  openGraph: { title: pl.meta.title, description: pl.meta.description, siteName: "Loodly", locale: "pl_PL", type: "website" },
};
export default function Page() {
  return (<><Header /><main id="main" className="pt-16"><BusinessPage /></main><Footer /></>);
}
```

`BusinessPage` is a `"use client"` component.

### 3.2 Section order

Pricing sits at the bottom, as the owner asked; only the contact block follows it.

| # | Section (id) | Background | Layout |
|---|---|---|---|
| 1 | `BizHero` (`top`) | cream-soft → cream | Eyebrow chip, H1, subtitle and five value chips (`bg-white border border-berry/15 text-espresso`, each with a small berry icon). CTAs: primary "Porozmawiajmy" → `#get-in-touch` (→ `#pricing` when there is no contact); secondary "Zobacz, jak to działa" → `#story`; tertiary text link "Cennik" → `#pricing`. Right: static `PlatformTrio` SVG (§3.4) with `role="img"` and `aria-label={hero.visual_alt}`. It is SVG, so LCP stays fast |
| 2 | `Story` (`story`) | cream | h2, subtitle and three acts. Each act is an h3 with a subtitle, then its scenes. Each scene is `<article aria-labelledby>` with a chip `story.step` ("Krok 5 z 10", `bg-cream-soft text-berry-dark`), the kicker, an h4 title, the body, and `<figure className="rounded-[2rem] bg-cream-soft ring-1 ring-berry/10 p-3"><LottieScene …/></figure>`. From `lg`, a two-column grid alternates sides. On mobile the text comes first and the animation (max-w 480, centred) follows |
| 3 | `Benefits` (`benefits`) | cream-soft | Six white cards in a 3×2 grid (`lg`), 2 columns at `sm`, 1 below. Each card: icon tile, h3, body |
| 4 | `Team` (`roles`) | cream | h2 and subtitle. Three role cards: an icon, h3, a scope chip (espresso on `mango/30` or `pistachio/30`), body. Below them, a "Punkty pod kontrolą" card: three check items, pistachio check icon on espresso text |
| 5 | `BizRewards` (`rewards`) | cream-soft | h2, body, `<RewardGrid ids={["umbrella","mug","tote","cap","thermal","tshirt"]} variant="compact" />` and the note |
| 6 | `Integration` (`integration`) | espresso-dark band | Eyebrow (mango on espresso-dark, 10.3:1), h2 white, body `white/80`, three check points, `IntegrationDiagram` SVG (§3.4) with HTML labels **under** it (not SVG text), and a "Sprzęt" sub-card (`bg-white/5 ring-1 ring-white/10`) |
| 7 | `Faq` (`faq`) | cream | Native `<details>`/`<summary>`, 8 items. The chevron rotates only under `motion-safe`. a7 contains a link to `/policy` (`faq.a7_link`) |
| 8 | `Pricing` (`pricing`) | `from-berry-dark to-espresso` | h2 white, subtitle `white/80`. Two white cards side by side from `md`: (a) integration, (b) per location. Then an "includes" list (white/80 with pistachio checks), the VAT line (only when set), the note, and a white pill CTA → `#get-in-touch` |
| 9 | `ContactCta` (`get-in-touch`) | cream | Card with h2, body, an email button (`mailto:`), a "copy address" button and a phone button (only if a phone is set). The whole block is hidden when there is no contact. The id is not `contact`, because the footer already owns `id="contact"` |

### 3.3 Pricing, contact and site config

```ts
// app/components/business/pricing.config.ts   (owner: pitch)
export type PricingConfig = {
  currency: "PLN";
  integrationFeeFrom: number | null; // one-time, rendered as "od X"
  perSpotMonthly: number | null;     // per active location per month
  vat: "net" | "gross" | null;       // null = no VAT line
};
export const PRICING: PricingConfig = { currency: "PLN", integrationFeeFrom: null, perSpotMonthly: null, vat: null };

// app/lib/site-config.ts   (owner: landing; footer and pitch both read it)
// The email comes from app/terms/TermsContentPl.tsx. No Loodly phone number exists in the codebase.
export const BUSINESS_CONTACT = { email: "kontakt@loodly.pl", phone: "" } as const;
export const hasBusinessContact = Boolean(BUSINESS_CONTACT.email || BUSINESS_CONTACT.phone);
export const SOCIAL_LINKS = { facebook: "", instagram: "", tiktok: "" } as const; // empty = hidden
export const APP_LINKS = {
  ios: process.env.NEXT_PUBLIC_IOS_APP_URL ?? "",
  android: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "",
  download: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ?? "", // QR target; QR hidden when empty
} as const;
```

**Pricing rendering rules:**
- **Money format:** `new Intl.NumberFormat({ pl: "pl-PL", en: "en-US", ua: "uk-UA" }[locale], { style: "currency", currency, maximumFractionDigits: 0 })`.
- **Integration card:** label, period chip, then the price slot.
  - `integrationFeeFrom == null` → `pricing.integration_quote`.
  - Otherwise → `pricing.integration_from` with `{{amount}}`.
  - Then the body and two bullets (`integration_inc1`, `integration_inc2`).
- **Location card:**
  - `perSpotMonthly == null` → `pricing.spot_fallback`.
  - Otherwise → `pricing.spot_amount`.
  - Then the body.
- **Fallback styling:** a null value renders its fallback text at `text-2xl font-black text-espresso`, so it never looks like a broken number. A real number renders at `text-4xl font-black`.
- **VAT line:** `pricing.vat_net` / `pricing.vat_gross`, only when `vat` is set.
- **Footnote:** `pricing.note_quote` whenever either value is null.

**Contact rendering rules:**
- **Email:** `mailto:${email}?subject=${encodeURIComponent(t("business.contact.mail_subject"))}`. Only the subject goes in the URL, never personal data.
- **Copy button:** `navigator.clipboard.writeText(email)`, with `contact.copied` announced in an `aria-live="polite"` region. Hide the button when the clipboard API is missing.
- **Phone:** `tel:` link only when `phone` is non-empty.
- **No contact at all:** hide the block, and point the hero and pricing CTAs to `#pricing`.

### 3.4 Pitch graphics (`app/components/business/BusinessGraphics.tsx`)

These are static SVGs in the flat style, palette only, with no SVG text (labels are HTML).

- **`PlatformTrio`** (viewBox 560×420). Same proportions as the Lottie props (§4.2).
  - A laptop at the back left (brand console: berry-dark sidebar, a banner, a logo circle, skeleton lines).
  - A tablet on a stand at the centre right (Loodly Spot: berry header bar, three order rows, a mango bell).
  - A phone at the front left (customer card: barcode, QR | barcode pill, the mark).
  - A small courier on a scooter at the bottom right (mango box).
  - Dashed berry connector arcs, no arrows.
- **`IntegrationDiagram`** (viewBox 520×200).
  - Left: two generic papers, a receipt (zig-zag bottom) and an invoice (A4 with lines). No vendor marks.
  - Centre: the Loodly mark on a white circle.
  - Right: a tablet and a phone.
  - Joined by dashed berry-light lines (stroke 3, dash 6/6).
  - Three HTML labels below: `node_system`, `node_loodly`, `node_spots`.
  - `role="img"` with `aria-label={integration.diagram_alt}`.
- **`RoleIcon({ role })`.**
  - brandAdmin: a crown over three small storefronts.
  - locationAdmin: two storefronts with a key.
  - employee: a person with a scanner.
  - 48px, berry on cream-soft, `aria-hidden`.

### 3.5 `business.json` copy

The files are `public/locales/{pl,en,ua}/business.json`, registered under `business.*` (§6.2). Keys are camelCase; scene keys equal the Lottie scene names.

#### PL

```json
{
  "meta": {
    "title": "Loodly dla firm — zamówienia, punkty i dostawy",
    "description": "Zamówienia online, karta z punktami, nagrody, kurierzy i raporty dla lodziarni, piekarni, kawiarni i cukierni — połączone z Twoim systemem paragonów i faktur."
  },
  "hero": {
    "eyebrow": "Loodly dla firm",
    "title": "Zamówienia, punkty i dostawy — jeden system dla Twoich lokali",
    "subtitle": "Dla lodziarni, piekarni, kawiarni i cukierni — od jednego lokalu po sieć w kilku miastach. Klienci zamawiają w aplikacji Loodly i zbierają u Ciebie punkty jedną kartą, a my łączymy Loodly z systemem, w którym wystawiasz paragony i faktury.",
    "chips": {
      "orders": "Zamówienia online",
      "card": "Karta z punktami",
      "couriers": "Kurierzy",
      "locations": "Wiele lokali, jeden program",
      "integration": "Połączenie z Twoim systemem"
    },
    "cta_contact": "Porozmawiajmy",
    "cta_story": "Zobacz, jak to działa",
    "cta_pricing": "Cennik",
    "visual_alt": "Ilustracja: panel marki na laptopie, tablet z zamówieniami w lokalu, telefon klienta z kartą i kurier na skuterze."
  },
  "story": {
    "eyebrow": "Krok po kroku",
    "title": "Od założenia konta do pierwszej dostawy",
    "subtitle": "Zobacz, jak wygląda start i zwykły dzień z Loodly — tak samo w piekarni, kawiarni, lodziarni i cukierni.",
    "step": "Krok {{n}} z {{total}}",
    "acts": {
      "setup": { "title": "Zanim otworzysz drzwi", "subtitle": "Markę i lokale ustawiasz w panelu marki w przeglądarce, a menu — w aplikacji Loodly Spot." },
      "counter": { "title": "Przy ladzie", "subtitle": "Zespół pracuje w aplikacji Loodly Spot — na telefonie, tablecie albo w przeglądarce przy kasie." },
      "beyond": { "title": "Poza ladą", "subtitle": "Zamówienia z aplikacji i dostawy trafiają tam, gdzie reszta pracy." }
    },
    "scenes": {
      "account": {
        "kicker": "Na start",
        "title": "Zakładamy konto Twojej marki",
        "body": "Tworzymy Twoją markę w Loodly i wysyłamy e-mailem zaproszenie do pierwszego administratora. Ustawiasz własne hasło i wchodzisz do panelu marki.",
        "alt": "Animacja: koperta z zaproszeniem trafia do laptopa, pojawia się formularz logowania i zielony znak potwierdzenia."
      },
      "brand": {
        "kicker": "Na start",
        "title": "Pokazujesz, kim jesteś",
        "body": "Dodajesz logo, zdjęcie w tle, opis w kilku językach i miasta, w których działasz. Tak klienci zobaczą Cię w aplikacji i na stronie Loodly.",
        "alt": "Animacja: w panelu marki pojawiają się baner, logo, linie opisu i trzy etykiety miast, a na końcu znak zapisu."
      },
      "spots": {
        "kicker": "Na start",
        "title": "Dodajesz swoje lokale",
        "body": "Każdy lokal ma adres, godziny otwarcia, zespół oraz własne ustawienia odbioru, dostawy i płatności. Nowy lokal zaczyna jako szkic — aktywujesz go, gdy jest gotowy.",
        "alt": "Animacja: na mapie miasta pojawiają się trzy lokale połączone z logo marki, a ich znaczniki zmieniają kolor na zielony."
      },
      "menu": {
        "kicker": "Na start",
        "title": "Uzupełniasz menu",
        "body": "W aplikacji Loodly Spot dodajesz produkty ze zdjęciami, cenami i alergenami — i ustalasz, ile punktów daje każdy z nich. Gdy coś się skończy, zespół jednym dotknięciem oznacza to w menu.",
        "alt": "Animacja: na tablecie pojawiają się karty produktów — kawa, croissant, lody i ciasto — a jeden produkt zostaje na chwilę wyłączony."
      },
      "scan": {
        "kicker": "7:30",
        "title": "Skanujesz kartę klienta",
        "body": "Klient pokazuje w aplikacji kod QR albo kod kreskowy. Skanujesz go aparatem albo czytnikiem kodów i od razu widzisz jego punkty w Twojej marce oraz nagrody gotowe do wydania.",
        "alt": "Animacja: czytnik skanuje kod kreskowy na telefonie klienta, pojawia się zielone potwierdzenie i moneta z punktami."
      },
      "points": {
        "kicker": "Czwartek, 10:00",
        "title": "Punkty za zakupy — czasem podwójne",
        "body": "Pracownik dodaje punkty z gotowych szablonów, a za zamówienia w aplikacji punkty naliczają się same. Chcesz ożywić spokojniejsze godziny? Ustaw promocję, np. podwójne punkty w czwartki od 10 do 14 — w jednym lokalu albo we wszystkich.",
        "alt": "Animacja: wskazówka zegara wchodzi w wyróżnione godziny 10–14, pojawia się znak „razy dwa”, a monety wpadają na kartę parami."
      },
      "rewards": {
        "kicker": "13:00",
        "title": "Zadowoleni klienci, którzy wracają",
        "body": "Klienci wymieniają punkty na Twoje nagrody: kawę, ciastko, gałkę lodów albo gadżet z Twoim logo — w aplikacji albo od razu przy ladzie. Punkty zebrane u Ciebie wydają tylko u Ciebie, w każdym Twoim lokalu.",
        "alt": "Animacja: z pudełka z prezentem wyskakuje kubek z logo, dwoje klientów się uśmiecha, a w górę lecą serduszka."
      },
      "moreOrders": {
        "kicker": "15:00",
        "title": "Zamówienia także wtedy, gdy klienta nie ma w drzwiach",
        "body": "Klienci zamawiają w aplikacji i na stronie Loodly — z domu, z pracy albo po drodze, z odbiorem lub dostawą. Aktualności z Twojego lokalu, punkty na urodziny i polecenia przypominają o Tobie między wizytami.",
        "alt": "Animacja: z domu, biura i parku lecą zamówienia do lokalu, a na ladzie rośnie stos bonów."
      },
      "onlineOrders": {
        "kicker": "17:30",
        "title": "Zamówienie online prosto na tablet",
        "body": "Nowe zamówienie pojawia się w aplikacji Loodly Spot z sygnałem dźwiękowym. Przyjmujesz je, przygotowujesz i oznaczasz jako gotowe, a klient widzi każdy krok.",
        "alt": "Animacja: zamówienie leci z telefonu klienta na tablet w lokalu, dzwoni dzwonek, zamówienie zostaje przyjęte, a status zmienia się na gotowe."
      },
      "couriers": {
        "kicker": "18:00",
        "title": "Kurier w drodze, klient widzi go na mapie",
        "body": "Kurierzy z aplikacji Loodly Courier zgłaszają się do Twojego lokalu, a Ty decydujesz, z kim współpracujesz, i ustalasz stawkę za kurs. Przypisujesz zamówienie, a klient śledzi dostawę na żywo.",
        "alt": "Animacja: kurier jedzie trasą z lokalu do domu klienta, a na końcu pojawia się znacznik i zielone potwierdzenie."
      }
    }
  },
  "benefits": {
    "title": "Co zyskujesz z Loodly",
    "subtitle": "Narzędzia do codziennej pracy — dla Ciebie, Twojego zespołu i Twoich klientów.",
    "loyalty": { "title": "Program lojalnościowy bez papieru", "body": "Zamiast kart z pieczątkami — jedna karta w telefonie klienta. Ty ustalasz nagrody i ich cenę w punktach, a klient ma powód, żeby wracać właśnie do Ciebie." },
    "orders": { "title": "Własny kanał zamówień", "body": "Klienci zamawiają z Twojego menu z odbiorem lub dostawą i płacą online albo na miejscu — tak, jak ustawisz w każdym lokalu." },
    "locations": { "title": "Wiele lokali, jeden program", "body": "Wszystkie lokale w jednym panelu, także w różnych miastach. Punkty i nagrody działają w każdym z nich, a każdy lokal ma własne godziny, menu i zespół." },
    "promotions": { "title": "Promocje, urodziny i polecenia", "body": "Podwójne punkty w wybrane dni i godziny, punkty na urodziny i bonus za polecenie znajomego. Ty decydujesz, czy i ile punktów przyznajesz." },
    "couriers": { "title": "Kurierzy i śledzenie dostawy", "body": "Współpracujesz z kurierami, których akceptujesz. Klient widzi dostawę na mapie na żywo." },
    "reports": { "title": "Raporty dla lokalu i całej marki", "body": "Raporty PDF z zamówień, punktów, dostaw i logowań zespołu dla każdego lokalu, a zestawienia zamówień i punktów — dla całej marki." }
  },
  "roles": {
    "title": "Cały zespół, każdy na swoim miejscu",
    "subtitle": "Każda osoba loguje się na własne konto i widzi tylko to, czego potrzebuje do pracy — w jednym lokalu albo w kilku.",
    "brandAdmin": { "title": "Administrator marki", "scope": "Cała marka, wszystkie lokale", "body": "Ustawia markę, lokale, nagrody, promocje i zespół w panelu marki. Widzi raporty całej marki i może pracować w każdym lokalu w aplikacji Loodly Spot." },
    "locationAdmin": { "title": "Administrator lokalu", "scope": "Jeden lub kilka lokali", "body": "Prowadzi swoje lokale w aplikacji Loodly Spot: menu, godziny otwarcia, zamówienia, kurierów i pracowników. Widzi raporty swoich lokali." },
    "employee": { "title": "Pracownik", "scope": "Jeden lokal", "body": "Przyjmuje zamówienia, skanuje karty klientów, dodaje punkty z gotowych szablonów i wydaje nagrody." },
    "safety_title": "Punkty pod kontrolą",
    "safety1": "Pracownicy dodają punkty tylko z ustalonych szablonów",
    "safety2": "Limit punktów przyznawanych ręcznie i opcjonalny dzienny limit na osobę",
    "safety3": "Nikt z zespołu nie doda punktów na własne konto"
  },
  "rewards": {
    "title": "Podziękuj stałym klientom nagrodą",
    "body": "Produkt z Twojego menu albo gadżet z Twoim logo — Ty decydujesz, co trafia do katalogu, ile kosztuje w punktach i ile sztuk jest dostępnych.",
    "note": "Poniżej przykłady z logo Loodly — w Twoim katalogu będzie Twoje logo."
  },
  "integration": {
    "eyebrow": "Integracja",
    "title": "Działa z tym, czego już używasz",
    "body": "Nie musisz zmieniać sposobu, w jaki wystawiasz paragony i faktury. W ramach wdrożenia łączymy Loodly z systemem, którego używasz na co dzień do sprzedaży, paragonów i faktur. Zakres integracji ustalamy razem — dlatego wyceniamy ją indywidualnie.",
    "p1": "Paragony i faktury wystawiasz tak jak dziś",
    "p2": "Zakres integracji ustalamy razem, przed wyceną",
    "p3": "Napisz, z jakiego systemu korzystasz — sprawdzimy możliwości",
    "node_system": "Twój system sprzedaży, paragonów i faktur",
    "node_loodly": "Loodly",
    "node_spots": "Twoje lokale i klienci",
    "diagram_alt": "Schemat: Twój system paragonów i faktur połączony z Loodly, a Loodly z tabletem w lokalu i telefonem klienta.",
    "hardware_title": "Sprzęt, który już masz",
    "hardware_body": "Wystarczy telefon lub tablet z aplikacją Loodly Spot — kody klientów skanujesz aparatem. Możesz też podłączyć czytnik kodów kreskowych; sprawdzimy go razem podczas wdrożenia."
  },
  "faq": {
    "title": "Częste pytania",
    "q1": "Ile trwa uruchomienie?",
    "a1": "To zależy głównie od zakresu integracji, liczby lokali i wielkości menu. Termin startu ustalamy razem i podajemy go w wycenie.",
    "q2": "Czy muszę zmienić kasę albo program do faktur?",
    "a2": "Nie. Łączymy Loodly z systemem, którego już używasz do sprzedaży, paragonów i faktur. Napisz, z czego korzystasz — sprawdzimy możliwości i zakres integracji przed wyceną.",
    "q3": "Jakiego sprzętu potrzebuję?",
    "a3": "Wystarczy telefon lub tablet z aplikacją Loodly Spot — karty klientów skanujesz aparatem. Przy kasie z komputerem możesz używać Loodly Spot w przeglądarce z podłączonym czytnikiem kodów kreskowych. Do kodów na ekranie telefonu najlepiej nadają się czytniki obrazowe (2D), bo laserowe często ich nie odczytują — Twój czytnik sprawdzimy podczas wdrożenia.",
    "q4": "Czy klienci wydadzą moje punkty gdzie indziej?",
    "a4": "Nie. Punkty zebrane w Twojej marce klienci wymieniają tylko na Twoje nagrody — w każdym Twoim lokalu. Karta jest jedna, ale salda punktów każdej marki są osobne.",
    "q5": "Mam kilka lokali, także w różnych miastach. Czy to zadziała?",
    "a5": "Tak. Marka może mieć wiele lokali w różnych miastach. Każdy lokal ma własne godziny, menu i zespół; punkty i nagrody są wspólne dla całej marki, a promocje możesz włączyć we wszystkich lokalach albo w wybranych.",
    "q6": "Czy to będzie moja własna aplikacja?",
    "a6": "Twoje lokale działają w aplikacji i na stronie Loodly — z Twoim logo, opisem, menu i własnym programem punktów. Klienci mają jedną aplikację do wszystkich lokali w Loodly, ale punkty zebrane u Ciebie wymieniają tylko u Ciebie.",
    "q7": "Do kogo należą dane klientów?",
    "a7": "Zasady przetwarzania danych opisują umowa i polityka prywatności Loodly. Na co dzień widzisz zamówienia, punkty i raporty swojej marki. Szczegóły chętnie omówimy przy wycenie.",
    "a7_link": "Polityka prywatności",
    "q8": "Na jak długo jest umowa?",
    "a8": "Okres umowy i warunki wypowiedzenia ustalamy indywidualnie. Napisz do nas — wszystko wyjaśnimy."
  },
  "pricing": {
    "eyebrow": "Cennik",
    "title": "Prosty cennik",
    "subtitle": "Najpierw jednorazowe wdrożenie, potem niewielka miesięczna opłata za każdy lokal.",
    "integration_label": "Wdrożenie i integracja",
    "integration_period": "jednorazowo",
    "integration_quote": "Wycena indywidualna",
    "integration_from": "od {{amount}}",
    "integration_body": "Cena zależy od systemu, z którym łączymy Loodly, i od liczby lokali. Wycenę przygotujemy po krótkiej rozmowie.",
    "integration_inc1": "Integracja z Twoim systemem paragonów i faktur",
    "integration_inc2": "Założenie marki i konta administratora",
    "spot_label": "Każdy lokal",
    "spot_period": "miesięcznie",
    "spot_fallback": "Niewielka miesięczna opłata za każdy lokal",
    "spot_amount": "{{amount}} / lokal / miesiąc",
    "spot_body": "Płacisz za lokale aktywne w Loodly. Otwierasz kolejny? Po prostu go dodajesz.",
    "includes_title": "Co obejmuje Loodly",
    "inc1": "Twoje lokale i menu w aplikacji i na stronie Loodly",
    "inc2": "Aplikacja Loodly Spot dla zespołu",
    "inc3": "Panel marki w przeglądarce",
    "inc4": "Karta z punktami, nagrody, promocje, urodziny i polecenia",
    "inc5": "Raporty zamówień i punktów",
    "vat_net": "Ceny netto (+ VAT).",
    "vat_gross": "Ceny brutto (z VAT).",
    "note_quote": "Dokładne kwoty podamy w wycenie, po krótkiej rozmowie o Twoich lokalach.",
    "cta": "Poproś o wycenę"
  },
  "contact": {
    "title": "Porozmawiajmy o Twoich lokalach",
    "body": "Napisz, ile masz lokali i z jakiego systemu korzystasz do paragonów i faktur. Odpiszemy z wyceną.",
    "email_label": "E-mail",
    "phone_label": "Telefon",
    "cta_email": "Napisz do nas",
    "copy": "Skopiuj adres",
    "copied": "Adres skopiowany",
    "cta_phone": "Zadzwoń",
    "mail_subject": "Loodly dla firm — prośba o wycenę"
  },
  "a11y": {
    "play": "Odtwórz animację",
    "pause": "Wstrzymaj animację"
  }
}
```

#### EN

```json
{
  "meta": {
    "title": "Loodly for business — orders, loyalty and delivery",
    "description": "Online orders, a loyalty card with points, rewards, couriers and reports for ice cream shops, bakeries, cafés and pastry shops — connected to your receipts and invoicing system."
  },
  "hero": {
    "eyebrow": "Loodly for business",
    "title": "Orders, points and delivery — one system for all your locations",
    "subtitle": "For ice cream shops, bakeries, cafés and pastry shops — from a single location to a chain across several cities. Customers order in the Loodly app and collect points with you on one card, and we connect Loodly to the system you use for receipts and invoices.",
    "chips": {
      "orders": "Online orders",
      "card": "Loyalty card with points",
      "couriers": "Couriers",
      "locations": "Many locations, one program",
      "integration": "Works with your system"
    },
    "cta_contact": "Let's talk",
    "cta_story": "See how it works",
    "cta_pricing": "Pricing",
    "visual_alt": "Illustration: the brand console on a laptop, a tablet with orders at the location, a customer's phone with their card, and a courier on a scooter."
  },
  "story": {
    "eyebrow": "Step by step",
    "title": "From your first sign-in to your first delivery",
    "subtitle": "Here's what getting started and an ordinary day with Loodly look like — the same for bakeries, cafés, ice cream shops and pastry shops.",
    "step": "Step {{n}} of {{total}}",
    "acts": {
      "setup": { "title": "Before you open the doors", "subtitle": "You set up your brand and locations in the brand console in your browser, and your menu in the Loodly Spot app." },
      "counter": { "title": "At the counter", "subtitle": "Your team works in the Loodly Spot app — on a phone, a tablet or in the browser at the register." },
      "beyond": { "title": "Beyond the counter", "subtitle": "App orders and deliveries land in the same place as the rest of your work." }
    },
    "scenes": {
      "account": {
        "kicker": "Getting started",
        "title": "We set up your brand account",
        "body": "We create your brand on Loodly and email an invitation to your first admin. You set your own password and you're in the brand console.",
        "alt": "Animation: an invitation envelope drops into a laptop, a sign-in form appears and a green check mark confirms it."
      },
      "brand": {
        "kicker": "Getting started",
        "title": "Show customers who you are",
        "body": "Add your logo, a cover photo, a description in several languages and the cities you work in. That's how customers will see you in the Loodly app and on the website.",
        "alt": "Animation: a banner, a logo, description lines and three city tags appear in the brand console, followed by a save confirmation."
      },
      "spots": {
        "kicker": "Getting started",
        "title": "Add your locations",
        "body": "Each location has its own address, opening hours, team, and pickup, delivery and payment settings. New locations start as drafts — you activate them when they're ready.",
        "alt": "Animation: three locations appear on a city map, linked to the brand logo, and their markers turn green."
      },
      "menu": {
        "kicker": "Getting started",
        "title": "Fill in your menu",
        "body": "In the Loodly Spot app, add products with photos, prices and allergens — and decide how many points each one earns. When something sells out, your team marks it in one tap.",
        "alt": "Animation: product cards appear on a tablet — coffee, a croissant, ice cream and cake — and one product is briefly switched off."
      },
      "scan": {
        "kicker": "7:30 a.m.",
        "title": "Scan the customer's card",
        "body": "The customer shows a QR code or barcode in the app. Scan it with the camera or a barcode scanner and you instantly see their points with your brand and any rewards ready to hand over.",
        "alt": "Animation: a scanner reads the barcode on a customer's phone, then a green confirmation and a points coin appear."
      },
      "points": {
        "kicker": "Thursday, 10 a.m.",
        "title": "Points for every purchase — sometimes double",
        "body": "Staff add points from ready-made templates, and app orders earn points automatically. Want to liven up the quieter hours? Set up a promotion such as double points on Thursdays from 10 a.m. to 2 p.m. — at one location or all of them.",
        "alt": "Animation: a clock hand moves into the highlighted 10-to-2 window, a “times two” badge appears and coins drop onto the card in pairs."
      },
      "rewards": {
        "kicker": "1 p.m.",
        "title": "Happy customers who come back",
        "body": "Customers swap points for your rewards: a coffee, a pastry, a scoop of ice cream or merch with your logo — in the app or right at the counter. Points collected with you can only be spent with you, at any of your locations.",
        "alt": "Animation: a mug with a logo pops out of a gift box, two customers smile and little hearts float up."
      },
      "moreOrders": {
        "kicker": "3 p.m.",
        "title": "Orders even when customers aren't at your door",
        "body": "Customers order in the Loodly app and on the website — from home, from work or on the go, for pickup or delivery. Your location's news, birthday points and referrals keep you on their mind between visits.",
        "alt": "Animation: orders fly to the shop from a house, an office and a park, and a stack of tickets grows on the counter."
      },
      "onlineOrders": {
        "kicker": "5:30 p.m.",
        "title": "Online orders, straight to your tablet",
        "body": "A new order shows up in the Loodly Spot app with a sound alert. You accept it, prepare it and mark it ready, and the customer sees every step.",
        "alt": "Animation: an order flies from a customer's phone to the shop's tablet, a bell rings, the order is accepted and its status changes to ready."
      },
      "couriers": {
        "kicker": "6 p.m.",
        "title": "Courier on the way, live on the map",
        "body": "Couriers using the Loodly Courier app apply to work with your location, and you choose who to work with and set what they earn per delivery. Assign the order and the customer follows it live.",
        "alt": "Animation: a courier rides from the shop to the customer's home, ending with a pin and a green check mark."
      }
    }
  },
  "benefits": {
    "title": "What Loodly gives you",
    "subtitle": "Everyday tools for you, your team and your customers.",
    "loyalty": { "title": "A loyalty program without paper", "body": "Instead of stamp cards, one card on your customer's phone. You choose the rewards and their price in points — and customers get a reason to come back to you." },
    "orders": { "title": "Your own ordering channel", "body": "Customers order from your menu for pickup or delivery and pay online or in person — however you set up each location." },
    "locations": { "title": "Many locations, one program", "body": "All your locations in one console, even across cities. Points and rewards work at every one of them, while each location keeps its own hours, menu and team." },
    "promotions": { "title": "Promotions, birthdays and referrals", "body": "Double points on chosen days and hours, birthday points and a bonus for inviting a friend. You decide whether to give points — and how many." },
    "couriers": { "title": "Couriers and live tracking", "body": "Work with couriers you approve. Customers follow the delivery live on the map." },
    "reports": { "title": "Reports per location and brand-wide", "body": "PDF reports on orders, points, deliveries and staff sign-ins for each location, plus order and points summaries for your whole brand." }
  },
  "roles": {
    "title": "Your whole team, each in the right place",
    "subtitle": "Everyone signs in with their own account and sees only what they need — at one location or several.",
    "brandAdmin": { "title": "Brand admin", "scope": "The whole brand, every location", "body": "Sets up the brand, locations, rewards, promotions and team in the brand console. Sees brand-wide reports and can work at any location in the Loodly Spot app." },
    "locationAdmin": { "title": "Location admin", "scope": "One or several locations", "body": "Runs their locations in the Loodly Spot app: menu, opening hours, orders, couriers and employees. Sees reports for their locations." },
    "employee": { "title": "Employee", "scope": "One location", "body": "Takes orders, scans customer cards, adds points from ready-made templates and hands out rewards." },
    "safety_title": "Points under control",
    "safety1": "Employees add points only from set templates",
    "safety2": "A cap on manually added points and an optional daily limit per person",
    "safety3": "No one on your team can add points to their own account"
  },
  "rewards": {
    "title": "Thank your regulars with rewards",
    "body": "A product from your menu or merch with your logo — you decide what goes into the catalog, what it costs in points and how many are available.",
    "note": "Below are examples with the Loodly logo — your catalog will carry yours."
  },
  "integration": {
    "eyebrow": "Integration",
    "title": "Works with what you already use",
    "body": "You don't have to change how you issue receipts and invoices. As part of setup, we connect Loodly to the system you use every day for sales, receipts and invoices. We work out the scope with you — which is why we quote it individually.",
    "p1": "Keep issuing receipts and invoices the way you do today",
    "p2": "We agree on the integration scope with you before we quote",
    "p3": "Tell us which system you use and we'll check the options",
    "node_system": "Your sales, receipts and invoicing system",
    "node_loodly": "Loodly",
    "node_spots": "Your locations and customers",
    "diagram_alt": "Diagram: your receipts and invoicing system connected to Loodly, and Loodly connected to the tablet at your location and your customer's phone.",
    "hardware_title": "Hardware you already have",
    "hardware_body": "A phone or tablet with the Loodly Spot app is all you need — scan customer codes with the camera. You can also plug in a barcode scanner; we'll test yours with you during setup."
  },
  "faq": {
    "title": "Frequently asked questions",
    "q1": "How long does it take to get started?",
    "a1": "It mostly depends on the integration scope, the number of locations and the size of your menu. We agree on a start date with you and include it in the quote.",
    "q2": "Do I need to change my register or invoicing software?",
    "a2": "No. We connect Loodly to the system you already use for sales, receipts and invoices. Tell us what you use and we'll check the options and scope before quoting.",
    "q3": "What hardware do I need?",
    "a3": "A phone or tablet with the Loodly Spot app is enough — you scan customer cards with the camera. At a register with a computer, you can run Loodly Spot in the browser with a barcode scanner plugged in. For codes shown on a phone screen, image-based (2D) scanners work best, since laser scanners often can't read screens — we'll test yours during setup.",
    "q4": "Can customers spend my points somewhere else?",
    "a4": "No. Points collected with your brand can only be spent on your rewards — at any of your locations. Customers have one card, but each brand's points are kept separately.",
    "q5": "I have several locations, some in different cities. Will it work?",
    "a5": "Yes. A brand can have many locations across different cities. Each location has its own hours, menu and team; points and rewards are shared across the brand, and promotions can run at all locations or selected ones.",
    "q6": "Will it be my own app?",
    "a6": "Your locations appear in the Loodly app and on the Loodly website — with your logo, description, menu and your own points program. Customers use one app for every location on Loodly, but the points they collect with you can only be spent with you.",
    "q7": "Who owns the customer data?",
    "a7": "Data processing is covered by our agreement and the Loodly privacy policy. Day to day, you see your brand's orders, points and reports. We're happy to go through the details when we prepare your quote.",
    "a7_link": "Privacy Policy",
    "q8": "How long is the contract?",
    "a8": "Contract length and notice terms are agreed individually. Get in touch and we'll walk you through them."
  },
  "pricing": {
    "eyebrow": "Pricing",
    "title": "Simple pricing",
    "subtitle": "A one-time setup first, then a small monthly fee for each location.",
    "integration_label": "Setup and integration",
    "integration_period": "one-time",
    "integration_quote": "Individual quote",
    "integration_from": "from {{amount}}",
    "integration_body": "The price depends on the system we connect Loodly to and on the number of locations. We'll prepare a quote after a short call.",
    "integration_inc1": "Integration with your receipts and invoicing system",
    "integration_inc2": "Brand and admin account setup",
    "spot_label": "Each location",
    "spot_period": "per month",
    "spot_fallback": "A small monthly fee for each location",
    "spot_amount": "{{amount}} / location / month",
    "spot_body": "You pay for the locations that are active on Loodly. Opening another one? Just add it.",
    "includes_title": "What Loodly includes",
    "inc1": "Your locations and menu in the Loodly app and on the website",
    "inc2": "The Loodly Spot app for your team",
    "inc3": "The brand console in your browser",
    "inc4": "Loyalty card, rewards, promotions, birthdays and referrals",
    "inc5": "Order and points reports",
    "vat_net": "Prices exclude VAT.",
    "vat_gross": "Prices include VAT.",
    "note_quote": "We'll give you exact amounts in the quote, after a short conversation about your locations.",
    "cta": "Request a quote"
  },
  "contact": {
    "title": "Let's talk about your locations",
    "body": "Tell us how many locations you have and which system you use for receipts and invoices. We'll get back to you with a quote.",
    "email_label": "Email",
    "phone_label": "Phone",
    "cta_email": "Email us",
    "copy": "Copy address",
    "copied": "Address copied",
    "cta_phone": "Call us",
    "mail_subject": "Loodly for business — quote request"
  },
  "a11y": {
    "play": "Play animation",
    "pause": "Pause animation"
  }
}
```

#### UA

```json
{
  "meta": {
    "title": "Loodly для бізнесу — замовлення, бали й доставка",
    "description": "Онлайн-замовлення, картка з балами, нагороди, кур'єри та звіти для морозиварень, пекарень, кав'ярень і кондитерських — у зв'язці з вашою системою чеків і рахунків-фактур."
  },
  "hero": {
    "eyebrow": "Loodly для бізнесу",
    "title": "Замовлення, бали й доставка — одна система для всіх ваших закладів",
    "subtitle": "Для морозиварень, пекарень, кав'ярень і кондитерських — від одного закладу до мережі в кількох містах. Клієнти замовляють у додатку Loodly й збирають у вас бали однією карткою, а ми під'єднуємо Loodly до системи, у якій ви видаєте чеки й рахунки-фактури.",
    "chips": {
      "orders": "Онлайн-замовлення",
      "card": "Картка з балами",
      "couriers": "Кур'єри",
      "locations": "Багато закладів — одна програма",
      "integration": "Працює з вашою системою"
    },
    "cta_contact": "Поговорімо",
    "cta_story": "Подивитися, як це працює",
    "cta_pricing": "Ціни",
    "visual_alt": "Ілюстрація: панель бренду на ноутбуці, планшет із замовленнями в закладі, телефон клієнта з карткою та кур'єр на скутері."
  },
  "story": {
    "eyebrow": "Крок за кроком",
    "title": "Від створення акаунта до першої доставки",
    "subtitle": "Ось як виглядають старт і звичайний день із Loodly — однаково в пекарні, кав'ярні, морозиварні й кондитерській.",
    "step": "Крок {{n}} з {{total}}",
    "acts": {
      "setup": { "title": "Перш ніж відчинити двері", "subtitle": "Бренд і заклади ви налаштовуєте в панелі бренду в браузері, а меню — в додатку Loodly Spot." },
      "counter": { "title": "За прилавком", "subtitle": "Команда працює в додатку Loodly Spot — на телефоні, планшеті чи в браузері біля каси." },
      "beyond": { "title": "За межами прилавка", "subtitle": "Замовлення з додатка й доставки потрапляють туди ж, де й решта роботи." }
    },
    "scenes": {
      "account": {
        "kicker": "На старті",
        "title": "Створюємо акаунт вашого бренду",
        "body": "Ми додаємо ваш бренд у Loodly й надсилаємо електронною поштою запрошення першому адміністратору. Ви встановлюєте власний пароль — і ви вже в панелі бренду.",
        "alt": "Анімація: конверт із запрошенням потрапляє в ноутбук, з'являється форма входу й зелена позначка підтвердження."
      },
      "brand": {
        "kicker": "На старті",
        "title": "Розкажіть, хто ви",
        "body": "Додайте логотип, обкладинку, опис кількома мовами та міста, де працюєте. Саме так клієнти побачать вас у додатку й на сайті Loodly.",
        "alt": "Анімація: у панелі бренду з'являються банер, логотип, рядки опису й три мітки міст, а потім позначка збереження."
      },
      "spots": {
        "kicker": "На старті",
        "title": "Додайте свої заклади",
        "body": "Кожен заклад має адресу, години роботи, команду та власні налаштування самовивозу, доставки й оплати. Новий заклад спершу є чернеткою — ви активуєте його, коли все готово.",
        "alt": "Анімація: на карті міста з'являються три заклади, пов'язані з логотипом бренду, а їхні позначки стають зеленими."
      },
      "menu": {
        "kicker": "На старті",
        "title": "Заповніть меню",
        "body": "У додатку Loodly Spot додайте товари з фото, цінами й алергенами — і визначте, скільки балів дає кожен. Коли щось закінчується, команда позначає це одним дотиком.",
        "alt": "Анімація: на планшеті з'являються картки товарів — кава, круасан, морозиво й торт, — а один товар ненадовго вимикають."
      },
      "scan": {
        "kicker": "7:30",
        "title": "Скануйте картку клієнта",
        "body": "Клієнт показує в додатку QR-код або штрихкод. Ви скануєте його камерою чи сканером штрихкодів — і одразу бачите його бали у вашому бренді та нагороди, готові до видачі.",
        "alt": "Анімація: сканер зчитує штрихкод на телефоні клієнта, після чого з'являються зелене підтвердження й монета з балами."
      },
      "points": {
        "kicker": "Четвер, 10:00",
        "title": "Бали за покупки — іноді подвійні",
        "body": "Працівник нараховує бали за готовими шаблонами, а за замовлення в додатку бали нараховуються самі. Хочете пожвавити спокійніші години? Налаштуйте акцію, наприклад подвійні бали щочетверга з 10 до 14, — в одному закладі чи в усіх.",
        "alt": "Анімація: стрілка годинника входить у виділені години 10–14, з'являється знак «помножити на два», а монети падають на картку парами."
      },
      "rewards": {
        "kicker": "13:00",
        "title": "Задоволені клієнти, які повертаються",
        "body": "Клієнти обмінюють бали на ваші нагороди: каву, випічку, кульку морозива чи річ із вашим логотипом — у додатку або просто біля каси. Бали, зібрані у вас, витрачаються лише у вас — у будь-якому вашому закладі.",
        "alt": "Анімація: з подарункової коробки вистрибує чашка з логотипом, двоє клієнтів усміхаються, а вгору злітають сердечка."
      },
      "moreOrders": {
        "kicker": "15:00",
        "title": "Замовлення навіть тоді, коли клієнта немає біля дверей",
        "body": "Клієнти замовляють у додатку й на сайті Loodly — з дому, з роботи чи дорогою, із самовивозом або доставкою. Новини вашого закладу, бали на день народження й запрошення друзів нагадують про вас між візитами.",
        "alt": "Анімація: до закладу летять замовлення з дому, офісу й парку, а на прилавку росте стос замовлень."
      },
      "onlineOrders": {
        "kicker": "17:30",
        "title": "Онлайн-замовлення одразу на планшет",
        "body": "Нове замовлення з'являється в додатку Loodly Spot зі звуковим сигналом. Ви приймаєте його, готуєте й позначаєте як готове, а клієнт бачить кожен крок.",
        "alt": "Анімація: замовлення летить із телефона клієнта на планшет у закладі, дзвенить дзвіночок, замовлення приймають, а статус змінюється на «готове»."
      },
      "couriers": {
        "kicker": "18:00",
        "title": "Кур'єр у дорозі — клієнт бачить його на карті",
        "body": "Кур'єри з додатка Loodly Courier подають заявки до вашого закладу, а ви вирішуєте, з ким працювати, і встановлюєте оплату за доставку. Призначте замовлення — і клієнт стежить за ним наживо.",
        "alt": "Анімація: кур'єр їде від закладу до дому клієнта, а наприкінці з'являються позначка й зелене підтвердження."
      }
    }
  },
  "benefits": {
    "title": "Що дає вам Loodly",
    "subtitle": "Інструменти для щоденної роботи — для вас, вашої команди й ваших клієнтів.",
    "loyalty": { "title": "Програма лояльності без паперу", "body": "Замість карток зі штампами — одна картка в телефоні клієнта. Ви обираєте нагороди та їхню ціну в балах, а клієнт отримує причину повертатися саме до вас." },
    "orders": { "title": "Власний канал замовлень", "body": "Клієнти замовляють із вашого меню із самовивозом або доставкою та платять онлайн чи на місці — як ви налаштуєте для кожного закладу." },
    "locations": { "title": "Багато закладів — одна програма", "body": "Усі заклади в одній панелі, навіть у різних містах. Бали й нагороди діють у кожному з них, а кожен заклад має власні години, меню й команду." },
    "promotions": { "title": "Акції, дні народження й запрошення", "body": "Подвійні бали у вибрані дні та години, бали на день народження й бонус за запрошення друга. Ви вирішуєте, чи нараховувати бали — і скільки." },
    "couriers": { "title": "Кур'єри та відстеження доставки", "body": "Працюйте з кур'єрами, яких ви схвалили. Клієнт бачить доставку на карті наживо." },
    "reports": { "title": "Звіти для закладу й усього бренду", "body": "PDF-звіти про замовлення, бали, доставки та входи персоналу для кожного закладу, а також підсумки замовлень і балів для всього бренду." }
  },
  "roles": {
    "title": "Уся команда — кожен на своєму місці",
    "subtitle": "Кожен входить через власний акаунт і бачить лише те, що потрібно для роботи, — в одному закладі чи в кількох.",
    "brandAdmin": { "title": "Адміністратор бренду", "scope": "Увесь бренд, усі заклади", "body": "Налаштовує бренд, заклади, нагороди, акції та команду в панелі бренду. Бачить звіти всього бренду й може працювати в будь-якому закладі в додатку Loodly Spot." },
    "locationAdmin": { "title": "Адміністратор закладу", "scope": "Один або кілька закладів", "body": "Керує своїми закладами в додатку Loodly Spot: меню, години роботи, замовлення, кур'єри й працівники. Бачить звіти своїх закладів." },
    "employee": { "title": "Працівник", "scope": "Один заклад", "body": "Приймає замовлення, сканує картки клієнтів, нараховує бали за готовими шаблонами й видає нагороди." },
    "safety_title": "Бали під контролем",
    "safety1": "Працівники нараховують бали лише за встановленими шаблонами",
    "safety2": "Ліміт ручного нарахування й необов'язковий денний ліміт на людину",
    "safety3": "Ніхто з команди не може нарахувати бали на власний рахунок"
  },
  "rewards": {
    "title": "Подякуйте постійним клієнтам нагородою",
    "body": "Продукт із вашого меню або річ із вашим логотипом — ви вирішуєте, що буде в каталозі, скільки це коштує в балах і скільки штук доступно.",
    "note": "Нижче — приклади з логотипом Loodly; у вашому каталозі буде ваш логотип."
  },
  "integration": {
    "eyebrow": "Інтеграція",
    "title": "Працює з тим, чим ви вже користуєтеся",
    "body": "Вам не потрібно змінювати спосіб, у який ви видаєте чеки й рахунки-фактури. Під час впровадження ми під'єднуємо Loodly до системи, якою ви щодня користуєтеся для продажів, чеків і рахунків-фактур. Обсяг інтеграції погоджуємо разом — тому й розраховуємо її індивідуально.",
    "p1": "Чеки й рахунки-фактури — як і раніше",
    "p2": "Обсяг інтеграції погоджуємо з вами ще до розрахунку ціни",
    "p3": "Напишіть, якою системою користуєтеся, — ми перевіримо можливості",
    "node_system": "Ваша система продажів, чеків і рахунків-фактур",
    "node_loodly": "Loodly",
    "node_spots": "Ваші заклади й клієнти",
    "diagram_alt": "Схема: ваша система чеків і рахунків-фактур під'єднана до Loodly, а Loodly — до планшета в закладі й телефона клієнта.",
    "hardware_title": "Обладнання, яке у вас уже є",
    "hardware_body": "Достатньо телефона або планшета з додатком Loodly Spot — коди клієнтів скануються камерою. Можна також під'єднати сканер штрихкодів; ми перевіримо ваш під час впровадження."
  },
  "faq": {
    "title": "Часті запитання",
    "q1": "Скільки часу займає запуск?",
    "a1": "Це залежить передусім від обсягу інтеграції, кількості закладів і розміру меню. Дату запуску погоджуємо разом і вказуємо в розрахунку.",
    "q2": "Чи потрібно міняти касу або програму для рахунків-фактур?",
    "a2": "Ні. Ми під'єднуємо Loodly до системи, якою ви вже користуєтеся для продажів, чеків і рахунків-фактур. Напишіть, що у вас, — перевіримо можливості й обсяг інтеграції ще до розрахунку.",
    "q3": "Яке обладнання потрібне?",
    "a3": "Достатньо телефона чи планшета з додатком Loodly Spot — картки клієнтів скануються камерою. Біля каси з комп'ютером можна відкрити Loodly Spot у браузері й під'єднати сканер штрихкодів. Для кодів на екрані телефона найкраще підходять імеджеві (2D) сканери, бо лазерні часто їх не зчитують, — ваш сканер перевіримо під час впровадження.",
    "q4": "Чи можуть клієнти витратити мої бали деінде?",
    "a4": "Ні. Бали, зібрані у вашому бренді, клієнти обмінюють лише на ваші нагороди — у будь-якому вашому закладі. Картка одна, але бали кожного бренду рахуються окремо.",
    "q5": "У мене кілька закладів, зокрема в різних містах. Це працюватиме?",
    "a5": "Так. Бренд може мати багато закладів у різних містах. Кожен заклад має власні години, меню й команду; бали й нагороди спільні для всього бренду, а акції можна запускати в усіх закладах або у вибраних.",
    "q6": "Це буде мій власний додаток?",
    "a6": "Ваші заклади працюють у додатку й на сайті Loodly — з вашим логотипом, описом, меню та власною програмою балів. Клієнти мають один додаток для всіх закладів у Loodly, але бали, зібрані у вас, витрачають лише у вас.",
    "q7": "Кому належать дані клієнтів?",
    "a7": "Обробку даних регулюють договір і політика конфіденційності Loodly. Щодня ви бачите замовлення, бали та звіти свого бренду. Деталі охоче обговоримо під час розрахунку.",
    "a7_link": "Політика конфіденційності",
    "q8": "На який термін укладається договір?",
    "a8": "Термін договору й умови розірвання погоджуємо індивідуально. Напишіть нам — усе пояснимо."
  },
  "pricing": {
    "eyebrow": "Ціни",
    "title": "Прості ціни",
    "subtitle": "Спочатку одноразове впровадження, далі — невелика щомісячна плата за кожен заклад.",
    "integration_label": "Впровадження та інтеграція",
    "integration_period": "одноразово",
    "integration_quote": "Індивідуальний розрахунок",
    "integration_from": "від {{amount}}",
    "integration_body": "Ціна залежить від системи, до якої ми під'єднуємо Loodly, і від кількості закладів. Розрахунок підготуємо після короткої розмови.",
    "integration_inc1": "Інтеграція з вашою системою чеків і рахунків-фактур",
    "integration_inc2": "Створення бренду й акаунта адміністратора",
    "spot_label": "Кожен заклад",
    "spot_period": "щомісяця",
    "spot_fallback": "Невелика щомісячна плата за кожен заклад",
    "spot_amount": "{{amount}} / заклад / місяць",
    "spot_body": "Ви платите за заклади, активні в Loodly. Відкриваєте ще один? Просто додайте його.",
    "includes_title": "Що входить у Loodly",
    "inc1": "Ваші заклади й меню в додатку та на сайті Loodly",
    "inc2": "Додаток Loodly Spot для команди",
    "inc3": "Панель бренду в браузері",
    "inc4": "Картка з балами, нагороди, акції, дні народження й запрошення",
    "inc5": "Звіти про замовлення та бали",
    "vat_net": "Ціни без ПДВ.",
    "vat_gross": "Ціни з ПДВ.",
    "note_quote": "Точні суми назвемо в розрахунку — після короткої розмови про ваші заклади.",
    "cta": "Запросити розрахунок"
  },
  "contact": {
    "title": "Поговорімо про ваші заклади",
    "body": "Напишіть, скільки у вас закладів і якою системою ви користуєтеся для чеків і рахунків-фактур. Ми повернемося з розрахунком.",
    "email_label": "Ел. пошта",
    "phone_label": "Телефон",
    "cta_email": "Напишіть нам",
    "copy": "Скопіювати адресу",
    "copied": "Адресу скопійовано",
    "cta_phone": "Зателефонувати",
    "mail_subject": "Loodly для бізнесу — запит на розрахунок"
  },
  "a11y": {
    "play": "Відтворити анімацію",
    "pause": "Призупинити анімацію"
  }
}
```

---

## 4. Lottie storyboard (10 scenes)

### 4.1 Global spec

| Item | Value |
|---|---|
| Canvas | 480×360 (4:3), transparent, drawn to sit on a cream-soft `#fff1e6` card. Safe margin 24 px (x 24–456, y 24–336) |
| Frame rate | 30 fps; `ip` = 0, `op` = seconds × 30 |
| Loop | The values at frame `op` equal those at frame 0 for every looping property. The last 10–15 frames return elements to their start state, so the loop has no visible jump |
| Poster | `"markers":[{"tm":<frame>,"cm":"poster","dr":0}]` on a resting frame: everything visible, every trim at 100. The player calls `anim.goToAndStop("poster")`, which resolves the marker by name in lottie-web 5.13 |
| Allowed | Shape layers (`ty:4`), null layers (`ty:3`) for parenting and orbits, groups, `rc`/`el`/`sh`, `fl`/`st` (with dashes), `tm` trim paths, `tr`, parenting, hold keyframes (`h:1`), animated fill or stroke colour, and spatial tangents `to`/`ti` for arcs |
| Forbidden | Text layers, images, expressions (`lottie_light` has none), effects, masks, mattes, 3D. Path morphs: avoid them; draw smiles with a trim instead |
| Text | None in the animation. Text is shown as skeleton bars (h 8, r 4, espresso at 14%; title bars h 10 at 22%). Glyphs such as "×2" are stroked paths |
| Budget | At most 30 layers per file; target ≤ 30 KB minified per file; the build **fails above 60 KB**. No stroke under 2 px at 1×. Nothing flashes more than 3 times per second |
| Rhythm | Entrances 10–18 f, holds at least 12 f, exits 8–12 f, staggers 4–10 f |

**Easing presets.** Each is a cubic-bezier written as `o{x,y}` on the current keyframe and `i{x,y}` on the next.

| Preset | Curve | Use |
|---|---|---|
| `inOut` | .42,0,.58,1 | default |
| `out` | .22,1,.36,1 | entrances |
| `in` | .55,0,1,.45 | exits |
| `back` | .34,1.56,.64,1 | pops with overshoot |
| `linear` | 0,0,1,1 | clock hands, orbits, wheels |

A `pop` is scale 0 → 100 using `back` over 10–12 f.

### 4.2 Palette and shared props (`scripts/lottie/palette.mjs`, `props.mjs`)

**Palette (`tailwind.config.ts`):**
- berry `#c026a3` · berry-light `#e05bc4` · berry-dark `#8a1673`
- espresso `#3a1526` · espresso-light `#5c2a3d` · espresso-dark `#25060f`
- strawberry `#ff6f91` · pistachio `#8bc34a` · mango `#ffb020`
- cream `#fff8f0` · cream-soft `#fff1e6` · cream-deep `#ffe6d5` · white

**Extra colours:**
- Food, from `IceCreamGraphics`: wafer `#e8a866`, crust `#d18f4e`, wafer-line `#b9773a`, cherry `#e11d48`.
- Logo only: red `#EC2828`, cream `#FFF7F0`.

**Props.** Dimensions are at scale 1.

| Prop | Construction |
|---|---|
| `phone` | Body 112×208 r20 espresso; screen 100×196 r14 cream; speaker 26×5 espresso-light near the top |
| `tablet` | Body 250×176 r16 espresso; screen 234×160 r10 cream. Optional stand: espresso-light trapezoid plus a 120×8 base |
| `laptop` | Lid 264×170 r12 espresso; screen 248×154 r6 cream; base 312×12 r6 espresso-light |
| `skeleton(w)` | h 8 r4 espresso at 14% (title: h 10 at 22%) |
| `pill(w,h)` | berry, r = h/2, inner white skeleton at 70% |
| `coin(r=14)` | mango ellipse, cream inner ring stroke 2.5 at r 9, white highlight 6×4 at 50% |
| `pin` | berry teardrop 24×32 with a cream dot r 5, plus a shadow ellipse in espresso at 12% |
| `check(r)` | pistachio circle; white stroke 0.22·r, round caps, through (−.45r,0) → (−.1r,.35r) → (.5r,−.35r); trim end 0 → 100 |
| `storefront` | white body 84×62 r6; berry awning 96×20 r6 with four cream stripes; espresso-light door 18×30; strawberry window at 25% |
| `mark(scale)` | `public/loodly-mark.svg` ported 1:1: mango cone triangle, cream inset triangle, eight cream scoop circles with `#EC2828` stroke 1.6, two red ellipses with cream inner ellipses. The clipPath lattice is dropped. Pivot (50,55) |
| `face(r=22, color)` | coloured ellipse; espresso eyes 4×6 at (±7,−4); smile arc stroke 3, round caps, drawn with a trim |
| `person(shirt, skin, {glasses, whiteHair})` | shoulders 56×30 r15 in the shirt colour, plus `face`. Hair is a cap path (white for the older customer). Glasses are two espresso rings stroke 2 |
| `heart` | strawberry path, 18 px |
| `bell` | mango path, 30 px, with clapper; pivot at the top |
| `gift` | berry base 64×46; berry-dark lid 72×16; cream ribbons; bow of two stroked cream loops |
| `bag` | wafer body 34×40, crust handle arc, cream sticker dot |
| `house` | white body 64×50, berry roof triangle, espresso-light door |
| `office` | espresso-light 54×70 with 6 cream windows |
| `tree` | pistachio circle r 22 over an espresso-light trunk 8×22 |
| `courier` | wheels r 10 stroked espresso w4; berry body 14×26; espresso-light head; mango helmet arc; mango box 26×22 with a cream dot |
| `clock(r=40)` | white face stroked espresso w4; 4 ticks; berry wedge at 25% from −60° to +60° (10:00–14:00 on a 12-hour dial); hand 5×32 pivoting at the centre; centre dot |
| `x2Badge` | berry circle r 18 with white strokes w3.5 forming "×2" |
| `barcode` | 16 espresso bars, height 46, widths 1–3 |
| `scannerGun` | espresso-light head 74×34 r12; strawberry nose 10×28; espresso handle 24×58 rotated 15° |
| `beam` | strawberry triangle at 35% |
| `soundArcs` | three berry arcs, stroke 3 |
| `tapRipple` | berry stroke ring; scale 40 → 160 and opacity 80 → 0 over 14 f |
| `envelope` | white body 96×64 r8, espresso stroke at 15%; mango flap anchored at its top edge; berry seal r 9 |
| `map` | cream-deep 410×270 r22; white roads stroke 12–16 with round caps; pistachio park blob at 35% |
| `sparkle` | mango four-point star 14 px |

### 4.3 Scene list and grouping

```ts
// app/components/lottie/scenes.ts
export const SCENE_NAMES = ["account","brand","spots","menu","scan","points","rewards","moreOrders","onlineOrders","couriers"] as const;
export type SceneName = (typeof SCENE_NAMES)[number];
export const STORY_ACTS = [
  { id: "setup",   scenes: ["account","brand","spots","menu"] },
  { id: "counter", scenes: ["scan","points","rewards"] },
  { id: "beyond",  scenes: ["moreOrders","onlineOrders","couriers"] },
] as const;
```

The files are `public/lottie/<name>.json`, with exactly these names.

### 4.4 Scenes

Coordinates are canvas pixels and "f" means frames.

**1. `account`: 4 s, op 120, poster 104.**
- **Objects:**
  - A strawberry blob 320×240 at 18% behind everything; a `laptop` at (240,180).
  - The sign-in form on the screen: title skeleton 90 at (240,128); email field 150×20 at (240,156) with a berry fill bar at 35%, anchored left; password field at (240,184) with six dots r 3.5, 12 px apart; `pill` 150×22 at (240,214).
  - An `envelope` starting at (70,60), rotated −14°.
  - A `check` r 20 at (318,118).
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 8–26 | Envelope moves to (240,150) and rotates to 0 (`out`) |
  | 26–34 | Flap flips (scaleY 100 → −100 about its top edge) |
  | 34–44 | Envelope scales 100 → 20 and fades out (`in`), diving into the screen |
  | 40–54 | Form fades in and rises 14 px (`out`) |
  | 54–68 | Email fill grows (scaleX 0 → 100) |
  | 66–80 | Password dots pop, 2 f apart |
  | 82–90 | Button presses (100 → 94 → 100) |
  | 88–100 | Check pops; its trim draws 92–102 |
  | 110–119 | Form and check fade out; values reset |

**2. `brand`: 5 s, op 150, poster 118.**
- **Objects:**
  - `laptop` at (240,180); the screen spans x 116–364, y 93–247.
  - Berry-dark sidebar 46×154 at (139,170) with four nav skeletons.
  - Strawberry banner at 45%, 178×46, at (263,122), anchored at its top edge.
  - Logo circle r 20 at (196,146): white with a berry stroke 3 and a generic croissant icon (not a real brand).
  - Three description skeletons (150, 130, 90) from x 178 at y 178, 192, 206.
  - Three city pills 44×16 in cream-deep, each with a berry dot, at x 196, 244, 292, y 228.
  - Save `pill` 34×18 at (340,228); `check` r 14 at (356,100).
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 10–26 | Banner scaleY 0 → 100 (`out`) |
  | 22–40 | Logo pops (0 → 110 → 100); its icon rotates −25° → 0 |
  | 40–68 | Lines grow (scaleX from the left), 8 f apart |
  | 70–96 | Pills pop at 70, 78, 86 (`back`); their dots drop 6 px |
  | 98–108 | Save pressed |
  | 104–116 | Check pops and draws |
  | 130–149 | Fade out and reset |

**3. `spots`: 5 s, op 150, poster 120.**
- **Objects:**
  - `map` at (240,185) with roads (50,205)→(430,205) and (120,60)→(330,330), and a park at (390,90).
  - Hub: a white circle r 26 with a berry stroke and `mark(0.42)`, at (240,190).
  - Storefronts at scale 0.8, anchored bottom-centre: A (120,165), B (360,155), C (300,300).
  - Each storefront has two stacked status dots r 7: draft (espresso 30%) and active (pistachio, starting at opacity 0).
  - Dashed berry connectors from the hub to each storefront (stroke 3, dash 6/6), drawn with a trim.
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 4–16 | Hub pops |
  | 14–30 / 24–38 | A: connector draws / store pops |
  | 32–48 / 42–56 | B: connector draws / store pops |
  | 50–66 / 60–74 | C: connector draws / store pops (`back`) |
  | 80, 90, 100 | Each active dot fades in over 6 f; a pistachio pulse ring scales 100 → 260 and fades over 16 f |
  | 134–149 | Stores scale out, connectors fade, hub scales out |

**4. `menu`: 5 s, op 150, poster 72.**
- **Objects:**
  - `tablet` at (240,182), with a white header bar, a berry dot and a skeleton.
  - Four white product cards 104×58 r10: 1 (183,155), 2 (297,155), 3 (183,222), 4 (297,222). Each card has:
    - an icon tile 40×40 in cream-soft at the card's left (coffee cup, croissant, cone, cake slice);
    - a title skeleton 40;
    - a mango price pill 26×12;
    - a tiny coin r 6 (points per product);
    - a toggle at (cx+36, cy+16): a pistachio track 22×12 over an espresso 25% track, and a white knob r 5 at +5.
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 8, 16, 24, 32 | Cards enter: fade in and slide x +24 → 0 (`out`, 12 f); icons pop 6 f later (`back`) |
  | 50–60 | Skeletons, price pills and coins grow |
  | 84–98 | Tap ripple on card 4's toggle at (333,238) |
  | 88–94 | Knob moves +5 → −5; pistachio track fades out; card 4 icon dims to 35% |
  | 114–128 | Second ripple; toggle back on |
  | 132–149 | Cards fade out, 2 f apart |

**5. `scan`: 4 s, op 120, poster 80.**
- **Objects:**
  - `phone` at scale 90% at (150,205), resting at −8°. Screen: a berry header pill 70×16; a white barcode card 80×58 holding the `barcode`; an account skeleton 60.
  - `scannerGun` at (360,170), resting at 12°; its nose is near (318,166).
  - `beam` from the nose to the barcode edges; a scan line in strawberry, 86×3.
  - A pistachio success chip 84×28 at (150,78) with a check inside.
  - A `coin` that pops at (206,78).
  - `soundArcs` near (300,140).
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 10–26 | Phone slides in (x −80 → 0, rotation −24° → −8°, `out`) |
  | 18–32 | Scanner slides in (x +90 → 0, rotation 30° → 12°) |
  | 32–38 | Beam fades to 60% |
  | 36–60 | Scan line sweeps y −22 → +22 → −22 relative to the barcode (`inOut`) |
  | 60–72 | Arcs pulse, 3 f apart |
  | 62–64 | Beam off |
  | 64–76 | Chip pops (`back`); its check draws 68–78 |
  | 76–92 | Coin pops and rises to y 46, fading 86–92 |
  | 96–119 | Chip fades; phone and scanner exit (`in`) |

**6. `points`: 6 s, op 180, poster 100.**
- **Objects:**
  - `phone` at (180,190) holding a white points card 88×120:
    - a brand avatar r 12 in cream-deep with a croissant, at (180,138);
    - a coin cluster at (180,170);
    - a progress track 72×10 at (180,206), with a mango fill anchored left at x 144.
  - `clock` at (360,150). The hand rotation is **linear 180° → 540° over 0–180**, so the angle at frame f is 180 + 2f. The hand is inside the 10:00–14:00 wedge (300°–420°) for frames 60–120.
  - `x2Badge` at (402,104).
  - Coins fly (300,336) → (240,250) → (180,180), using `to`/`ti` for the arc. Each scales to 70 and fades over its last 4 f.
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 30, 50 | Single coins arrive; fill 12%, then 24% |
  | 58–66 | Badge pops; wedge opacity 25% → 45% |
  | 80/84, 100/104 | Coin pairs arrive; fill 48%, then 72% |
  | 118–124 | Badge out; wedge back to 25% |
  | 140, 160 | Single coins; fill 86%, then 100% |
  | 160–170 | `check` r 12 pops next to the bar |
  | 170–179 | Fill and check fade; the fill scaleX holds back to 0 at 179 |

**7. `rewards`: 5 s, op 150, poster 78.**
- **Layer order, back to front:** shadow 200×18 in espresso 8% → mug → gift base → lid → sparkles → people → hearts.
- **Objects:**
  - `gift` base at (240,250), lid at (240,222).
  - Mug (cream body, berry handle ring, `mark(0.22)`) starting inside the box at (240,250), scale 40, opacity 0.
  - Older customer `person(pistachio, cream-deep, {glasses, whiteHair})` at (110,236).
  - Younger customer `person(mango, wafer)` at (370,236).
  - Sparkles at (190,150), (292,140), (250,118).
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 8–28 | Box wobbles 0 → −5° → 5° → 0 (pivot bottom-centre) |
  | 30–42 | Lid moves to (196,180) and rotates −22° (`out`) |
  | 36–56 | Mug rises to y 160 at scale 100 (`back`) |
  | 48–62 | Sparkles twinkle (scale 0 → 100 → 0, rotation 0 → 45°), 4 f apart |
  | 50, 56 | People pop (`back`); smiles draw 58–70 |
  | 64–72 | The younger customer hops 8 px |
  | 68–110 | Six hearts rise 64 px each, fading in then out, 10 f apart on alternating sides |
  | 116–149 | Mug sinks back, lid returns, people scale out, trims reset |

**8. `moreOrders`: 5 s, op 150, poster 100.**
- **Objects:**
  - `storefront` at scale 1.6, anchored bottom-centre at (240,312); its door centre is near (240,282).
  - Three sources:
    - `house` at (84,92) with a mini phone (`phone` at scale 0.25) beside it;
    - `office` at (240,70) with a mini phone;
    - `tree` at (396,92) with a mini phone.
  - Three order bubbles: white 34×26 r8 with a berry stroke 2 and a mango `bag` at scale 0.4.
  - A ticket stack at (372,300): white 30×38 tickets with skeleton lines.
  - A mango `bell` above the door at (240,214).
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 0–14 | Store grows scaleY 0 → 100 from the bottom (`back`) |
  | 14–30 | Sources pop, 5 f apart |
  | 30–50 / 40–60 / 50–70 | Bubbles A, B and C fly in arcs (`to`/`ti`) to the door, scale 100 → 60 and fade out on arrival |
  | 48, 58, 68 | A ticket drops onto the stack and bounces 4 px |
  | 72–90 | Bell wiggles 0 → 15° → −15° → 0 |
  | 90–135 | Awning sways ±1.5° (`inOut`) |
  | 135–150 | Tickets and sources fade; store holds |

**9. `onlineOrders`: 5 s, op 150, poster 128.**
- **Objects:**
  - Customer `phone` at scale 0.8 at (100,210), with a berry order `pill` at (100,250).
  - `tablet` at (320,190): two grey ticket rows 200×30 at y 186 and 222, a slot for the new row at (320,150), and a `bell` at the top right of the screen.
  - A flying ticket 66×40 with a berry stroke 2.
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 10–20 | Phone button presses, with a `tapRipple` |
  | 18–48 | Ticket flies (100,200) → (210,70) → (320,150) using `to`/`ti`, rotation −10° → 0 (`inOut`) |
  | 44–52 | Flying ticket fades out |
  | 46–58 | New row grows 40 → 100 (`back`) |
  | 52–80 | Bell rings (rotation 0, 16, −16, 12, −12, 0); sound arcs pulse |
  | 82–96 | Pistachio accept pill pops at (392,150); ripple 90–104; the row stroke colour animates berry → pistachio |
  | 98, 108, 118 | Status dots r 5 pop (berry, mango, pistachio), joined by trim lines |
  | 134–149 | Reset |

**10. `couriers`: 6 s, op 180, poster 152.**
- **Objects:**
  - `map` at (240,182).
  - A white road (stroke 16) along S(100,268) → (180,268) → (240,200) → (330,170) → E(392,108).
  - A berry route over the road (stroke 5, round caps), trim end 0 → 100 during 10–46.
  - `storefront` at scale 0.7 near S; `house` near E.
  - `courier` at scale 0.7.
- **Beats:**

  | Frames | Beat |
  |---|---|
  | 48, 70, 90, 112, 136 | Courier position keyframes, 8 px above the road: (100,262), (180,262), (238,204), (330,166), (390,104). Wheels rotate linearly; the rider bobs ±3° |
  | 136–148 | House door colour animates to pistachio; a `pin` drops to (400,52) (`back`) |
  | 144–156 | `check` r 16 pops at (436,64) |
  | 164–179 | Courier, route, pin and check fade; the courier position holds at S at 179 |

Total running time is 50 s across the 10 loops.

### 4.5 Minimal JSON shape the generator emits

```json
{"v":"5.7.4","fr":30,"ip":0,"op":120,"w":480,"h":360,"nm":"scan","ddd":0,"assets":[],
 "markers":[{"tm":80,"cm":"poster","dr":0}],
 "layers":[{"ddd":0,"ind":1,"ty":4,"nm":"check","sr":1,"st":0,"ip":0,"op":120,"bm":0,"ao":0,
  "ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[150,78,0]},"a":{"a":0,"k":[0,0,0]},
        "s":{"a":1,"k":[{"t":64,"s":[0,0,100],"o":{"x":[0.34],"y":[1.56]},"i":{"x":[0.64],"y":[1]}},
                        {"t":76,"s":[100,100,100]}]}},
  "shapes":[{"ty":"gr","nm":"badge","it":[
    {"ty":"el","p":{"a":0,"k":[0,0]},"s":{"a":0,"k":[40,40]},"d":1},
    {"ty":"fl","c":{"a":0,"k":[0.545,0.765,0.29,1]},"o":{"a":0,"k":100},"r":1},
    {"ty":"tr","p":{"a":0,"k":[0,0]},"a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"r":{"a":0,"k":0},"o":{"a":0,"k":100}}]}]}]}
```

**Rules for the generator:**
- **Group items.** Inside a group, shape items come first, then trim, then stroke, then fill, and `tr` comes **last**.
  - Earlier items paint on top, so the stroke sits above the fill.
  - A fill or stroke applies to the shapes listed before it in the same group.
- **Layer order.** The first layer in `layers` is the frontmost. Authors list layers back to front and the helper reverses them on output.
- **Values.**
  - Colours are 0–1 floats.
  - The last keyframe has only `t` and `s`.
  - Layer `ks` values are 3D (`p`, `a`, `s`); group `tr` values are 2D.
  - Scale is in percent.
  - `sk`/`sa` are optional.
- **Motion.**
  - Position keyframes without `to`/`ti` interpolate linearly per axis; add `to`/`ti` for arcs.
  - Set the layer anchor `a` and position `p` on the pivot (for example bottom-centre for pops) before scaling or rotating.

---

## 5. Reward illustrations and the mark

### 5.1 `app/components/brand/LoodlyMark.tsx` (build first; shared)

- **Output.** `LoodlyMark(props: SVGProps<SVGSVGElement> & { title?: string; detail?: boolean })` returns an `<svg viewBox="24 14 52 80">` holding the shapes of `public/loodly-mark.svg`: the cone and its inset, eight scoop circles, and two red rings with cream centres.
- **Nesting.** Because it is an `<svg>`, it nests inside other SVGs with `x`, `y`, `width` and `height` props.
- **Accessibility.** It is `aria-hidden` unless `title` is given; then it gets `role="img"` and a `<title>`.
- **`detail` (default false)** adds the waffle lattice clipped by a clipPath. The id comes from `useId().replace(/:/g, "")`, because the source file's fixed `id="coneClip"` collides when the mark appears several times on a page. Use `detail` only at 64 px or larger.
- **Wordmark.** The "loodly" wordmark appears only on the tote and the T-shirt. It is `<text>` with `fontWeight={800}`, fill `#EC2828` and `className="font-sans"`, so it inherits Geist through CSS. A `font-family="var(...)"` presentation attribute does **not** resolve CSS variables.

### 5.2 `app/components/rewards/RewardIllustrations.tsx`

**Common rules:**
- `viewBox="0 0 160 160"`, flat fills, no outlines, matching `IceCreamGraphics`.
- One white highlight at 25–50%.
- Ground shadow ellipse at cx 80, cy 146, rx 46, ry 6, espresso at 8%.
- At most four palette colours per item, plus the logo colours.
- **Merch** always carries the mark: on cream or white directly, or on a cream roundel when the surface is coloured. **Treats** carry no Loodly mark, because they are the brands' own products.
- Every illustration is `aria-hidden`; the visible name is the label.

| id | Kind | Composition | Colours | Logo |
|---|---|---|---|---|
| `umbrella` | merch | Open canopy tilted −8°: six scalloped panels seen slightly from below, an espresso tip, an espresso-light shaft (stroke 4) and a berry-dark J-handle (stroke 6, round cap). Two berry-light raindrops at 50% | panels alternate berry and cream | 26 px mark on the centre cream panel |
| `mug` | merch | Body 64×70 r10 with a cream-deep bottom band; a berry rim band h 8; a handle ring as a berry stroke 9; two steam curls in espresso 20%, stroke 4 | cream body | 34 px mark centred |
| `tote` | merch | Canvas slightly wider at the bottom (78→84 × 88, r6); two berry strap handles (stroke 6); dashed hem line in espresso 20%; soft fold shadow | cream-deep | 38 px mark on a cream roundel r 24, plus the "loodly" wordmark at 14 px |
| `cap` | merch | Three-quarter view: crown dome with seams in berry-dark 30%, top button in berry-dark, curved visor | strawberry crown, berry visor | 28 px mark on a cream roundel on the front panel |
| `thermal` | merch | Tall body 52×96 r14; cream-deep lid with an espresso-dark sip slot; berry sleeve band h 22; white highlight strip at 25% | espresso body | 24 px mark on a cream roundel on the sleeve |
| `tshirt` | merch | Flat-lay tee silhouette on a berry 12% disc; berry rib collar; sleeve hems in berry 40%; light fold shadow | cream tee | 34 px mark on the chest plus a 10 px wordmark |
| `coffee` | treat | Three-quarter cup and saucer: crema ellipse in crust `#d18f4e` with a cream latte heart, steam | berry cup, cream-deep saucer | none |
| `croissant` | treat | Five-segment crescent; segment lines in crust; cream-deep highlights at 60%; small white plate at 70% | wafer `#e8a866` | none |
| `scoop` | treat | Single scoop on a waffle cone in the `ConeGraphic` style; wafer-line lattice `#b9773a`; a drip; cherry `#e11d48` | strawberry scoop, wafer cone | none |

The same file exports:

```ts
export type RewardId = "umbrella" | "mug" | "tote" | "cap" | "thermal" | "tshirt" | "coffee" | "croissant" | "scoop";
export const REWARD_EXAMPLES: { id: RewardId; kind: "merch" | "treat"; Illustration: (p: SVGProps<SVGSVGElement>) => JSX.Element }[];
```

### 5.3 `app/components/rewards/RewardGrid.tsx`

- **Props:** `{ ids?: RewardId[]; variant?: "landing" | "compact" }`. It reads names from `rewards.items.<id>` and group titles from `rewards.group_menu` / `rewards.group_merch` in `common.json`.
- **`landing`:** two groups (treats first, then merch), each an h3 over a `<ul>`.
  - Tile: `rounded-3xl bg-white p-5 border border-berry/10 text-center`; the illustration is `h-28 w-28 mx-auto`; the name is `text-base font-bold text-espresso`.
  - Hover lift uses `motion-safe:hover:-translate-y-1`.
- **`compact`:** a single `<ul>`, 3 columns from `sm` and 6 from `lg`; illustration `h-20 w-20`; name `text-sm font-semibold`.
- **Tint rule:** never put berry text on a berry tint; chips use `bg-cream-soft text-berry-dark` (7.8:1).

---

## 6. Files, ownership and tooling

### 6.1 File plan

**Build order:** shared pieces first (`LoodlyMark`, `RewardIllustrations`, `RewardGrid`, `TreatGraphics`, `site-config`), then the landing and the pitch in parallel, with the animations alongside.

| Owner | Path | Change |
|---|---|---|
| Landing | `app/components/brand/LoodlyMark.tsx` | New (§5.1). **First** |
| Landing | `app/components/rewards/RewardIllustrations.tsx`, `RewardGrid.tsx` | New (§5.2–5.3). **First** |
| Landing | `app/components/TreatGraphics.tsx` | New (§2.2). **First** |
| Landing | `app/lib/site-config.ts` | New: `BUSINESS_CONTACT`, `hasBusinessContact`, `SOCIAL_LINKS`, `APP_LINKS` (§3.3). **First** |
| Landing | `app/page.tsx` | New section order; `id="main"` |
| Landing | `app/layout.tsx` | Metadata only (§2.5) |
| Landing | `app/globals.css` | Reduced-motion block |
| Landing | `app/components/LandingSections.tsx` | Hero, HowItWorks, Features, AppSection, BottomCta and Footer changed. Stats, FlavorOfDay and QrPlaceholder deleted. **Keep the `Footer` export name**: not-found, spots, account, policy and terms import it |
| Landing | `app/components/landing/{Categories,Loyalty,Rewards,Teaser,PointsWalletMock}.tsx` | New |
| Landing | `app/components/Header.tsx` | §2.1 Header |
| Landing | `SpotCard.tsx`, `SpotDetail.tsx`, `SpotsExplorer.tsx`, `SpotsMap.tsx`, `SpotMenu.tsx`, `MenuItemDetailModal.tsx`, `not-found.tsx`, `app/spots/page.tsx`, `app/policy/page.tsx`, `app/terms/page.tsx` | Placeholders, the badge contrast fix and `id="main"` (§2.1, §2.4) |
| Landing | `public/locales/{pl,en,ua}/common.json` | §2.3 |
| Pitch | `app/for-business/page.tsx` | New server page (§3.1) |
| Pitch | `app/components/business/BusinessPage.tsx`, `sections/{BizHero,Story,Benefits,Team,BizRewards,Integration,Faq,Pricing,ContactCta}.tsx` | New |
| Pitch | `app/components/business/BusinessGraphics.tsx` | `PlatformTrio`, `IntegrationDiagram`, `RoleIcon` (§3.4). The landing `Teaser` imports `PlatformTrio` |
| Pitch | `app/components/business/pricing.config.ts` | New (§3.3) |
| Pitch | `public/locales/{pl,en,ua}/business.json` | New (§3.5) |
| Pitch | `app/i18n/translations.ts` | Register the namespace (§6.2); single owner |
| Animation | `package.json` | Add `"lottie-web": "^5.13.0"` to dependencies, and the scripts `"lottie": "node scripts/lottie/build.mjs"` and `"check:locales": "node scripts/check-locales.mjs"` |
| Animation | `scripts/lottie/{lib,palette,props,build}.mjs`, `scripts/lottie/scenes/<name>.mjs` ×10 | Generator: plain Node ESM, no dependencies |
| Animation | `public/lottie/<name>.json` ×10 | Generated and kept in the repo (not built at deploy) |
| Animation | `app/components/lottie/{scenes.ts,LottieScene.tsx,LottiePlayer.tsx,useReducedMotion.ts}` | Player (§6.3) |
| Any | `scripts/check-locales.mjs` | Flattens `common.json` and `business.json` per locale and exits 1 on any missing or extra key across pl/en/ua |

**Nobody touches:** `app/account`, `app/components/account`, `app/checkout`, `app/auth`, `app/lib/account-api.ts`, or the `auth`, `account`, `quests`, `prizes`, `checkout` and `orders` keys in `common.json`.

### 6.2 i18n registration

```ts
// app/i18n/translations.ts
import pl from "../../public/locales/pl/common.json";
import en from "../../public/locales/en/common.json";
import ua from "../../public/locales/ua/common.json";
import plBusiness from "../../public/locales/pl/business.json";
import enBusiness from "../../public/locales/en/business.json";
import uaBusiness from "../../public/locales/ua/business.json";

export const dictionaries = {
  pl: { ...pl, business: plBusiness },
  en: { ...en, business: enBusiness },
  ua: { ...ua, business: uaBusiness },
} as const;
```

- **Calls:** pitch code uses `t("business.story.scenes.scan.title")` and `t("business.story.step", { n: 5, total: 10 })`. The Header and Footer use `nav.business` and `footer.business` from `common.json`.
- **Cost:** about 12 KB gzipped extra for 3 locales in the shared bundle, which is acceptable. If size ever matters, export `resolve` from `I18nProvider` and load `business.json` only in `BusinessPage`.

### 6.3 Lottie player

**`LottieScene`** (`"use client"`, SSR-safe; `<LottieScene name="scan" label={t("business.story.scenes.scan.alt")} />`):
- **Wrapper:** `<div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cream-soft" role="img" aria-label={label}>`. The player container inside it is `aria-hidden`. Until the player loads, the wrapper shows a quiet skeleton (two cream-deep blobs, no motion), so there is no layout shift.
- **Mounting:** mount `LottiePlayer` through `next/dynamic(() => import("./LottiePlayer"), { ssr: false })` the first time an IntersectionObserver (`rootMargin: "200px 0px"`) sees the scene.
- **Visibility:** `inView` means an intersection ratio of at least 0.25. Playback also pauses when `document.visibilityState === "hidden"`.
- **Play state:** `playing = ready && inView && pageVisible && !userPaused && (!reducedMotion || userPlayed)`.
- **Reduced motion:** the player still loads, but stops on the poster (`goToAndStop("poster")`) and plays only if the user presses Play. If reduced motion turns on while a scene is playing, it pauses on the poster.
- **Play/pause button** (WCAG 2.2.2; the loops run longer than 5 s):
  - 44×44, bottom right, `aria-pressed`;
  - label `business.a11y.pause` / `business.a11y.play`;
  - `bg-white/90 text-espresso` with a visible focus ring;
  - hidden until `ready`.

**`LottiePlayer`** (`({ name, playing, onReady })`):
- **Library import:** a module-level promise caches `import("lottie-web/build/player/lottie_light")`, so the library loads once for all 10 scenes, and only on `/for-business`. lottie touches `document` at import time, so import only inside `useEffect`.
- **Load:** `lottie.loadAnimation({ container, renderer: "svg", loop: true, autoplay: false, path: "/lottie/" + name + ".json", rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: true } })`. The JSON is same-origin and part of `out/`.
- **On `DOMLoaded`:** `anim.goToAndStop("poster")`, then `onReady()`. The player fades in under `motion-safe`.
- **When `playing` changes:** call `play()`, or `pause()`.
- **On `data_failed`:** stay on the skeleton and never show an error.
- **Unmount:** `destroy()`. This also covers StrictMode's double effects.
- **Types:** `lottie_light.d.ts` ships with the package, so no `any` and no custom declaration file are needed.

**`useReducedMotion`:** `matchMedia("(prefers-reduced-motion: reduce)")` plus a change listener. It returns false during SSR.

### 6.4 Generator (`scripts/lottie/lib.mjs`)

**Exports:**
- Constants: `FR = 30`, `W = 480`, `H = 360`, the palette `C` (hex), and the `ease` presets (§4.1).
- Values: `hex01(hex, a = 1)`, `st(v)` (static value), `kf(t, v, ease = "inOut", { hold, to, ti })`, and `anim(...kfs)`. `anim` strips `o`/`i` from the last keyframe and sizes the easing arrays to the value's dimension.
- Shapes:
  - `rect({ w, h, r, x, y })` (`ty:"rc"`; `p` is the **centre**), `ellipse({ w, h, x, y })`, `path(points, { closed, inT, outT })`;
  - `fill(hex, opacity)`, `stroke(hex, w, { opacity, dash: [d, g], cap: "round" })` (`lc:2, lj:2`; dash entries `{ n: "d" }` and `{ n: "g" }`), `trim({ s, e, o })`;
  - `group(name, items, transform)`, which emits `[...geom, tm?, st?, fl?, tr]`.
- Composition:
  - `layer({ name, groups, p, a, s, r, o, parent, ip, op })` (`ty:4`) and `nullLayer({ name, ... })` (`ty:3`);
  - `comp({ name, seconds, poster, layers })`. It reverses the back-to-front author order, assigns `ind`, resolves `parent` names, sets `ip:0, op, st:0, sr:1, ddd:0, bm:0, ao:0` on every layer, and writes the top level `{ v: "5.7.4", fr, ip: 0, op, w, h, nm, ddd: 0, assets: [], markers: [{ tm: poster, cm: "poster", dr: 0 }], layers }`.
- Motion helpers: `pop(t0, dur = 12)`, `slideIn(t0, dx, dy)`, `fadeIn(t0)`, `fadeOut(t0)`.

**`build.mjs`:**
- Imports every scene, rounds numbers to 2 decimals and writes minified `public/lottie/<name>.json`. It prints each file's size.
- Exits 1 on any of:
  - a non-finite number;
  - `op !== seconds * 30`;
  - a keyframe `t` outside `[0, op]`;
  - a duplicate or missing `ind`;
  - `ip >= op`;
  - a missing poster marker, or a poster outside `[0, op]`;
  - a file over 60 KB;
  - scene names that do not match `SCENE_NAMES` (read by regex from `app/components/lottie/scenes.ts`).

### 6.5 Accessibility, performance and QA checklist

1. **Headings:** one `h1` per page and an `h2` per section. Landing cards are `h3`. On the pitch, acts are `h3` and scenes are `h4` inside `<article aria-labelledby>`.
2. **Interaction:** every interactive element has a touch target of at least 44 px and a visible focus state. Run a keyboard pass over the header and mobile menu, the CTAs, the FAQ `<summary>`, the pause buttons and the copy button.
3. **Contrast:** only pairs from §0.4.
4. **Layout:** check 320, 375, 768 and 1280 px. 20 px gutters (`px-5`), no horizontal page scroll, decorative absolute elements only inside `overflow-hidden`.
5. **Reduced motion** (DevTools emulation): Lottie on its poster, no CSS floats, no smooth scroll.
6. **Runtime requests:** none beyond the existing API and Google Maps. Grep the new files for `http` (only `metadataBase` and `loodly.pl` copy are allowed).
7. **Commands:**
   - `npm run lottie` writes 10 files, each ≤ 60 KB.
   - `npm run check:locales` passes.
   - `npm run lint` passes.
   - `npm run build` passes, and `out/for-business.html` and `out/lottie/*.json` exist.
8. **A4 grep:** search the landing namespaces of `common.json` for `marka|marki|marką|brand|бренд|place`. There must be no hits. Category nouns appear only in `site`, `hero`, `categories`, `teaser` and `footer.tagline`.
9. **Fabrication check:** no number on either page outside the "Example app screen" mock, the story kickers, and the Thursday 10–14 promotion example.

---

## 7. Decisions and open items

### 7.1 Editorial decisions (merge of A and B)

| Topic | Taken from | Why |
|---|---|---|
| Landing order (Hero → Categories → How → Loyalty → Rewards → Features → App → Teaser) | B | Tells the story what → how → card → rewards → details; loyalty sits high, as the owner asked |
| Categories on a berry band | A (band) + B (illustrated cards) | Keeps the color rhythm of the old Stats band without fake numbers |
| Hero badge "Nie tylko lody" and the stamp-card line | A | Plays on the name and states the pivot in three words |
| Hero H1 "Lody, kawa i wypieki z okolicy" | B | Concrete, and covers the categories |
| Mobile menu instead of a lone "Dla firm" link | A | Mobile has no navigation today |
| Wallet mock in HTML with skeleton names | B | Localized text, no invented brand names |
| JSON copy blocks (paste-ready) | A | Less ambiguous than tables |
| Pitch H1 (descriptive) and fact-checked process copy | B | Clarity for owners; the menu-in-Spot correction |
| Pitch order: story first, benefits after, FAQ **before** pricing, contact last | A | Pricing at the bottom as the owner asked; the FAQ answers objections before the price |
| Real app names (Loodly Spot, Loodly Courier) | B | Concrete, and matches what staff will install |
| Safeguards card, "own app?" FAQ, scanner advice | B | Honest answers to the questions owners actually ask |
| Scene names `moreOrders`, `onlineOrders` and the 3-act grouping | A (renamed to camelCase) | Matches the owner's list one to one |
| Scene specs | B for 1–6, 9, 10; A for 8; a merge for 7 (gift box + older and younger customer) | Precision where available; "orders from anywhere" for scene 8 |
| No poster SVG renderer | A | One renderer, no drift; reduced motion uses `goToAndStop("poster")` |
| `lottie-web` light, not `lottie-react` | both | Smaller, no expressions, loads only on `/for-business` |
| New dependency `lottie-web` | owner request | Spec §6 says the landing needs no new npm dependency; the owner's explicit Lottie request overrides that, and the cost is limited to one route |
| No "0% commission" flag | — | The owner never mentioned it; it is an open question |

### 7.2 Open items for the owner

1. **Prices:** `integrationFeeFrom` and `perSpotMonthly` (both `null`), net or gross (`vat`), and whether PLN is the only currency (UA visitors).
2. **Contact:** confirm `kontakt@loodly.pl` is the right inbox for sales leads. No phone number exists; add one to `BUSINESS_CONTACT.phone` if wanted.
3. **Billing wording:** confirm "you pay for **active** locations" (it matches the active-spot quota) and the "Co obejmuje Loodly" list.
   - Do merchants pay any per-order fee?
   - Is the customer app free? The copy does not claim either way.
4. **Integration:** confirm the integration wording and that "Założenie marki i konta administratora" is part of the setup fee.
5. **Legal sign-off:** "Nie musisz zmieniać kasy" and the FAQ answers on data (a7) and contract (a8).
6. **Links:** set store URLs (`NEXT_PUBLIC_IOS_APP_URL`, `NEXT_PUBLIC_ANDROID_APP_URL`) and the QR target `NEXT_PUBLIC_APP_DOWNLOAD_URL`; the badges and QR stay hidden until then. Social URLs go in `SOCIAL_LINKS`.
7. **Release timing:** the barcode card (client 1.1.0, landing L1a) and counter exchange (A3, spot 1.1.0) are described as features. Publish the pitch with or after those releases.
8. **Missing assets:** no Open Graph image (it needs a 1200×630 PNG), no public brand-console login URL for a "Log in" link, and no Loodly Spot download links.
9. **Native review:** a native speaker reviews PL and UA (spec §5.9), especially "морозиварні" and "імеджеві (2D) сканери".
10. **Brand colour:** the logo red `#EC2828` differs from the site's berry. The mark is kept as it is; merch bodies use the site palette.

### 7.3 Out of scope (hand to the parity or backend tasks)

- `prizes.scan_hint` / `prizes.redeem_success` ("w punkcie") and the `checkout.*` spot wording are owned by the parity task.
- Account and checkout pages need `<main id="main">` for the skip link.
- `pluralCategory` returns "many" for UA 21, 31, … where it should be "one".
- The backend `ProductType` / `TasteType` enums and `spot.category.*` are ice-cream-centric (TASTE, SORBET, GELATO…). Bakery and pastry menus fall into "Desery" or "Inne". Flag this to the backend.
- The PL terms page still describes the app as "do zamawiania lodów i kawy z lokalnych punktów"; legal copy needs a separate update.
- Geist may lack Cyrillic glyphs, so UA text could fall back to `system-ui`. This is existing behaviour; check it.
