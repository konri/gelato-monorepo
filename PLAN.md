# Gelato — "Good Lood Clone" Ecosystem: Execution Plan

> Recovered from the build session of 2026-06-03 (the 123-task tracker, which expanded
> the original 78-task blueprint). This is the canonical plan — edit here, not in transcripts.

## Goal

A multi-app ice-cream & café delivery ecosystem (Good Lood clone): one company, many
connected spots, each with its own tastes/products. Six apps, all i18n **PL / EN / UA**,
shared theme, FCM push (native) + WebSocket/SSE (web) real-time.

**Brand theme:** Espresso `#4a044e`, Amber `#b45309`, Soft Canvas `#fffdfa`, font Urbanist.
(Template red `#EC2828` is to be fully replaced.)

**Roles:** SUPER_ADMIN → SPOTS_ADMIN → SPOT_ADMIN → EMPLOYEE; plus COURIER, CLIENT.

## Apps (all built fresh as `*-new`, using the originals as templates only)

| New project | Stack | Purpose |
|---|---|---|
| `backend-new` | Express + Apollo + TypeGraphQL + Prisma/PostgreSQL | Central API, FCM, WebSocket, Stripe, Twilio OTP |
| `landing-page-new` | Next.js 14 + Tailwind + next-i18next | Marketing site (goodlood.com style) |
| `mobile-new` | Expo SDK 54 + expo-router + NativeWind | Client app (native + web) |
| `mobile-admin-spot-new` | Expo (native + web, expo-camera) | Spot terminal (admin + employee) |
| `mobile-courier-new` | Expo | Courier logistics + GPS telemetry |
| `admin-global-web-new` | Vite + React + Tailwind | Super-admin / spots-admin console |

---

## Phase blueprint (original 78-task spine)

- **Phase 1 — Audit & Sync** ✅ template stacks + design tokens documented.
- **Phase 2 — Scaffolding (#2–11):** init 6 projects; Prisma schema (User roles, Spot, Taste,
  Product, Order, Delivery, City, Review, Notification, CourierLocation); migrate + seed
  (Warsaw/Krakow/Lviv); GraphQL resolvers; i18n dictionaries.
- **Phase 3 — Backend core (#12–19):** Auth (Email/Google/Apple/OTP), RBAC matrix, FCM,
  WebSocket subscriptions (+SSE fallback), Spot/Taste CRUD, checkout + Stripe + delivery-radius
  (Haversine), courier assignment + GPS, loyalty/referral/birthday/prizes.
- **Phase 4 — Client mobile (#20–32):** 5 tabs, checkout, live tracking, QR + max-brightness, web port.
- **Phase 5 — Spot admin (#33–42):** dual native/web, product & spot editors, persistent WebSocket
  order intake + audio, courier approval, QR scanners, analytics + PDF, reviews.
- **Phase 6 — Courier (#43–48):** OTP + spot application, Start Job + 60s GPS ping, FCM accept,
  Maps deep-link nav, earnings, ratings.
- **Phase 7 — Global admin web (#49–56):** admin creation, spot mgmt, global push composer,
  news/CMS, prizes, quests.
- **Phase 8 — Landing (#57–61):** hero, features, spots map, footer, SEO.
- **Phase 9 — Testing (#62–69):** E2E per app, WebSocket, Stripe, i18n, referral/loyalty.
- **Phase 10 — Deploy (#70–77):** infra, backend, landing, 3 app-store submissions, admin web, monitoring.
- **Phase 11 — Docs (#78):** READMEs, GraphQL docs, ERD, handoff.

Tasks #79–123 are refinements: image-upload UIs, dark mode, animated onboarding, Google/Apple
sign-in, and a granular screen-by-screen rebuild of the mobile client (the "Bonapka" template → Gelato).

---

## Mobile client (`mobile-new`) — reconciliation as of 2026-06-17

Overall ≈ **65%**. Core flows (auth, ordering, tracking, points, prizes) work. Stack verified:
Expo 52, RN 0.76.5, Apollo 3.11, expo-router 4, Stripe RN, NativeWind 2, i18next, Google
Maps/Places, Google + Apple sign-in. Branding fully de-Bonapka'd; theme colors applied.

### ✅ Done
- Login (email/pw), Google sign-in, Apple sign-in, forgot-password (OTP), register w/ referral code — `app/(auth)/`
- Apollo client wired to backend — `services/apollo.ts`
- 5+ bottom tabs routing — `app/(tabs)/_layout.tsx`
- Header notifications badge + settings icon — `app/(tabs)/account.tsx`
- Product details + quantity + cart management — `app/(tabs)/ordering.tsx`
- Address input w/ Google Places autocomplete — `app/checkout.tsx`
- Prizes: points display, active/available tabs, activation gated by points — `app/(tabs)/prizes.tsx`
- i18n EN complete (330 keys); theme colors in `tailwind.config.js`

### 🟡 Partial
- Start tab uses custom tabs, not Material Top Tabs; News/Tasks thin — `app/(tabs)/index.tsx`
- News feed: carousel + likes, **no** comments/detail view
- Account: points + QR present; **no** date-grouped transaction SectionList
- Tasks: referral + birthday quests; **no** admin-defined quests
- Tastes: per-spot list; **no** type filter, **no** rich-text ingredients
- Spot selection: **no** open/closed status; catalog **not** grouped by type (SectionList)
- Order summary: **no** promo/influencer code, **no** free-delivery threshold
- Stripe: card only (CardField); **no** Apple/Google Pay, **no** BLIK
- Notes field present; success is `Alert`, **no** confetti
- Order tracking: map exists but **polls every 30s**, not WebSocket
- Spot details screen exists but limited fields
- Settings: profile edit + language; **no** birthday, **no** city selector
- PL/UA translations partial (214 keys vs EN 330)
- Web: `Platform.OS==='web'` checks only; **no** `.web.tsx` files

### ❌ Missing
- Post-registration city-selection onboarding (location → nearest city / dropdown)
- Address confirmation map (spot pin + destination pin)
- Delivery time selector (ASAP / today slots / tomorrow / calendar)
- Invoice form (NIP, company, address)
- Spots tab map + carousel synced to map (only a list today)
- Taste like/comment
- Dedicated Notifications list screen w/ mark-as-read on tap

### Biggest gaps to close next (suggested order)
1. Post-registration city selection (unblocks correct spot/news filtering)
2. Spots tab map + carousel
3. Notifications list screen (mark-as-read)
4. Checkout completeness: delivery-time selector, promo code, invoice form
5. Swap order-tracking polling → WebSocket subscription
6. Finish PL/UA translations
7. Payments: Apple/Google Pay + BLIK
8. Confetti success modal; transaction history SectionList; admin quests; taste like/comment
