# Gelato Brands: Implementation Spec (final)

## Amendments A1–A5 (product owner, 2026-10-06). These override every section below.

**A1. Lean cutover: no backward compatibility for the client and spot apps.**
- Production holds only test data. The brands release deletes **all data except the `User` rows that hold `SUPER_ADMIN` (2 accounts) and the `City` table**.
  - The super admins' profiles, balances, device tokens, notifications, sessions and other rows are deleted, their `accountType` is set to `ADMIN`, and their `tokenVersion` is bumped.
  - City rows are kept and gain `timezone`.
- No spots survive, so **there is no default brand**: no `DEFAULT_BRAND_ID`, and no migration-created "Loodly" brand. The seed creates demo brands for development.
- **Removed from scope:**
  - Transitional DB defaults and `_brand_cutover_affected`.
  - Every legacy projection: `LegacyLoyalty`, the legacy wallet, `legacyAwardPoints`, `resolveLegacySpotId` and the legacy behavior of arg-less staff subscriptions for multi-spot users.
  - `isLegacyClient`, the 426 at login for old spot builds, and `MIN_CLIENT_API_ENFORCED` as a rollout step.
  - The legacy-contract harness for client and spot bundles, plus `rollback.sql` and `rollforward.sql` (rollback = restore the `pg_dump`).
  - The N+1 and N+2 contract migrations. Their content moves into the main migration:
    - `PointTransaction.source` and `idempotencyKey` are NOT NULL from the start;
    - `EmployeeProfile.isFirstLogin` is dropped and replaced by `User.mustChangePassword`;
    - the `SpotsAdminProfile` table and `User.spotsAdminProfile` are dropped.
  - `LedgerSource.LEGACY`.
  - P0 as a separate release: Phase 0 and Phase 1 ship as **one backend release**.
- **Kept:**
  - SDL compatibility for **mobile-courier 1.0.0**, which gets no new build (D7). Every operation and selected field in `mobile-courier/shared/api-client` must still validate and behave. The courier's arg-less `myPointBalance` returns a zero balance and never creates a wallet. `scripts/verify/courier-contract.ts` validates the courier documents against `schema.gql`.
  - In new builds: the `x-loodly-client` / `x-loodly-api` headers, error handling based on `extensions.code`, and the `UPGRADE_REQUIRED` mechanism (server env `MIN_CLIENT_API`, off by default) for future cutovers.
- **Client and spot operations may change shape.** Arguments that stayed optional only for legacy reasons become required: `awardPoints.spotId`, `validatePrizeQR.spotId`, `loyaltyCustomer.spotId`.
- `SPOTS_ADMIN` is removed from every code path; the enum value stays.
- **Migrations:** `<ts>_role_brand_admin` (only `ADD VALUE 'BRAND_ADMIN'`), then one `<ts>_brands_core`, which first wipes (in FK-safe order) and then applies all DDL with final constraints. No backfills are needed.
- **Deploy runbook:**
  1. Take a `pg_dump`.
  2. Deploy the backend. **Deploying wipes production.**
  3. Deploy the admin web and the landing.
  4. The super admin creates the brands.
  5. The new client and spot builds go to the stores; testers reinstall.

**A2. Referral trigger (resolves Q7).**
- The referral pays out on the invited friend's **first purchase credit** at a brand whose `referralBonusPoints > 0`. A purchase credit is a `LedgerSource` of `ORDER`, `STAFF_TEMPLATE` or `STAFF_CUSTOM`: an app order or a counter award.
- Both the referrer and the friend receive `referralBonusPoints` at that brand (`REFERRAL_REFERRER` and `REFERRAL_REFEREE`), in the same transaction as the triggering credit or right after it, keyed `referral:{referralId}:{side}`.
- A credit at a brand where referral is off does not consume the referral; it stays `PENDING`. The `NO_BONUS` status is not used.
- Anti-abuse: no payout when the triggering credit's `actorUserId` belongs to the referrer, or when the referrer and the friend are the same person (same email or phone).

**A3. Counter exchange (resolves Q8: yes, in v1).**
- New mutation `exchangeRewardAtCounter(spotId: ID!, customerId: ID!, prizeId: ID!, requestId: String!): CounterExchangeResult!`.
  - Requires OPERATE, an active brand and spot, `prize.brandId == spot.brandId`, an active prize that is in stock and within its validity, and a self-exchange guard (staff email or phone equal to the customer's → `SELF_AWARD`).
  - Runs in one `withLoyaltyTx`:
    1. debit `pointsCost` (`PRIZE_CLAIM`, key `counter_exchange:{requestId}`);
    2. create the `UserPrize` already redeemed (`redeemedAt` now, `redeemedAtSpotId`, `redeemedById` = staff);
    3. increment `claimed`.
  - Replaying the same `requestId` returns the original result.
- After commit, the customer gets a bell row and a push: "You exchanged {cost} points for {reward} at {brand}".
- **Spot app:** the customer screen after a scan lists the brand's rewards the customer can afford under **Exchange points for a reward**. A confirm sheet reads "{reward} for {cost} points. {customer} will have {left} points left." with [Confirm] / [Cancel]. The ready-to-hand-over list (rewards already claimed in the app) stays.

**A4. Wording (replaces the glossary in §5.9).**
- Customer-facing copy never uses a generic noun for a brand: no "place", "lodziarnia", "морозиварня" or "marka". Brands can be any business (ice cream, bakery, café).
- Always use the brand's own name, and avoid sentences that inflect it. Prefer "{brand}: 1 250 punktów", "Nagrody · {brand}", "Punkty z {brand} wymienisz tylko w {brand}."
- Generic multi-brand copy: EN "One card everywhere", PL "Jedna karta wszędzie", UA "Одна картка всюди".
- Picker title: EN "Your points", PL "Twoje punkty", UA "Ваші бали".
- Rule line: EN "Points from {brand} can be spent only at {brand}." / PL "Punkty z {brand} wymienisz tylko w {brand}." / UA "Бали з {brand} можна витратити лише в {brand}."
- A spot is "location" / "lokal" / "заклад". Ice-cream-specific wording is removed from shared brand UI and from the landing loyalty copy.

**A5. Phasing (replaces the order in §7.2 and §8).**
1. **Backend:** one release with the P0 tasks (P0-12 reduced to the courier contract check) and the Phase 1 tasks, minus everything A1 removes.
2. **Admin web:** deploys with the backend.
3. **Spot app 1.1.0.**
4. **Client app 1.1.0.**
5. **Landing:** L1a, L1b and L2 are merged into one parity drop and deploy with the backend.

Monorepo `/Users/konradhopek/Workspace/private/gelato-monorepo`.

**Live projects:** `loodly-be` (backend), `admin-global-web-new` (admin web), `mobile-spot` (spot app), `mobile` (client app), `landing-page-new` (landing). `mobile-courier` is unchanged (D7).

**Dead projects:** `backend-new`, `mobile-admin-spot*`, `old/`. Nothing lands there, and `docs/RAILWAY_DEPLOY.md` must stop pointing at `backend-new`.

Line references are to files as on disk on 2026-10-06, including uncommitted changes. Every review finding was applied unless it is listed in Appendix A. I checked the contested claims in code:
- type-graphql 1.1.1 throws `ForbiddenError` whenever roles are listed (`auth-middleware.js`).
- `CollectOrderResult.pointsAwarded: Int!` (`OrderType.ts:236-239`), and spot 1.0.1 selects it (`strings.txt:1468`).
- `loodly-be` has no `railway.json`.
- `CodeGenerator` uses `Math.random`.
- `registerFCMToken` upserts on (userId, deviceId) only.
- The REST login role gate runs before the password check (`authRoutes.ts:183-192`).
- Email templates interpolate tenant strings raw (`AdminResolver.ts:264-266, 348-349`).
- `markOrderPaid` awaits points before it announces the order (`OrderPaymentService.ts:46-57`).
- `createSpot` creates spots `isActive: true` with `openingHours: {}` (`SpotResolver.ts:409-428`).
- `UserChangeInput` has no `language` field.

---

## 0. Executive summary

1. Loyalty becomes per-brand. Every spot belongs to exactly one brand. Wallets, ledger rows, rewards and promotions carry a `brandId`. A client keeps one `GL-XXXXXXXX` code, shown as QR or Code 128.
2. SUPER_ADMIN creates a brand, its first BRAND_ADMIN, and `maxSpots` (the maximum number of active spots; billing is manual).
3. BRAND_ADMIN sets up the brand profile, cities, spots, rewards, promotions and staff in the admin web, and operates any of the brand's spots in the spot app. SPOT_ADMIN covers one or more spots; EMPLOYEE covers exactly one.
4. The backend work ships in two releases. **P0** (security groundwork on today's schema) goes first. **N** follows with 9 migrations, the D5 loyalty reset, one access layer (`src/auth/access.ts`) and one ledger (`LoyaltyLedger`) that locks wallets, uses idempotency keys and never goes negative.
5. The SDL only grows. Installed builds keep working through legacy projections: client 1.0.3, spot 1.0.1, courier 1.0.0. Brand admins and multi-spot admins who log in on spot 1.0.1 get a readable 426 asking them to update.
6. New builds:
   - **mobile 1.1.0:** a code-first "My card"; the brand picker only appears when more than one brand is engaged.
   - **mobile-spot 1.1.0:** a spot dropdown when the user has more than one spot; a scanner for QR, Code 128 and keyboard wedge; rewards handed over by scanning the customer's card.
   - **Admin web:** a brand console.
   - **Landing:** compatibility drops L1a and L1b ship with N; full parity (L2) comes later.
7. Brand tasks in v1 are scheduled points multipliers. The highest active multiplier applies (no compounding), evaluated in the spot's local time and snapshotted when the order is placed. The model extends to count-based tasks later.
8. Point of no return (PONR): the first non-default brand, or the first public store release of a 1.1.0 build, whichever comes first.

### Decisions and defaults

| # | Decision | Choice | Source |
|---|---|---|---|
| D1 | Where brand admins work | Setup in admin web; day-to-day in mobile-spot, where all brand spots appear in the dropdown | Product owner |
| D2 | Referral | Credited at the brand of the friend's first **completed** order, to both sides; brands with a 0 bonus close the referral as NO_BONUS | Product owner |
| D3 | Birthday | Per-brand opt-in; yearly; only at brands where the user already has a wallet | Product owner |
| D4 | Brand tasks | Scheduled points multipliers in v1; dedicated `BrandTask` tables; extensible to count tasks | Product owner |
| D5 | Data reset | Reset balances, transactions, prizes, user prizes, quests and referral payouts; keep accounts; existing spots go to a default brand | Product owner |
| D6 | Barcode | Code 128 of the `GL-` code; the server normalizes QR (JSON or raw), Code 128 and wedge/manual input | Product owner |
| D7 | Courier app | No change | Product owner |
| E1 | Staff identity | `BrandStaff(userId @unique, brandId, kind)` plus composite FKs, instead of a separate `BrandAdminProfile` | Engineering (challenge) |
| E2 | SPOTS_ADMIN | Deprecated and kept in the enum; its holders become BRAND_ADMIN of the default brand | Engineering default |
| E3 | Spot quota | `maxSpots` counts **active** spots. New spots are created as **inactive drafts**; the quota is checked on activation; total spots ≤ `maxSpots + 5` | Engineering (modified default) |
| E4 | Crucial spot fields | name, city, address, lat/lng are BRAND_ADMIN-only, enforced only when the **value changes** | Engineering |
| E5 | Brand name | Editable by PLATFORM only (prevents impersonation) | Engineering (challenge) |
| E6 | Manual points | Custom awards need MANAGE_SPOT and are capped by `manualAwardCap`; employees award by template only; optional daily cap per staff member | Engineering default |
| E7 | Multiplier overlap | MAX of active multipliers; city time zone; snapshot at placement | Engineering default |
| E8 | Birthday mechanics | Wallet must have existed on the birthday; 3-day catch-up; 30-day guard after the birth date is set | Engineering (Q5) |
| E9 | Reward lifecycle | 7-day validity; reminder push 24 h before expiry; expired rewards are refunded (`PRIZE_REFUND`) | Engineering (Q1) |
| E10 | Reward pickup | Staff hand over claimed rewards by scanning the customer **card**; the PR code still works | Engineering (new) |
| E11 | Legacy multi-spot staff | 426 `UPGRADE_REQUIRED` at login on spot 1.0.1; no role alias | Engineering (challenge) |
| E12 | Arg-less subscriptions | Single-spot users keep today's behavior; multi-spot users get only their legacy spot | Engineering |
| E13 | Staff push routing | `DeviceToken.activeSpotId`, plus a fallback to the spot's managers when no device covers the spot; tokens deduplicated | Engineering |
| E14 | Brand deactivation | Staff can still log in. New orders, awards, claims and news are blocked. Rewards already claimed stay redeemable for 30 days. Customers see "paused" wallets | Engineering (Q6) |
| E15 | Client picker | Hidden when ≤ 1 **engaged** brand (points > 0 or a reward ready to pick up) | Engineering default (refined) |
| E16 | Client brand selection | Persisted per (device, user); auto-follows a new credit only while "My card" is on screen | Engineering |
| E17 | Spot selection | Persisted per (device, user); forced choice after login and on the first open of each day | Engineering |
| E18 | QR payload | Raw `GL-` code; legacy JSON only when no code exists | Engineering |
| E19 | Billing | Manual; `billingNote` is visible only to PLATFORM | Engineering default |
| E20 | Landing | Compatibility drops L1a/L1b ship with N; L2 parity comes later | Engineering (challenge) |
| E21 | Quests | Frozen: platform-only CRUD, hidden in the UI, never pays points | Engineering |

---

## 1. Domain model and roles

### 1.1 Entities

- **Brand** has `name`, description, `descriptionLocal`, logo, cover, cities (`BrandCity` → City, with City gaining `timezone`), `maxSpots`, settings, `isActive` and `deactivatedAt`.
- **Spot** has `brandId` and `cityId`; the city must be one of the brand's cities. A spot is in one of three states: draft (inactive, never activated), active, or deactivated.
- **BrandStaff** is one row per non-super staff user (one brand, one kind).
  - It owns `SpotAdminProfile[]` (one or more spots) or a single `EmployeeProfile`.
- **Loyalty data**:
  - `PointBalance(userId, brandId)`;
  - `PointTransaction` (`brandId`, `spotId?`, `source`, `idempotencyKey`);
  - `Prize(brandId)` → `UserPrize(brandId, claimKey, qrCode)`;
  - `BrandTask(POINTS_MULTIPLIER)` with windows and optional spot scope;
  - `Referral` (`status`, `brandId`, `qualifyingOrderId`);
  - `Order.brandId` and `pointsMultiplierPercent`, both snapshotted at `createOrder`.

### 1.2 Invariants

- **I1. One brand per spot.** Every spot belongs to one brand, and its city is one of the brand's cities. Enforced by the composite FK `Spot(brandId, cityId) → BrandCity`.
- **I2. One brand and one kind per staff user.** Every non-SUPER_ADMIN staff user belongs to exactly one brand with exactly one kind (`BrandStaff.userId @unique`). Profiles carry composite FKs to `Spot(id, brandId)` and `BrandStaff(userId, brandId)`. `StaffService` keeps `User.roles` in line with the kind; if the scope sees them disagree it fails closed with `ROLE_DRIFT`.
- **I3. Loyalty rows always carry a brand.** Every loyalty row has a non-null `brandId`, and `UserPrize(prizeId, brandId) → Prize(id, brandId)`.
- **I4. Brand staff never choose the brand.** The server derives it. Only PLATFORM names a brand explicitly (`resolveBrandForWrite`).
- **I5. Membership tables have two owners.** Only `access.ts` reads them for authorization and only `StaffService` writes them. Enforced by grep and ESLint gates (§2.11).
- **I6. Balances never go negative.** Each balance change has exactly one ledger row, with a unique `idempotencyKey`. A key that comes back with a different payload raises `IDEMPOTENCY_CONFLICT`.
- **I7. Staff roles need an ADMIN account.** Staff roles count only when `accountType = ADMIN`.
- **I8. Reads never create wallets.** Only `LoyaltyLedger.credit` does.
- **I9. The SDL only grows.** New arguments are optional. The single loosening is `createSpot(id: String!)` becoming `String`.
- **I10. Side effects follow the commit.** PubSub, FCM, bell rows and email run after commit. A loyalty failure never fails the primary operation; a sweeper repairs it later.
- **I11. Active brand and spot for customer-facing writes.** Loyalty writes and customer-facing writes require an active brand and an active spot. The only exception: rewards already claimed stay redeemable for 30 days after a brand is deactivated.
- **I12. Tenant input is untrusted in output.** Tenant-controlled strings are HTML-escaped in emails. Tenant image URLs must be platform-owned S3 URLs.

### 1.3 Access levels

| Scope of the caller at spot S or brand B | S assigned | S in my brand, not assigned | Other brand | Brand-level (B is mine) |
|---|---|---|---|---|
| PLATFORM (SUPER_ADMIN) | PLATFORM | PLATFORM | PLATFORM | PLATFORM (must name the brand to write) |
| BRAND_ADMIN | MANAGE_BRAND | MANAGE_BRAND | NONE | MANAGE_BRAND |
| SPOT_ADMIN | MANAGE_SPOT | NONE | NONE | read only |
| EMPLOYEE | OPERATE | NONE | NONE | read only |

### 1.4 Permission matrix

Server-enforced. "own" means a spot assigned to the user; for BRAND_ADMIN it means any spot of the brand.

| Action | SUPER_ADMIN | BRAND_ADMIN | SPOT_ADMIN | EMPLOYEE | CLIENT |
|---|---|---|---|---|---|
| Create brand; edit name, `maxSpots`, `billingNote`; activate/deactivate brand; delete brand | ✔ | – | – | – | – |
| Invite / remove BRAND_ADMIN | ✔ | – | – | – | – |
| Cities (incl. time zone); move spot between brands; delete spot | ✔ | – | – | – | – |
| Brand profile (logo, cover, description), brand cities, settings (birthday, referral, caps) | ✔ (support) | ✔ | read | – | – |
| Create spot (draft); activate/deactivate (quota) | ✔ | ✔ | – | – | – |
| Crucial spot fields (name, city, address, lat/lng) | ✔ | ✔ | read only | – | – |
| Operational spot fields (hours, description, phone, email, seating, delivery/pickup/payment toggles, fees, radius, courier payout, photos/logo/cover) | ✔ | ✔ | ✔ own | – | – |
| Menu create/edit/delete; point templates | ✔ | ✔ | ✔ own | – | – |
| Menu availability (sold-out) toggles | ✔ | ✔ | ✔ own | ✔ own | – |
| Rewards CRUD; brand tasks CRUD | ✔ | ✔ | read | read | – |
| Create SPOT_ADMIN; assign spots; change staff kind | ✔ | ✔ | – | – | – |
| Create/move/reset/disable/remove EMPLOYEE | ✔ | ✔ | ✔ own spots | – | – |
| Orders: list, claim, status, terminate (+ apology), collect, courier assignment, chat as spot | ✔ | ✔ | ✔ own | ✔ own | own orders (as customer) |
| `refundOrder`; `cancelPaymentIntent` | ✔ | ✔ | ✔ own | – | cancel own intent |
| Scan customer; template award; reward hand-over / PR redeem | ✔ | ✔ | ✔ own | ✔ own | – |
| Custom award (≤ `manualAwardCap`) | ✔ | ✔ | ✔ own | – | – |
| Dashboard, complaints, spot reports, staff sessions, courier applications/earnings | ✔ | ✔ | ✔ own | – | – |
| Brand-wide reports | ✔ | ✔ | – | – | – |
| Spot news (post, edit, image) | ✔ | ✔ | ✔ own | – | – |
| Global news, broadcasts, payouts, user/role admin | ✔ | – | – | – | – |
| Earn points, claim rewards, see wallets | – | – | – | – | ✔ (never by their own staff hand) |

Who manages whom (`assertCanManageStaff`): ranks are PLATFORM 4 > BRAND_ADMIN 3 > SPOT_ADMIN 2 > EMPLOYEE 1. The caller must strictly outrank the target and be in the same brand; PLATFORM may act on anyone. A SPOT_ADMIN may act only on employees of its own spots. Nobody can disable, remove, change the kind of, or reset the password of themselves.

---

## 2. Backend (`loodly-be`)

### 2.1 Module map

| Path | Role |
|---|---|
| `src/auth/roles.ts` | `PLATFORM_ROLES`, `BRAND_ROLES`, `ADMIN_ROLES`, `STAFF_ROLES`, `STAFF_ROLE_PRIORITY`. The only place role lists live. |
| `src/auth/access.ts` | The access layer (§2.5) |
| `src/auth/errors.ts` | `ScopeError` (and the codes below), `LoyaltyError`, localized messages from `user.language` |
| `src/middleware/clientInfo.ts` | Parses `x-loodly-client` / `x-loodly-api` and WS `connectionParams.client` / `api` |
| `src/middleware/rateLimit.ts` | In-memory limiter per key (single instance) |
| `src/graphql/validationRules.ts` | Depth limit 10 and an alias limit of 40 |
| `src/graphql/loaders.ts` | DataLoaders for Brand, City, Spot, BrandStaff and wallets (adds the `dataloader` dependency) |
| `src/services/StaffService.ts` | The only writer of BrandStaff, profiles and staff roles |
| `src/services/brand/BrandService.ts` | Brand CRUD, `withSpotSlot`, `moveSpotToBrand`, `serverSpotId` |
| `src/services/loyalty/{LoyaltyLedger,LoyaltyService,PointsRuleEngine,LoyaltyCode,LegacyLoyalty}.ts` | Loyalty engine (§2.7) |
| `src/services/time/timezone.ts` | `resolveTimeZone`, `localParts`, `localToInstant` |
| `src/services/notify/staffRecipients.ts` | `getSpotStaffRecipients` |
| `src/services/realtime/RealtimeRegistry.ts` | Tracks WS sockets per userId; `closeUser(userId)` |
| `src/shared/utils/html.ts` | `esc()` for every value interpolated into email HTML |
| `src/jobs/{scheduler,JobLease,birthdayJob,rewardExpiryJob,orderPointsSweeper}.ts` | In-process jobs |
| `src/resolvers/{Brand,Staff,Loyalty,BrandTask}Resolver.ts` | New resolvers, registered at `src/index.ts:123-153` |
| `src/shared/constants/brand.ts` | `DEFAULT_BRAND_ID = '00000000-0000-4000-8000-000000000001'` |
| `railway.json` | Healthcheck configuration (§7.3) |

### 2.2 Prisma schema

`<D>` stands for `DEFAULT_BRAND_ID`. `// …` means unchanged.

```prisma
enum Role { SUPER_ADMIN SPOTS_ADMIN /* deprecated, held by nobody after M9 */ SPOT_ADMIN EMPLOYEE COURIER CLIENT BRAND_ADMIN }
enum StaffKind { BRAND_ADMIN SPOT_ADMIN EMPLOYEE }
enum LedgerSource { ORDER ORDER_APOLOGY ORDER_REVERSAL /*reserved*/ STAFF_TEMPLATE STAFF_CUSTOM REFERRAL_REFERRER REFERRAL_REFEREE
                    BIRTHDAY PRIZE_CLAIM PRIZE_REFUND ADMIN_ADJUSTMENT /*scripts*/ LEGACY /*old-instance overlap rows*/ }
enum BrandTaskKind { POINTS_MULTIPLIER }          // future: VISIT_COUNT, ITEM_COUNT (separate ADD VALUE migrations)
enum BrandTaskStatus { ACTIVE PAUSED ARCHIVED }
enum ReferralStatus { PENDING AWARDED NO_BONUS CLOSED }
// TransactionType and QuestType are unchanged.

model Brand {
  id String @id @default(uuid())
  name String                       // PLATFORM-only; uniqueness is case-insensitive, checked in app code (BRAND_NAME_TAKEN)
  description String? @db.Text
  descriptionLocal Json?
  logoUrl String?
  coverUrl String?
  isActive Boolean @default(true)
  deactivatedAt DateTime?           // set when isActive goes false; starts the 30-day redemption grace period
  maxSpots Int @default(1)          // maximum ACTIVE spots
  billingNote String?
  birthdayBonusEnabled Boolean @default(false)
  birthdayBonusPoints Int @default(0)
  referralBonusPoints Int @default(0)   // paid to both sides; 0 = off
  fallbackPointsPerPln Int @default(1)  // used when no order item defines points
  manualAwardCap Int @default(1000)     // maximum points in one STAFF_CUSTOM award
  staffDailyAwardCap Int @default(0)    // per staff member per local day; 0 = off
  createdById String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  cities BrandCity[]
  spots Spot[]
  staff BrandStaff[]
  prizes Prize[]
  userPrizes UserPrize[]
  balances PointBalance[]
  transactions PointTransaction[]
  tasks BrandTask[]
  orders Order[]
  referrals Referral[]
  @@index([isActive])
}
model BrandCity {
  id String @id @default(uuid())
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Cascade)
  brandId String
  city City @relation(fields:[cityId], references:[id], onDelete: Restrict)
  cityId String
  createdAt DateTime @default(now())
  spots Spot[]
  @@unique([brandId, cityId])
  @@index([cityId])
}
model BrandStaff {
  id String @id @default(uuid())
  user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  userId String @unique
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String
  kind StaffKind
  createdById String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  spotAdminProfiles SpotAdminProfile[]
  employeeProfiles EmployeeProfile[]
  @@unique([userId, brandId])
  @@index([brandId, kind])
}
model BrandTask {
  id String @id @default(uuid())
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Cascade)
  brandId String
  kind BrandTaskKind
  status BrandTaskStatus @default(ACTIVE)
  title String
  titleLocal Json?
  description String?
  descriptionLocal Json?
  multiplierPercent Int?            // 101..1000; 200 = x2
  appliesToOrders Boolean @default(true)
  appliesToTemplateAwards Boolean @default(true)
  startsOn DateTime? @db.Date
  endsOn DateTime? @db.Date
  config Json?                      // reserved for count-based kinds
  createdById String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  archivedAt DateTime?
  windows BrandTaskWindow[]         // empty = all day
  spots BrandTaskSpot[]             // empty = all spots
  transactions PointTransaction[]
  orders Order[]
  @@unique([id, brandId])
  @@index([brandId, status, kind])
}
model BrandTaskWindow {
  id String @id @default(uuid())
  task BrandTask @relation(fields:[taskId], references:[id], onDelete: Cascade)
  taskId String
  dayOfWeek Int                     // ISO 1..7
  startMinute Int                   // 0..1439
  endMinute Int                     // 1..1440, > startMinute
  @@index([taskId])
}
model BrandTaskSpot {
  task BrandTask @relation(fields:[taskId, brandId], references:[id, brandId], onDelete: Cascade, onUpdate: NoAction)
  taskId String
  spot Spot @relation(fields:[spotId, brandId], references:[id, brandId], onDelete: Cascade, onUpdate: NoAction)
  spotId String
  brandId String
  @@id([taskId, spotId])
  @@index([spotId])
}
model JobLease {
  name String @id
  lockedUntil DateTime @default(now())
  owner String?
  lastStartedAt DateTime?
  lastFinishedAt DateTime?
  lastError String?
  updatedAt DateTime @updatedAt
}

model User {
  // … (P0 adds resetFailedAttempts Int @default(0), resetLockedUntil DateTime?)
  mustChangePassword Boolean @default(false)
  birthDateSetAt DateTime?
  formerBrandId String?             // last brand after removal; only that brand may re-attach the account
  pointBalances PointBalance[]      // renamed from pointBalance so missed call sites fail loudly
  brandStaff BrandStaff?
  spotAdminProfiles SpotAdminProfile[]   // renamed
  employeeProfile EmployeeProfile?       // was a list
  spotsAdminProfile SpotsAdminProfile?   // deprecated; removed from the schema in N+1
}
model City { /* … */ timezone String @default("Europe/Warsaw") brandCities BrandCity[] }
model Spot {
  // … id is always generated by the server
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String
  brandAssignedAt DateTime?         // null = since forever; set by moveSpotToBrand
  brandCity BrandCity @relation(fields:[brandId, cityId], references:[brandId, cityId], onDelete: Restrict, onUpdate: NoAction)
  spotAdmins SpotAdminProfile[]
  employees EmployeeProfile[]
  taskSpots BrandTaskSpot[]
  pointTransactions PointTransaction[]
  redeemedPrizes UserPrize[] @relation("UserPrizeRedeemedAtSpot")
  @@unique([id, brandId])
  @@index([brandId, isActive])
  @@index([cityId, isActive])
}
model Order {
  // …
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String                    // DB-only TRANSITIONAL default <D>, not declared here
  pointsMultiplierPercent Int @default(100)
  pointsBrandTask BrandTask? @relation(fields:[pointsBrandTaskId], references:[id], onDelete: SetNull)
  pointsBrandTaskId String?
  qualifiedReferral Referral? @relation("ReferralQualifyingOrder")
  @@index([brandId, createdAt])
}
model Referral {
  // … pointsAwarded kept, mirrors status = AWARDED
  status ReferralStatus @default(PENDING)
  brand Brand? @relation(fields:[brandId], references:[id], onDelete: SetNull)
  brandId String?
  qualifyingOrder Order? @relation("ReferralQualifyingOrder", fields:[qualifyingOrderId], references:[id], onDelete: SetNull)
  qualifyingOrderId String? @unique
  awardedPoints Int?
  awardedAt DateTime?
  @@index([referrerId, status])
}
model SpotAdminProfile {
  id String @id @default(uuid())
  user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  userId String
  brandId String
  spot Spot @relation(fields:[spotId, brandId], references:[id, brandId], onDelete: Cascade, onUpdate: NoAction)
  spotId String
  membership BrandStaff @relation(fields:[userId, brandId], references:[userId, brandId], onDelete: Cascade, onUpdate: NoAction)
  createdById String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([userId, spotId])
  @@index([spotId])
  @@index([brandId])
}
model EmployeeProfile {
  id String @id @default(uuid())
  user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  userId String @unique
  brandId String
  spot Spot @relation(fields:[spotId, brandId], references:[id, brandId], onDelete: Cascade, onUpdate: NoAction)
  spotId String
  membership BrandStaff @relation(fields:[userId, brandId], references:[userId, brandId], onDelete: Cascade, onUpdate: NoAction)
  isFirstLogin Boolean @default(true)   // DEPRECATED: written in sync with mustChangePassword in N; removed from the schema in N+1; column dropped in N+2
  createdById String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([spotId])
  @@index([brandId])
}
model PointBalance {
  id String @id @default(uuid())
  user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  userId String
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String                    // TRANSITIONAL DB default
  totalPoints Int @default(0)
  availablePoints Int @default(0)
  lockedPoints Int @default(0)      // always 0
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([userId, brandId])
  @@index([brandId])
}
model PointTransaction {
  id String @id @default(uuid())
  user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  userId String
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String                    // TRANSITIONAL DB default
  spot Spot? @relation(fields:[spotId], references:[id], onDelete: SetNull)
  spotId String?
  type TransactionType
  source LedgerSource?              // NOT NULL from N+1
  amount Int                        // signed
  basePoints Int?
  multiplierPercent Int @default(100)
  brandTask BrandTask? @relation(fields:[brandTaskId], references:[id], onDelete: SetNull)
  brandTaskId String?
  templateId String?
  description String                // always names the brand
  referenceId String?
  referenceType String?             // order | order_apology | spot | prize | prize_refund | referral | birthday
  idempotencyKey String? @unique    // NOT NULL from N+1
  actorUserId String?
  balanceBefore Int
  balanceAfter Int
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
  @@index([userId, brandId, createdAt])
  @@index([brandId, createdAt])
  @@index([spotId, createdAt])
}
model Prize {
  // …
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String
  archivedAt DateTime?
  createdById String?
  @@unique([id, brandId])
  @@index([brandId, isActive, pointsCost])
}
model UserPrize {
  id String @id @default(uuid())
  user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  userId String
  prize Prize @relation(fields:[prizeId, brandId], references:[id, brandId], onDelete: Restrict, onUpdate: NoAction)
  prizeId String
  brand Brand @relation(fields:[brandId], references:[id], onDelete: Restrict)
  brandId String
  claimKey String? @unique          // prize_claim:{userId}:{requestId}
  qrCode String @unique
  isRedeemed Boolean @default(false)
  redeemedAt DateTime?
  redeemedAtSpot Spot? @relation("UserPrizeRedeemedAtSpot", fields:[redeemedAtSpotId], references:[id], onDelete: SetNull)
  redeemedAtSpotId String?
  redeemedById String?
  reminderSentAt DateTime?
  refundedAt DateTime?
  claimedAt DateTime @default(now())
  validUntil DateTime
  @@index([userId, isRedeemed])
  @@index([userId, brandId, isRedeemed])
  @@index([brandId, isRedeemed, validUntil])
}
model Notification { /* … */ spotId String? brandId String? @@index([userId, spotId, isRead, createdAt]) }
model DeviceToken { /* … */ activeSpotId String? clientApp String? appVersion String? }
model StaffLoginSession { /* … */ brandId String? event String @default("LOGIN") clientApp String? @@index([brandId, loginAt]) }
model Quest { /* unchanged, frozen */ }
model PointTemplate { /* unchanged; brand = spot.brandId */ }
model SpotsAdminProfile { /* deprecated; removed from the schema in N+1; table dropped in N+2 */ }
```

**Rule for the overlapping composite relations** (Spot, SpotAdminProfile, EmployeeProfile, BrandTaskSpot, UserPrize): write them only with scalar ("unchecked") inputs, never with nested `create` or `connect`. If `prisma validate` rejects one of these relations, drop that composite FK and enforce the rule in the service layer instead.

**Call sites that break when relation shapes change** (the build is `tsc --noCheck`, so these fail at runtime; all are fixed in N):
- `pointBalance` keyed on `userId`: `OrderPointsService.ts:82-108, 141-179`; `PointsResolver.ts:83, 88, 112, 127-141, 212-234, 470-576`; `PrizeResolver.ts:162-176`; `UserResolver.ts:178-212`; `authRoutes.ts:815-822, 979-986`.
- Nested wallet creates: `AuthResolver.ts:96-107, 215-217, 296-302`; `authRoutes.ts:363-370, 584-594, 780-790, 947-957`; `prisma/seed.ts:196-202`.
- `spotAdminProfile` used as a single object: `AdminResolver.ts:558-562, 765-767, 820-824, 855-865, 935-944`; `authRoutes.ts:222`.
- `employeeProfile` used as a list: `AdminResolver.ts:863, 901, 942`; `authRoutes.ts:217, 1169`.
- Creates without `brandId`: `SpotResolver.ts:409`; `PrizeResolver.ts:200, 334`; `prisma/seed-orders.ts:37-62`.
- Already broken and rewritten: `SpotResolver.ts:548-605`; `SubscriptionResolver.ts:103, 298-303`.

### 2.3 Migrations

**Principles**
- Folder names use the real generation timestamps (`prisma migrate dev --create-only` on a scratch DB). They must sort after `20260911140000_order_apology_points` and in the order below. Gate A.4 also checks that the sorted folder order equals the order applied on the snapshot.
- Each `migration.sql` runs as one implicit transaction. Atomicity is checked on the snapshot (§7.4).
- SQL inserts supply `id` and `updatedAt` explicitly.
- Hand-written SQL never compares `timestamp(3)` columns with `now()`.
- **Transitional DB defaults:** `Order.brandId`, `PointBalance.brandId` and `PointTransaction.brandId` get `DEFAULT '<D>'` in the database only, not in `schema.prisma`. The old instance keeps writing during the deploy overlap, and new code is forced to pass `brandId`. `migrate diff` must show exactly these three `DROP DEFAULT`s.
- M3 and M4 take table locks with `SET LOCAL lock_timeout = '10s'`, so concurrent old-instance writes queue instead of breaking the DDL.

**P0 migration `<ts>_auth_hardening`** (ships with release P0)
```sql
ALTER TABLE "User" ADD COLUMN "resetFailedAttempts" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "resetLockedUntil" TIMESTAMP(3);
```

**M1 `<ts>_role_brand_admin`** (its own file, so the value is committed before M9 uses it)
```sql
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BRAND_ADMIN';
```

**M2 `<ts>_brand_tenant_core`**
```sql
ALTER TABLE "City" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Warsaw';
UPDATE "City" SET "timezone"='Europe/Kyiv' WHERE "country" ILIKE 'ukrain%' OR "name" IN ('Lviv','Lwów','Lvov','Kyiv','Kiev');
CREATE TABLE "Brand" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "descriptionLocal" JSONB, "logoUrl" TEXT, "coverUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "deactivatedAt" TIMESTAMP(3), "maxSpots" INTEGER NOT NULL DEFAULT 1, "billingNote" TEXT,
  "birthdayBonusEnabled" BOOLEAN NOT NULL DEFAULT false, "birthdayBonusPoints" INTEGER NOT NULL DEFAULT 0,
  "referralBonusPoints" INTEGER NOT NULL DEFAULT 0, "fallbackPointsPerPln" INTEGER NOT NULL DEFAULT 1,
  "manualAwardCap" INTEGER NOT NULL DEFAULT 1000, "staffDailyAwardCap" INTEGER NOT NULL DEFAULT 0, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Brand_limits_check" CHECK ("maxSpots" >= 0 AND "birthdayBonusPoints" BETWEEN 0 AND 100000
    AND "referralBonusPoints" BETWEEN 0 AND 100000 AND "fallbackPointsPerPln" BETWEEN 0 AND 1000
    AND "manualAwardCap" BETWEEN 0 AND 1000000 AND "staffDailyAwardCap" BETWEEN 0 AND 1000000));
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");
CREATE TABLE "BrandCity" ("id" TEXT NOT NULL, "brandId" TEXT NOT NULL, "cityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BrandCity_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "BrandCity_brandId_cityId_key" ON "BrandCity"("brandId","cityId");
CREATE INDEX "BrandCity_cityId_idx" ON "BrandCity"("cityId");
ALTER TABLE "BrandCity" ADD CONSTRAINT "BrandCity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandCity" ADD CONSTRAINT "BrandCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
INSERT INTO "Brand" ("id","name","maxSpots","isActive","createdAt","updatedAt")
  SELECT '00000000-0000-4000-8000-000000000001','Loodly',GREATEST(COUNT(*)::int,1),true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "Spot"
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "BrandCity" ("id","brandId","cityId","createdAt")
  SELECT 'bc_default_'||c."cityId",'00000000-0000-4000-8000-000000000001',c."cityId",CURRENT_TIMESTAMP FROM (SELECT DISTINCT "cityId" FROM "Spot") c
  ON CONFLICT ("brandId","cityId") DO NOTHING;
ALTER TABLE "Spot" ADD COLUMN "brandId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001', ADD COLUMN "brandAssignedAt" TIMESTAMP(3);
ALTER TABLE "Spot" ALTER COLUMN "brandId" DROP DEFAULT;
CREATE UNIQUE INDEX "Spot_id_brandId_key" ON "Spot"("id","brandId");
CREATE INDEX "Spot_brandId_isActive_idx" ON "Spot"("brandId","isActive");
CREATE INDEX "Spot_cityId_isActive_idx" ON "Spot"("cityId","isActive");
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_brandId_cityId_fkey" FOREIGN KEY ("brandId","cityId") REFERENCES "BrandCity"("brandId","cityId") ON DELETE RESTRICT ON UPDATE NO ACTION;
```

**M3 `<ts>_staff_membership`** (membership only; `User.roles` is **not** changed here, see M9)
```sql
SET LOCAL lock_timeout = '10s';
LOCK TABLE "SpotAdminProfile", "EmployeeProfile" IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE "_brand_cutover_affected" ("userId" TEXT PRIMARY KEY, "reason" TEXT NOT NULL);   -- consumed and dropped in M9
CREATE TYPE "StaffKind" AS ENUM ('BRAND_ADMIN','SPOT_ADMIN','EMPLOYEE');
CREATE TABLE "BrandStaff" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "brandId" TEXT NOT NULL, "kind" "StaffKind" NOT NULL, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "BrandStaff_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "BrandStaff_userId_key" ON "BrandStaff"("userId");
CREATE UNIQUE INDEX "BrandStaff_userId_brandId_key" ON "BrandStaff"("userId","brandId");
CREATE INDEX "BrandStaff_brandId_kind_idx" ON "BrandStaff"("brandId","kind");
ALTER TABLE "BrandStaff" ADD CONSTRAINT "BrandStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandStaff" ADD CONSTRAINT "BrandStaff_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Dedupe employees (pre-flight C1 expects 0 rows). Cannot fail.
DELETE FROM "EmployeeProfile" e USING "EmployeeProfile" k WHERE e."userId"=k."userId" AND (k."createdAt",k."id") < (e."createdAt",e."id");
-- Memberships, highest rank first.
INSERT INTO "BrandStaff" ("id","userId","brandId","kind","createdAt","updatedAt")
  SELECT 'bs_'||u."id",u."id",'00000000-0000-4000-8000-000000000001','BRAND_ADMIN',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "User" u
  WHERE u."accountType"='ADMIN' AND 'SPOTS_ADMIN'=ANY(u."roles") AND NOT ('SUPER_ADMIN'=ANY(u."roles")) ON CONFLICT ("userId") DO NOTHING;
INSERT INTO "BrandStaff" ("id","userId","brandId","kind","createdAt","updatedAt")
  SELECT 'bs_'||p."userId",p."userId",'00000000-0000-4000-8000-000000000001','SPOT_ADMIN',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  FROM (SELECT DISTINCT sp."userId" FROM "SpotAdminProfile" sp JOIN "User" u ON u."id"=sp."userId"
        WHERE u."accountType"='ADMIN' AND NOT ('SUPER_ADMIN'=ANY(u."roles"))) p ON CONFLICT ("userId") DO NOTHING;
INSERT INTO "BrandStaff" ("id","userId","brandId","kind","createdAt","updatedAt")
  SELECT 'bs_'||p."userId",p."userId",'00000000-0000-4000-8000-000000000001','EMPLOYEE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  FROM (SELECT DISTINCT ep."userId" FROM "EmployeeProfile" ep JOIN "User" u ON u."id"=ep."userId"
        WHERE u."accountType"='ADMIN' AND NOT ('SUPER_ADMIN'=ANY(u."roles"))) p ON CONFLICT ("userId") DO NOTHING;
-- Record who must re-login (M9 bumps tokenVersion).
INSERT INTO "_brand_cutover_affected" SELECT "id",'SPOTS_ADMIN' FROM "User" WHERE 'SPOTS_ADMIN'=ANY("roles") ON CONFLICT DO NOTHING;
INSERT INTO "_brand_cutover_affected" SELECT DISTINCT p."userId",'PROFILE_REMOVED' FROM "SpotAdminProfile" p
  WHERE NOT EXISTS (SELECT 1 FROM "BrandStaff" b WHERE b."userId"=p."userId" AND b."kind"='SPOT_ADMIN') ON CONFLICT DO NOTHING;
INSERT INTO "_brand_cutover_affected" SELECT DISTINCT e."userId",'PROFILE_REMOVED' FROM "EmployeeProfile" e
  WHERE NOT EXISTS (SELECT 1 FROM "BrandStaff" b WHERE b."userId"=e."userId" AND b."kind"='EMPLOYEE') ON CONFLICT DO NOTHING;
INSERT INTO "_brand_cutover_affected" SELECT u."id",'ORPHAN' FROM "User" u
  WHERE u."accountType"='ADMIN' AND u."roles" && ARRAY['SPOT_ADMIN','EMPLOYEE']::"Role"[]
    AND NOT EXISTS (SELECT 1 FROM "BrandStaff" b WHERE b."userId"=u."id") ON CONFLICT DO NOTHING;
DELETE FROM "SpotAdminProfile" p WHERE NOT EXISTS (SELECT 1 FROM "BrandStaff" b WHERE b."userId"=p."userId" AND b."kind"='SPOT_ADMIN');
DELETE FROM "EmployeeProfile"  e WHERE NOT EXISTS (SELECT 1 FROM "BrandStaff" b WHERE b."userId"=e."userId" AND b."kind"='EMPLOYEE');
-- SpotAdminProfile
ALTER TABLE "SpotAdminProfile" ADD COLUMN "brandId" TEXT, ADD COLUMN "createdById" TEXT;
UPDATE "SpotAdminProfile" p SET "brandId"=s."brandId" FROM "Spot" s WHERE s."id"=p."spotId";
ALTER TABLE "SpotAdminProfile" ALTER COLUMN "brandId" SET NOT NULL;
DROP INDEX "SpotAdminProfile_userId_key";
CREATE UNIQUE INDEX "SpotAdminProfile_userId_spotId_key" ON "SpotAdminProfile"("userId","spotId");
CREATE INDEX "SpotAdminProfile_brandId_idx" ON "SpotAdminProfile"("brandId");
ALTER TABLE "SpotAdminProfile" DROP CONSTRAINT "SpotAdminProfile_spotId_fkey";
ALTER TABLE "SpotAdminProfile" ADD CONSTRAINT "SpotAdminProfile_spotId_brandId_fkey" FOREIGN KEY ("spotId","brandId") REFERENCES "Spot"("id","brandId") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "SpotAdminProfile" ADD CONSTRAINT "SpotAdminProfile_userId_brandId_fkey" FOREIGN KEY ("userId","brandId") REFERENCES "BrandStaff"("userId","brandId") ON DELETE CASCADE ON UPDATE NO ACTION;
-- EmployeeProfile
ALTER TABLE "EmployeeProfile" ADD COLUMN "brandId" TEXT, ADD COLUMN "createdById" TEXT;
UPDATE "EmployeeProfile" e SET "brandId"=s."brandId" FROM "Spot" s WHERE s."id"=e."spotId";
ALTER TABLE "EmployeeProfile" ALTER COLUMN "brandId" SET NOT NULL;
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");
DROP INDEX "EmployeeProfile_userId_spotId_key";
CREATE INDEX "EmployeeProfile_brandId_idx" ON "EmployeeProfile"("brandId");
ALTER TABLE "EmployeeProfile" DROP CONSTRAINT "EmployeeProfile_spotId_fkey";
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_spotId_brandId_fkey" FOREIGN KEY ("spotId","brandId") REFERENCES "Spot"("id","brandId") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_brandId_fkey" FOREIGN KEY ("userId","brandId") REFERENCES "BrandStaff"("userId","brandId") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "formerBrandId" TEXT;
UPDATE "User" u SET "mustChangePassword"=true FROM "EmployeeProfile" e WHERE e."userId"=u."id" AND e."isFirstLogin"=true;
INSERT INTO "_brand_cutover_affected" SELECT "id",'MUST_CHANGE_PASSWORD' FROM "User" WHERE "mustChangePassword" ON CONFLICT DO NOTHING;
```

**M4 `<ts>_loyalty_reset_brand_ledger`**
```sql
SET LOCAL lock_timeout = '10s';
LOCK TABLE "Prize","UserPrize","PointBalance","PointTransaction" IN SHARE ROW EXCLUSIVE MODE;
DELETE FROM "UserPrize"; DELETE FROM "PointTransaction"; DELETE FROM "PointBalance"; DELETE FROM "Prize"; DELETE FROM "QuestCompletion"; DELETE FROM "Quest";
CREATE TYPE "LedgerSource" AS ENUM ('ORDER','ORDER_APOLOGY','ORDER_REVERSAL','STAFF_TEMPLATE','STAFF_CUSTOM','REFERRAL_REFERRER','REFERRAL_REFEREE',
  'BIRTHDAY','PRIZE_CLAIM','PRIZE_REFUND','ADMIN_ADJUSTMENT','LEGACY');
ALTER TABLE "PointBalance" ADD COLUMN "brandId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
DROP INDEX "PointBalance_userId_key";
CREATE UNIQUE INDEX "PointBalance_userId_brandId_key" ON "PointBalance"("userId","brandId");
CREATE INDEX "PointBalance_brandId_idx" ON "PointBalance"("brandId");
ALTER TABLE "PointBalance" ADD CONSTRAINT "PointBalance_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointBalance" ADD CONSTRAINT "PointBalance_nonnegative_check" CHECK ("availablePoints">=0 AND "totalPoints">=0 AND "lockedPoints">=0);
ALTER TABLE "PointTransaction" ADD COLUMN "brandId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  ADD COLUMN "spotId" TEXT, ADD COLUMN "source" "LedgerSource", ADD COLUMN "basePoints" INTEGER,
  ADD COLUMN "multiplierPercent" INTEGER NOT NULL DEFAULT 100, ADD COLUMN "brandTaskId" TEXT, ADD COLUMN "templateId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT, ADD COLUMN "actorUserId" TEXT;
CREATE UNIQUE INDEX "PointTransaction_idempotencyKey_key" ON "PointTransaction"("idempotencyKey");
CREATE INDEX "PointTransaction_userId_brandId_createdAt_idx" ON "PointTransaction"("userId","brandId","createdAt");
CREATE INDEX "PointTransaction_brandId_createdAt_idx" ON "PointTransaction"("brandId","createdAt");
CREATE INDEX "PointTransaction_spotId_createdAt_idx" ON "PointTransaction"("spotId","createdAt");
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prize" ADD COLUMN "brandId" TEXT NOT NULL, ADD COLUMN "archivedAt" TIMESTAMP(3), ADD COLUMN "createdById" TEXT;
CREATE UNIQUE INDEX "Prize_id_brandId_key" ON "Prize"("id","brandId");
CREATE INDEX "Prize_brandId_isActive_pointsCost_idx" ON "Prize"("brandId","isActive","pointsCost");
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_stock_check" CHECK ("pointsCost">0 AND "claimed">=0 AND ("quantity" IS NULL OR "claimed"<="quantity"));
ALTER TABLE "UserPrize" ADD COLUMN "brandId" TEXT NOT NULL, ADD COLUMN "claimKey" TEXT, ADD COLUMN "redeemedAtSpotId" TEXT, ADD COLUMN "redeemedById" TEXT,
  ADD COLUMN "reminderSentAt" TIMESTAMP(3), ADD COLUMN "refundedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "UserPrize_claimKey_key" ON "UserPrize"("claimKey");
ALTER TABLE "UserPrize" DROP CONSTRAINT "UserPrize_prizeId_fkey";
ALTER TABLE "UserPrize" ADD CONSTRAINT "UserPrize_prizeId_brandId_fkey" FOREIGN KEY ("prizeId","brandId") REFERENCES "Prize"("id","brandId") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "UserPrize" ADD CONSTRAINT "UserPrize_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserPrize" ADD CONSTRAINT "UserPrize_redeemedAtSpotId_fkey" FOREIGN KEY ("redeemedAtSpotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "UserPrize_userId_brandId_isRedeemed_idx" ON "UserPrize"("userId","brandId","isRedeemed");
CREATE INDEX "UserPrize_brandId_isRedeemed_validUntil_idx" ON "UserPrize"("brandId","isRedeemed","validUntil");
```

**M5 `<ts>_brand_tasks_order_snapshot`**
- Tables `BrandTask`, `BrandTaskWindow` and `BrandTaskSpot`, as in §2.2, with these constraints:
  - `BrandTask_multiplier_check`: `kind <> 'POINTS_MULTIPLIER' OR multiplierPercent BETWEEN 101 AND 1000`.
  - `BrandTask_dates_check`: `endsOn >= startsOn` when both are set.
  - `BrandTaskWindow_range_check`: dayOfWeek 1..7, startMinute 0..1439, endMinute 1..1440, endMinute > startMinute.
  - Composite FKs on `BrandTaskSpot` with `ON UPDATE NO ACTION`.
- `PointTransaction_brandTaskId_fkey`, `ON DELETE SET NULL`.
- Order columns, then index and FKs:

```sql
ALTER TABLE "Order" ADD COLUMN "brandId" TEXT NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  ADD COLUMN "pointsMultiplierPercent" INTEGER NOT NULL DEFAULT 100, ADD COLUMN "pointsBrandTaskId" TEXT;
UPDATE "Order" o SET "brandId"=s."brandId" FROM "Spot" s WHERE s."id"=o."spotId" AND o."brandId"<>s."brandId";
```

Then add `Order_brandId_createdAt_idx`, `Order_brandId_fkey` (`RESTRICT`) and `Order_pointsBrandTaskId_fkey` (`SET NULL`).

**M6 `<ts>_referral_birthday_brand`**
- Create `ReferralStatus`, add the Referral columns, the unique `qualifyingOrderId`, the index and FKs (as §2.2).
- Then:

```sql
UPDATE "Referral" r SET "status"='CLOSED', "pointsAwarded"=false
 WHERE r."pointsAwarded"=true OR EXISTS (SELECT 1 FROM "Order" o WHERE o."userId"=r."referredUserId" AND o."status" IN ('DELIVERED','COLLECTED'));
ALTER TABLE "User" ADD COLUMN "birthDateSetAt" TIMESTAMP(3);
UPDATE "User" SET "birthDateSetAt"="createdAt" WHERE "birthDate" IS NOT NULL;
```

**M7 `<ts>_loyalty_code_backfill`** cannot fail.
- A PL/pgSQL loop over CLIENT users whose `loyaltyCode IS NULL`.
- Each candidate is `'GL-'` plus 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- On `unique_violation` it retries; after 20 attempts it leaves the code NULL, and the code is then assigned lazily in `me` (`AuthResolver.ts:337-366`).

**M8 `<ts>_ops_notifications_jobs`**
- Add `Notification.spotId` and `brandId`, plus the index `(userId, spotId, isRead, createdAt)`.
- Add `DeviceToken.activeSpotId`, `clientApp` and `appVersion`.
- Add `StaffLoginSession.brandId`, `event` (default `'LOGIN'`) and `clientApp`, plus an index; backfill `brandId` from the spot.
- Create `JobLease` and seed its rows:

```sql
INSERT INTO "JobLease" ("name","updatedAt") VALUES ('birthday',CURRENT_TIMESTAMP),('reward_expiry',CURRENT_TIMESTAMP),('order_points_sweeper',CURRENT_TIMESTAMP)
  ON CONFLICT DO NOTHING;
```

**M9 `<ts>_staff_roles_cutover`** is the last file, so that if M2–M8 fail, the old Prisma client can still read `User.roles`.
```sql
UPDATE "User" u SET "roles" = array_append(array_remove(array_remove(array_remove(array_remove(u."roles",
    'SPOTS_ADMIN'::"Role"),'BRAND_ADMIN'::"Role"),'SPOT_ADMIN'::"Role"),'EMPLOYEE'::"Role"), b."kind"::text::"Role")
  FROM "BrandStaff" b WHERE b."userId"=u."id";
UPDATE "User" SET "roles"=array_remove("roles",'SPOTS_ADMIN'::"Role") WHERE 'SPOTS_ADMIN'=ANY("roles");
UPDATE "User" SET "tokenVersion"="tokenVersion"+1 WHERE "id" IN (SELECT "userId" FROM "_brand_cutover_affected");
DROP TABLE "_brand_cutover_affected";
```
Effect: ex-SPOTS_ADMIN users, orphans, users whose profiles were removed and users who must change their password are all forced through REST login, so they see the designed 426 or 403 responses or the password-change step.

**Contract migration N+1 `<ts>_brand_contract`** ships at least one week after N, with clean logs.
```sql
ALTER TABLE "Order" ALTER COLUMN "brandId" DROP DEFAULT;
ALTER TABLE "PointBalance" ALTER COLUMN "brandId" DROP DEFAULT;
ALTER TABLE "PointTransaction" ALTER COLUMN "brandId" DROP DEFAULT;
UPDATE "PointTransaction" SET "source"='LEGACY' WHERE "source" IS NULL;
UPDATE "PointTransaction" SET "idempotencyKey"='legacy:'||"id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "PointTransaction" ALTER COLUMN "source" SET NOT NULL, ALTER COLUMN "idempotencyKey" SET NOT NULL;
UPDATE "Referral" SET "status"='CLOSED' WHERE "status"='PENDING' AND "pointsAwarded"=true;   -- overlap leftovers
DELETE FROM "PointBalance" pb WHERE NOT EXISTS (SELECT 1 FROM "PointTransaction" t WHERE t."userId"=pb."userId" AND t."brandId"=pb."brandId")
  AND (pb."availablePoints"=0 AND pb."totalPoints"=0 OR EXISTS (SELECT 1 FROM "User" u WHERE u."id"=pb."userId" AND u."accountType"<>'CLIENT'));
```
In the same release, `schema.prisma` makes `source` and `idempotencyKey` required, and removes `EmployeeProfile.isFirstLogin`, `SpotsAdminProfile` and `User.spotsAdminProfile`, together with every code reference to them (`seed.ts:40` included). The columns and table stay in the database for now.

**N+2 `<ts>_drop_deprecated`** ships after N+1 is stable: `ALTER TABLE "EmployeeProfile" DROP COLUMN "isFirstLogin"; DROP TABLE "SpotsAdminProfile";`. `SPOTS_ADMIN` stays in the enum permanently.

### 2.4 Seed (`prisma/seed.ts`)

- **Run mode:** `TS_NODE_TRANSPILE_ONLY=1`; calls `StaffService` with `{ notify: false }`, so no emails are sent.
- **Wipe order:** employeeProfile, spotAdminProfile, brandTaskSpot, spot, brandCity, city, userPrize, prize, pointTransaction, pointBalance, brandTaskWindow, brandTask, referral, other dependents, brandStaff, brand, user.
- **Super admin:** gets `accountType: ADMIN` (missing today at `seed.ts:47-56`).
- **Brands:**
  - Brand A: Warsaw and Kraków.
  - Brand B: Warsaw and Lviv. The Lviv city is created with `timezone: 'Europe/Kyiv'` and has a Lviv spot.
  - Each brand gets `maxSpots`, birthday and referral settings.
  - Brand A also has one draft spot.
- **Prizes:** split across both brands.
- **Staff:** one BRAND_ADMIN per brand, one SPOT_ADMIN with 2 spots, one EMPLOYEE.
- **Clients:** every client gets a code from `ensureLoyaltyCode`, and wallets are written only through `LoyaltyLedger`. Personas:
  - points at 2 brands;
  - points at 1 brand;
  - 0 points with `preferredCityId` set to Warsaw;
  - one unredeemed UserPrize;
  - in Kraków with 0 points (ONE_TO_DISCOVER);
  - no city;
  - a city with no brands;
  - a `ua` client in Lviv.
- **Promotion:** one ACTIVE multiplier task. Its window is clamped to the same local day (now−2h … now+2h, intersected with [00:00, 24:00); split into two rows if needed).
- **Orders:** `seed-orders.ts` passes `brandId: spot.brandId`.

### 2.5 Access layer

**`src/auth/access.ts` API** (signatures are final):
```ts
export enum AccessLevel { NONE=0, OPERATE=10, MANAGE_SPOT=20, MANAGE_BRAND=30, PLATFORM=40 }
export interface ClientInfo { app:'client'|'spot'|'courier'|'landing'|'admin-web'; version:string; api:number }
export interface AccessCtx { req:{ user?:User|null }; prisma:PrismaClient; client?:ClientInfo|null; ws?:{ userId:string; tokenVersion:number } }
export interface SpotRef { id; name; brandId; brandName; brandActive; brandDeactivatedAt: Date|null; cityId; timezone; isActive }
export type StaffScope =
  | { kind:'PLATFORM'; userId }
  | { kind:'BRAND_ADMIN'|'SPOT_ADMIN'|'EMPLOYEE'; userId; brandId; brandActive; spotIds: ReadonlySet<string> } // incl. inactive spots
  | { kind:'NONE'; userId:string|null; reason:'NOT_STAFF'|'DISABLED'|'NO_MEMBERSHIP'|'ROLE_DRIFT'|'PASSWORD_CHANGE_REQUIRED' };
effectiveRoles(user): Role[]                          // staff roles only on ADMIN accounts (I7)
loadStaffScope(prisma, user): Promise<StaffScope>     // uncached
getStaffScope(ctx): Promise<StaffScope>               // memo per HTTP request; per WS operation with a 60 s TTL, re-reading the User row (§2.10)
levelForSpot(scope, spot) / levelForBrand(scope, brandId): AccessLevel
assertSpotAccess(ctx, spotId, level, opts?:{ requireActiveBrand?:boolean; requireActiveSpot?:boolean; allowRedeemGrace?:boolean }): Promise<SpotRef>
assertOrderAccess(ctx, orderId, level): Promise<{ order; spot:SpotRef }>   // brand staff: order.brandId must equal scope.brandId
canReadOrder(ctx, order): Promise<boolean>
assertBrandAccess(ctx, brandId, level=MANAGE_BRAND)
resolveBrandForWrite(ctx, requestedBrandId?): Promise<string>     // brand staff: own brand (any other id → SCOPE_FORBIDDEN); PLATFORM: required
accessibleSpots(ctx, min, opts?:{ activeOnly?:boolean }): Promise<SpotRef[]>
accessibleSpotIdSet(ctx, min): Promise<Set<string>|'ALL'>
resolveEffectiveSpot(ctx, spotId|undefined, level, opts?:{ allowNone?; requireActiveBrand?; requireActiveSpot? }): Promise<SpotRef|null>
  // an EXPLICIT spotId always asserts (SCOPE_FORBIDDEN); allowNone applies only when the spotId is absent AND no legacy spot resolves
resolveLegacySpotId(prisma, scope): Promise<string|null>          // prefers active spots; deterministic order (createdAt, id)
assertResourceAccess(ctx, kind:'taste'|'product'|'pointTemplate'|'news'|'complaint'|'courierApplication'|'prize'|'brandTask'|'userPrize', id, level)
assertCanManageStaff(ctx, targetUserId, action:'VIEW'|'RESEND_INVITE'|'RESET_PASSWORD'|'DISABLE'|'ASSIGN_SPOTS'|'MOVE'|'CHANGE_KIND'|'REMOVE')
assertCanCreateStaff(ctx, kind, spotIds, requestedBrandId?): Promise<{ brandId }>
historyCutoff(spot): Date|null        // spot.brandAssignedAt when the caller is brand staff; null for PLATFORM
CRUCIAL_SPOT_FIELDS = ['name','address','latitude','longitude','isActive','cityId']
requiredLevelForSpotUpdate(current, args): AccessLevel   // MANAGE_BRAND only when a crucial value CHANGES (trimmed strings; |Δlat/lng| > 1e-7)
isLegacyClient(ctx): boolean          // x-loodly-api / connectionParams.api absent or < 2
```

**Option defaults.** `requireActiveSpot` and `requireActiveBrand` default to `true` for:
- staff awards (template and custom) and the legacy award path;
- `staffScan` when it leads to an award or a reward hand-over;
- `validatePrizeQR` and `handOverReward`;
- `createSpotNews`, `addSpotNewsImage`, spot `updateNews`, `commentNews` as the spot;
- `inviteStaff`, `createPrize`, `createBrandTask`.

`allowRedeemGrace` lets reward redemption pass for 30 days after `brand.deactivatedAt`.

These stay allowed on inactive spots and inactive brands:
- operations on existing orders (finishing in-flight work);
- reads;
- MANAGE_SPOT configuration writes on draft spots: menu, hours, photos, templates, employees.

**`authChecker`** (`src/middleware/authMiddleware.ts:55-72`):
```ts
const user = context.req?.user;
if (!user) throw new AuthenticationError('Access denied! You need to be authorized to perform this action!'); // code UNAUTHENTICATED; keeps the substring old builds use to refresh/log out
if (roles.length === 0) return true;
if (effectiveRoles(user).some(r => roles.includes(r))) return true;
throw new ScopeError(msg(user,'SCOPE_FORBIDDEN'), 'SCOPE_FORBIDDEN');   // authenticated: never a logout trigger
```
- `authMiddleware` and the WS context leave the user unset when `loginDisabled` is set.
- `refreshToken` (`AuthResolver.ts:371-394`) rejects disabled users.
- When `mustChangePassword` is true, the request becomes a **restricted session**: only `me`, `myStaffContext` and REST `/admin/change-password` work. Everything else throws `PASSWORD_CHANGE_REQUIRED`, which never triggers a logout.

**Decorators and messages**
- Every operation reachable from any mobile-spot build uses `@Authorized(...STAFF_ROLES)`. Admin-web-only operations use `BRAND_ROLES` or `PLATFORM_ROLES`. The level check inside the resolver is the authoritative one.
- Messages for ScopeError and every new error are localized (pl/en/ua) from `user.language`. They never contain "access denied", "unauthorized", "not authenticated", "unauthenticated", "jwt", "invalid token", "network" or "failed to fetch". They never contain "already", because `OrderAlertProvider.tsx:165-171` silently drops a claim on that word.
- Texts:
  - OPERATE: "You can only work with spots you are assigned to."
  - MANAGE_SPOT: "Only an admin of this spot can do this."
  - MANAGE_BRAND: "Only the brand admin can change this."
  - PLATFORM: "Only the Loodly team can do this."
  - BRAND_INACTIVE: "This brand is currently inactive."
  - SPOT_INACTIVE: "This spot is not open yet or is closed."
  - SPOT_REQUIRED: "Choose a spot first."

**Scope resolution, in order**
1. No user → NOT_STAFF.
2. `loginDisabled` → DISABLED.
3. Not an ADMIN account, or no staff role → NOT_STAFF.
4. SUPER_ADMIN → PLATFORM.
5. Load `BrandStaff` with its profiles in one query. If it is missing → NO_MEMBERSHIP.
6. `roles` does not include the kind → ROLE_DRIFT (logged as an error).
7. BRAND_ADMIN gets every brand spot. SPOT_ADMIN gets its profile spots. EMPLOYEE gets exactly one profile; anything else is ROLE_DRIFT.
8. Brand inactive: the scope is not downgraded; it carries `brandActive=false` instead.

**`StaffService` rules**
- **Single transaction per change.** Each membership change runs in one transaction: delete profiles → update the kind → set roles → create profiles.
- **Legacy-build re-login.** Assignment changes bump `tokenVersion` when the target's latest `StaffLoginSession.clientApp IS NULL` (a legacy build). `removeStaffMember` always bumps. Every removal, disable, move or password reset also:
  - closes the target's WS sockets (`RealtimeRegistry.closeUser`);
  - deactivates their DeviceTokens and unsubscribes them from FCM topics;
  - deletes their staff-scoped Notification rows (`spotId` or `brandId` not null);
  - and removal sets `formerBrandId`.
- **`inviteStaff` when the email already exists in the ADMIN namespace**:
  - Membership-less, not SUPER_ADMIN, and `formerBrandId` equals the caller's brand (or the caller is PLATFORM): re-attach roles, membership and profiles. **The password is never set or replaced and `loginDisabled` is never cleared**; the standard invite code email is sent.
  - Existing SPOT_ADMIN of the same brand invited as SPOT_ADMIN: spots are added and a "you now have access to…" email is sent.
  - Otherwise `STAFF_CONFLICT`. The other brand is never named.
- **Who can create which kind** (`assertCanCreateStaff`):
  - BRAND_ADMIN: PLATFORM only, with a `brandId`.
  - SPOT_ADMIN: one or more spots in one brand, MANAGE_BRAND on each.
  - EMPLOYEE: exactly one spot, MANAGE_SPOT on it. A SPOT_ADMIN asking for SPOT_ADMIN gets "Only the brand admin can add spot admins."
- **`assignSpotAdmin(spotId, userId)`** only accepts users who are already SPOT_ADMIN members of the caller's brand.
- **Invite rate limit:** 50 invites per brand per day (in memory), with a log line for each `STAFF_CONFLICT`.

### 2.6 Call-site migration

**Deleted helpers.** All of these are replaced by `access.ts`, together with the 44 runtime `roles.includes(…SPOTS_ADMIN)` bypasses:
- `AdminResolver.assertManagesSpot` (1003-1009)
- `OrderResolver.assertCanManageSpot` (1542-1555)
- `CheckPermissions.ts` (`canManageSpot`, `canViewSpotOrders`, `isAnyAdmin`)
- `ProductResolver` (8-35)
- `PointTemplateResolver` (45-63)
- `NewsResolver.assertCanManageSpot` (368-378)
- `SpotCourierResolver.assertSpotAccess` (144-153)
- the helpers in `SpotDashboardResolver` (61-68) and `ComplaintResolver` (58-65)
- `upload.ts` (42-76)
- `reports.ts` `canManageSpot` (103-109)

**AdminResolver, SpotResolver, UserResolver**

| Operation (line) | Decorator | Check / behavior |
|---|---|---|
| `adminAccounts` 439 | PLATFORM | Rows gain `kind`, `brandId`, `spotIds` (field resolvers on UserType) |
| `myAdminSpots` 452 | STAFF | `accessibleSpots(OPERATE)` |
| `createAdminAccount` 474 | PLATFORM | Only `role:'BRAND_ADMIN'` plus the new `brandId` → `StaffService.inviteBrandAdmin`; other roles are rejected |
| `inviteSpotAdmin` 517 (+`spotIds`) | STAFF | MANAGE_BRAND on each spot; adds spots, never moves the admin |
| `resendAdminInvite` 578 | STAFF | `assertCanManageStaff(RESEND_INVITE)`; link target chosen by kind (§2.9) |
| `createEmployee` 618, `createSpotStaff` 725, `inviteSpotStaff` 784 | STAFF | `assertCanCreateStaff`; signatures unchanged |
| `spotEmployees` 678, `spotStaffAdmins` 697 | STAFF | OPERATE. Below MANAGE_SPOT the projection is reduced: `id name firstName surname loginDisabled createdAt role`, with `email:''` and `phone`, `birthDate`, `loyaltyCode` null. `role` comes from `BrandStaff.kind` |
| `adminResetStaffPassword` 849 | STAFF | `assertCanManageStaff(RESET_PASSWORD)`; keeps today's code flow (emails a code, bumps tokenVersion) and does **not** set `mustChangePassword` |
| `setStaffLoginDisabled` 930, `setUserLoginDisabled` 636 | STAFF | `assertCanManageStaff(DISABLE)` plus the hygiene steps in §2.5 |
| `spotStaffSessions` 974 (+`includeSwitches: Boolean = false`) | STAFF | MANAGE_SPOT; brand staff see rows with `brandId = scope.brandId` |
| `spots` 269 / `spotsByCity` 307 | public | Inactive spots and spots of inactive brands are hidden; optional `brandId`; `includeInactive` is honored only for PLATFORM or for brand staff on their own brand |
| `spot` 293 | public | Keeps returning inactive spots and spots of inactive brands (old links, the console) |
| `createSpot` 388 | STAFF | `resolveBrandForWrite` (MANAGE_BRAND, active brand) → `BrandService.createSpot` (draft unless `activate:true`, server id, city must be a brand city, total cap) |
| `updateSpot` 441 (+`cityId`) | STAFF | `assertSpotAccess(id, requiredLevelForSpotUpdate(...))`; fixes the fail-open at 466-472; `isActive` goes through `withSpotSlot` |
| `setSpotActive` (new), `setSpotPhotos` 513 | STAFF | MANAGE_BRAND / MANAGE_SPOT |
| `deleteSpot` 532 | PLATFORM | Refused when orders exist ("Deactivate it instead") |
| `assignSpotAdmin` 550 / `removeSpotAdmin` 588 / `spotAdmins` 613 | BRAND / BRAND / STAFF | `StaffService`; MANAGE_BRAND / MANAGE_BRAND / MANAGE_SPOT |
| `user(id)` 52 | auth | Self, PLATFORM or `assertCanManageStaff(VIEW)` |
| `updateUserRoles` 234 | PLATFORM | Refuses BRAND_ADMIN, SPOT_ADMIN and EMPLOYEE (those go through `StaffService` only) |
| `updateProfile` | CLIENT/self | Adds `language: Language`; sets `birthDateSetAt`; the birthday credit at 160-166 is removed |

**Orders, payments, couriers**

| Operation | Check |
|---|---|
| `createOrder` 410 | Rejects an inactive brand (BRAND_INACTIVE). In the transaction it snapshots `brandId`, `pointsMultiplierPercent` and `pointsBrandTaskId`, evaluated at `placedAt` |
| `order` 719 | `canReadOrder` (fixes the fail-open at 736-766) |
| `orderMessages`, `postOrderMessage`, chat helper | Owner, assigned courier, or OPERATE; "as spot" attribution only with OPERATE |
| `spotOrders` 962, `spotAttentionOrders` 1026 | OPERATE; brand staff see orders with `Order.brandId = scope.brandId` |
| `claimOrder`, `updateOrderStatus`, `terminateOrder`, `redispatchOrder`, `collectablePickupOrders`, `collectPickupOrder` | `assertOrderAccess(OPERATE)`. Hooks are in §2.7.3. `collectPickupOrder` keeps returning `pointsAwarded: Int` from `onOrderCompleted(...).points` |
| `pickupOrdersElsewhere` (new) | OPERATE on `spotId` |
| `cancelPaymentIntent` 150 | Owner, or MANAGE_SPOT on `order.spotId` |
| `refundOrder` 197 | Adds `@Ctx`; MANAGE_SPOT |
| `courierProfile` 86 | PLATFORM, or MANAGE_SPOT on a spot the courier applied to or is approved at |
| `reviewCourierApplication` 362 | `assertResourceAccess('courierApplication', MANAGE_SPOT)` |
| `availableCouriers` 484, `assignOrderToCourier` 550 | OPERATE |
| `courierLocationHistory` 674 | Courier: own history. Staff: `orderId` required, plus `assertOrderAccess(OPERATE)` |
| `updateDeliveryStatus` 715 | Unchanged for couriers; adds the isolated completion hook after `publishOrderStatusChanged` |
| `spotCouriers`, `spotCourierDeliveries` | OPERATE |
| applications 203, earnings 230 | MANAGE_SPOT |
| `spotDashboard`, `spotComplaints`, `resolveComplaint` | MANAGE_SPOT. History filter for brand staff: `Order.brandId` through `orderId`, otherwise `createdAt >= historyCutoff(spot)` |
| `spotPayoutSummaries` (+`brandId`) | PLATFORM |

**Loyalty, menu, news, notifications**

| Operation | Check |
|---|---|
| `loyaltyCustomer` 67 (+`spotId`) | `resolveEffectiveSpot(spotId, OPERATE, {allowNone:true})`. Only CLIENT accounts are returned, with that brand's numbers. It never throws for a customer that was found |
| `myPointBalance` 122, `myPointTransactions` 151 | Self; never auto-creates a wallet; legacy rules in §2.7.9 |
| `awardPoints` 169 | `resolveEffectiveSpot(spotId, OPERATE, {requireActiveBrand, requireActiveSpot})`, **always** → `legacyAwardPoints` |
| `awardLoyaltyPoints`, `staffScan`, `handOverReward`, `validatePrizeQR` 236 | OPERATE with the active-brand and active-spot requirements (and the grace rule for redeem/hand-over) |
| `applyReferralCode` 326, `myReferralStats` 375 | CLIENT self |
| `claimBirthdayBonus` 421 | Always returns `false` |
| `awardReferralPoints` 470, `addPointsToUser` 521 | **Deleted** |
| `prizes` 38 | Public. `includeInactive` (which returns archived and disabled rewards) only for MANAGE_BRAND on the own brand, or PLATFORM |
| `redeemPrize` 128 | CLIENT → `claimPrize` |
| `createPrize`, `updatePrize` (+`validFrom`, `validUntil`), `deletePrize` | STAFF → `resolveBrandForWrite`, or `assertResourceAccess('prize', MANAGE_BRAND)`. Delete archives when a UserPrize exists. Pre-checks `quantity >= claimed` (REWARD_QUANTITY_BELOW_CLAIMED) |
| Point templates: list / create, update, delete | OPERATE / MANAGE_SPOT |
| Taste/Product create, update, delete / availability / `includeUnavailable` | MANAGE_SPOT (fixes Taste 103-108, 162-165, 252-258) / OPERATE / flag honored only with OPERATE |
| `quests`, `quest` / CRUD | Public (`includeInactive` PLATFORM only) / PLATFORM |
| `allNews`, `createNews`, global `updateNews`/`deleteNews`, broadcasts 316/340/364 | PLATFORM |
| `createSpotNews` 286, `addSpotNewsImage` 331, spot `updateNews`/`deleteNews` | MANAGE_SPOT, active brand and spot |
| `spotNews` 351 | OPERATE |
| `newsFeed`, `news(id)` | Filtered to active spots of active brands |
| `commentNews` as spot | OPERATE on `asSpotId`, active brand |
| `registerFCMToken` 22 (+`clientApp`, `appVersion`, `activeSpotId`) | Token dedupe (§2.10); `activeSpotId` checked with OPERATE |
| `myNotifications`, `unreadNotificationCount`, `markAllNotificationsRead` (+`spotId`) | Self; rows with a null `spotId` are always included |
| `createCity`, `updateCity` (+`timezone`) | PLATFORM; the IANA name is validated with `Intl.DateTimeFormat` |

**Subscriptions**
- Staff subscriptions (141-230): see §2.10.
- `courierRequest`: MANAGE_SPOT on `payload.spotId`.
- `courierLocationUpdated`: filtered through `CourierLocation.orderId → Order.userId`.

**Review gate.** Every resolver or route that takes a `spotId`, `orderId`, `prizeId`, `tasteId`, `productId`, `templateId`, `applicationId`, `taskId`, `brandId`, `userPrizeId` or a staff `userId` must call an `assert*` or `resolve*` helper before any scoped read or write. `scripts/verify/isolation-matrix.ts` walks `schema.gql` and fails if such an operation is missing from its matrix.

### 2.7 Loyalty engine

#### 2.7.1 API
```ts
// LoyaltyLedger.ts: the ONLY writer of PointBalance / PointTransaction
interface LedgerEntry { userId; brandId; spotId?; amount /*positive*/; type: TransactionType; source: LedgerSource; idempotencyKey;
  description; referenceType?; referenceId?; actorUserId?; basePoints?; multiplierPercent?; brandTaskId?; templateId? }
interface LedgerResult { applied: boolean; transaction: PointTransaction; availablePoints: number; totalPoints: number }
credit(tx, e, fx): Promise<LedgerResult>;  debit(tx, e, fx): Promise<LedgerResult>
// LoyaltyService.ts: each call runs withLoyaltyTx (timeout 10 s, maxWait 5 s, ≤3 retries on 40001/40P01/P2034), side effects flushed after commit
type OrderPointsResult = { applied: boolean; points: number; multiplierPercent: number }
awardOrderPoints(orderId): Promise<OrderPointsResult>          // points 0 when already awarded or not eligible
onOrderCompleted(orderId): Promise<OrderPointsResult>          // order points + referral
awardApologyPoints(orderId, points: 100|200|500, actorUserId): Promise<LedgerResult|null>
staffAward(ctx, i:{ spot; customer; templateId?; quantity?; points?; description?; requestId? }): Promise<StaffAwardResult>
legacyAwardPoints(ctx, i): Promise<boolean>
claimPrize(userId, prizeId, requestId?): Promise<UserPrize>
redeemUserPrize(spot, rawCode, staffUserId): Promise<UserPrize>
handOverReward(spot, userPrizeId, customerRaw, staffUserId): Promise<UserPrize>
creditBirthday(userId, brandId, year): Promise<LedgerResult|null>
processRewardExpiry(now): Promise<{ reminded; refunded }>
overview(userId, fallbackCityId?): Promise<LoyaltyOverview>
getWallet(userId, brandId): Promise<PointBalance|null>
// Hook wrapper used at every order call site:
safeLoyalty<T>(label, fn: () => Promise<T>, fallback: T): Promise<T>   // try/catch + Sentry; never rethrows
```
`OrderPointsService.awardOrderPointsIfNeeded(orderId, prisma): Promise<number>` becomes a delegate: `(await safeLoyalty('award', () => LoyaltyService.awardOrderPoints(id), {points:0})).points`. `creditBalance`, `awardReferralPoints` and `UserResolver.awardBirthdayBonus` are deleted.

**R-IDEM rule.** Every LoyaltyService operation checks `applied`. When it is `false`, the operation returns the stored result and performs **no** other side effect: no stock change, no UserPrize, no referral status change, no order flag.

#### 2.7.2 Ledger algorithm

**`credit`**, inside the caller's transaction:
1. `INSERT INTO "PointBalance" (id,userId,brandId,updatedAt) VALUES (…) ON CONFLICT ("userId","brandId") DO NOTHING`.
2. `SELECT availablePoints, totalPoints … FOR UPDATE`.
3. Compute `balanceBefore` and `balanceAfter` while holding the lock.
4. `INSERT INTO "PointTransaction" (…) VALUES (…) ON CONFLICT ("idempotencyKey") DO NOTHING RETURNING id`, through `$queryRaw`. This never aborts the transaction; a concurrent same-key insert waits and then does nothing.
5. If no row comes back, load the existing row by key:
   - if `(userId, brandId, signed amount, source, referenceType, referenceId)` match → return `{applied:false}`;
   - otherwise → throw `IDEMPOTENCY_CONFLICT`.
6. If inserted: `UPDATE "PointBalance" SET availablePoints += n, totalPoints += n`.
7. Queue `pointsUpdated` and any push in `fx`.

**`debit`** follows the same steps. Under the lock it requires `availablePoints >= amount` (otherwise `INSUFFICIENT_POINTS` with `extensions {missingPoints, brandId, brandName}`). The amount is negative, `totalPoints` never changes, and the CHECK constraint is the final backstop.

| Source | type / source | referenceType / referenceId | idempotencyKey |
|---|---|---|---|
| Order points | EARNED / ORDER | order / orderId | `order:{orderId}` |
| Apology | BONUS / ORDER_APOLOGY | order_apology / orderId | `order_apology:{orderId}` |
| Template / custom award | BONUS / STAFF_TEMPLATE, STAFF_CUSTOM | spot / spotId (+templateId) | `staff_award:{actorUserId}:{requestId}`; legacy calls use `staff_award:legacy:{uuid}` |
| Referral | REFERRAL / REFERRAL_REFERRER, REFERRAL_REFEREE | referral / referralId | `referral:{id}:referrer`, `referral:{id}:referee` |
| Birthday | BIRTHDAY / BIRTHDAY | birthday / {year} | `birthday:{userId}:{brandId}:{year}` |
| Reward claim | SPENT / PRIZE_CLAIM | prize / prizeId | `prize_claim:{userPrizeId}` (id generated in advance; request dedupe uses `UserPrize.claimKey`) |
| Reward refund | BONUS / PRIZE_REFUND | prize_refund / userPrizeId | `prize_refund:{userPrizeId}` |
| Future count task | QUEST / (new source) | brand_task / taskId | `task:{taskId}:{userId}:{periodKey}` |

Descriptions always name the brand, for example "Points for order #20261012-004 at {Brand}", "Waffle ×2 · {Brand}", "Birthday gift from {Brand}". Old apps print them verbatim. New apps build the row title from `source` (§5.8).

#### 2.7.3 Earning rules and hooks

**Points formula**
- `base = Σ(OrderItem.pointsPerUnit × quantity)`. When that is 0, `base = floor(subtotal × brand.fallbackPointsPerPln)`.
- `points = floor(base × Order.pointsMultiplierPercent / 100)`.

**`awardOrderPoints`**, in one transaction:
1. Load the order.
2. Check eligibility, see below.
3. Claim the order: `updateMany({where:{id, pointsAwarded:false}, data:{pointsAwarded:true}})`.
4. Credit `Order.brandId` with `spotId = Order.spotId` and the snapshot values.

**Eligibility rule (Q3 default).** A TERMINATED order earns order points only when `paymentStatus = 'paid'` and it was not refunded. Apology points are separate and not affected.

| Trigger | Call site | Call, wrapped in `safeLoyalty`, placed **after** the announcement |
|---|---|---|
| Pickup paid online | `OrderPaymentService.markOrderPaid` | `awardOrderPoints`, moved after `publishNewOrderNotification` / `persistNewOrderNotification` (today it runs before them, at 46-50) |
| Staff sets DELIVERED / COLLECTED | `OrderResolver.updateOrderStatus` 1199-1206 | `onOrderCompleted` |
| Pickup collected | `collectPickupOrder` 1517. The transition becomes conditional (`updateMany WHERE status NOT IN (COLLECTED, CANCELLED, FAILED, TERMINATED)`) | `onOrderCompleted`; its `.points` becomes `pointsAwarded` |
| Courier DELIVERED (**new**) | `CourierResolver.updateDeliveryStatus`, after `publishOrderStatusChanged` (806-813) | `onOrderCompleted`. This is a visible behavior change |
| Terminate | `terminateOrder` 1335-1344 | `awardOrderPoints` (eligibility rule) + `awardApologyPoints` (no multiplier) |

**`order_points_sweeper` job**, every 10 minutes:
- Scope: orders with `createdAt >= Brand(<D>).createdAt` (the cutover), `pointsAwarded = false`, older than 10 minutes, and either:
  - status DELIVERED, COLLECTED, or TERMINATED-and-eligible; or
  - `fulfillmentType = PICKUP` and `paymentStatus = 'paid'`.
- Action: re-run `onOrderCompleted` or `awardOrderPoints`. Both are idempotent.

**Removed credit paths**
- The +500 at Google and Apple signup (`authRoutes.ts:815-822, 979-986`).
- The birthday credit in `updateProfile` (`birthdayCompleted` stays as the "date locked" flag).
- `claimBirthdayBonus`, `addPointsToUser`.
- The nested wallet creates.

#### 2.7.4 Brand tasks (D4)

`PointsRuleEngine.evaluate({spot, at, context:'ORDER'|'TEMPLATE_AWARD'}) → {multiplierPercent, taskId|null}`:
1. **Time zone.** `resolveTimeZone(spot.timezone)` tries the IANA name, then the alias `Europe/Kyiv → Europe/Kiev`, then `Europe/Warsaw`. Boot logs every city that needed the alias.
2. **Local time.** `localParts(at, tz)` uses `Intl.DateTimeFormat('en-GB',{timeZone, hourCycle:'h23', …}).formatToParts` and yields `localDate`, `isoDow` and `minuteOfDay`.
3. **Candidates.** One indexed query on `(brandId, ACTIVE, POINTS_MULTIPLIER)` where the context flag is set, including windows and spots; memoized per request.
4. **Match.** A task matches when all of these hold:
   - `startsOn ≤ localDate ≤ endsOn` (nulls are open);
   - no spot rows, or the spot is listed;
   - no windows, or one window has `dayOfWeek = isoDow` and `startMinute ≤ minuteOfDay < endMinute`.
5. **Overlap.** The **MAX** `multiplierPercent` wins, with no compounding. Ties go to the earliest `createdAt`, then the lowest id. No match gives `{100, null}`.
6. **DST.** The engine only converts instant → local, never the reverse. On spring-forward day a 02:00–03:00 window matches nothing; on fall-back day it matches for two hours.

**Which instant counts.** Orders use `placedAt` from `createOrder` (just before the transaction at `OrderResolver.ts:612`); `scheduledFor` is ignored. Template awards use the time the server receives the request.

**Validation** (`BRAND_TASK_INVALID` with `extensions.field`):
- `multiplierPercent` 101–1000; the UI offers 150, 200, 300.
- 0–21 windows; `dayOfWeek` 1–7; "HH:MM" times with "24:00" allowed as an end; end after start; no midnight crossing.
- `startsOn ≤ endsOn`.
- `spotIds` must belong to the brand.
- `appliesToOrders` or `appliesToTemplateAwards` must be true.
- `title` required.

**`updateBrandTask` is a full replace.** An omitted `spotIds` means `[]` (all spots).

**Lifecycle**
- Edits affect only future events, because snapshots are immutable.
- `setBrandTaskStatus` sets ACTIVE, PAUSED or ARCHIVED.
- `deleteBrandTask` hard-deletes only when the task was never applied; otherwise it archives.

**Display**
- `activeUntil` and `nextStartsAt` come from `localToInstant` (probes 8 days ahead; a nonexistent local time maps to the next valid instant).
- `activePromotion` (wallet and spot) is the task active now, otherwise the next one starting within 7 days, otherwise null.
- `brandPromotions(brandId)` without a `spotId`: `isActiveNow` means active at one or more spots in the task's scope.

**Extension path for count tasks.**
1. Add enum values in a separate migration.
2. Put the rules in `config`: `{targetCount, rewardPoints, period, productIds?}`.
3. Add `BrandTaskProgress(@@unique[taskId, userId, periodKey])` and `BrandTaskProgressEvent(sourceKey @unique)`.
4. Hook `onOrderCompleted` and `staffAward`.
5. Pay with the key `task:…`.

Quest is not reused.

#### 2.7.5 Jobs

**Scheduler.** Starts after `httpServer.listen` unless `JOBS_ENABLED=false`. First tick 2 minutes after boot, then every 30 minutes; the sweeper runs every 10 minutes.

**Lease.** Each run takes a `JobLease`: `UPDATE … SET lockedUntil=$nowPlus10m, owner=$instance … WHERE name=$job AND lockedUntil < $now RETURNING name`, with JS date parameters. Correctness never depends on the lease.

**Manual triggers**
- `scripts/run-job.ts <job> [--date=YYYY-MM-DD]`.
- `POST /internal/jobs/:job` with header `x-job-secret`. It returns 404 when `JOB_SECRET` is unset, and accepts `?date` only outside production.

**Birthday (D3)**
1. Load brands that are active, have `birthdayBonusEnabled` and have points > 0.
2. For each time zone in `DISTINCT City.timezone ∪ {Europe/Warsaw}`, build a 3-day catch-up window of (month, day) pairs ending today. Feb 29 maps to Feb 28 in non-leap years.
3. Query candidates in pages of 500 userIds:
   ```sql
   SELECT pb."userId", pb."brandId", pb."createdAt" "walletCreatedAt", u."birthDate", u."birthDateSetAt"
   FROM "PointBalance" pb JOIN "User" u ON u.id=pb."userId" LEFT JOIN "City" c ON c.id=u."preferredCityId"
   WHERE pb."brandId"=ANY($brandIds) AND u."birthDate" IS NOT NULL AND u."accountType"='CLIENT' AND NOT u."loginDisabled"
     AND COALESCE(c."timezone",'Europe/Warsaw')=$tz
     AND (EXTRACT(MONTH FROM u."birthDate"), EXTRACT(DAY FROM u."birthDate")) IN (…)
   ```
4. Credit only when:
   - the wallet was created before the end of the birthday in that time zone;
   - `birthDateSetAt` is null or at least 30 days before the birthday (Q5);
   - the year is the occurrence year.
5. Key `birthday:{userId}:{brandId}:{year}`. On a credit, send the `BIRTHDAY_BONUS` push.

**Reward expiry (`reward_expiry` job, E9)**
- **Reminder:** UserPrize where `isRedeemed=false`, `reminderSentAt IS NULL` and `validUntil` within the next 24 hours → push `REWARD_EXPIRING`, then set `reminderSentAt`.
- **Refund:** UserPrize where `isRedeemed=false`, `refundedAt IS NULL` and `validUntil < now`, at an active brand, and `REWARD_EXPIRY_REFUND=true`. In one transaction:
  - credit `pointsCost` (`PRIZE_REFUND`, key `prize_refund:{id}`);
  - `Prize.claimed = claimed - 1`;
  - set `refundedAt`;
  - push `REWARD_REFUNDED` after commit.
- At inactive brands, points stay frozen and nothing is refunded.

#### 2.7.6 Staff awards

**`staffAward`** (`awardLoyaltyPoints`)
1. Spot: `assertSpotAccess(OPERATE, active brand and spot)`.
2. Customer: `LoyaltyCode.resolveCustomer` (CLIENT accounts only), otherwise `CUSTOMER_NOT_FOUND`.
3. **Self-award guard.** Reject when the customer's email (case-insensitive) or phone equals the actor's: SCOPE_FORBIDDEN, "You can't give points to your own account."
4. **Template path:** an active template with `template.spotId == spot.id`; quantity 1–99; level OPERATE; `base = points × qty`; the multiplier comes from `evaluate(TEMPLATE_AWARD, now)`.
5. **Custom path:** level MANAGE_SPOT; 1 ≤ points ≤ `manualAwardCap`, otherwise `AWARD_LIMIT_EXCEEDED {cap, kind:'PER_AWARD'}`; multiplier 100.
6. **Daily cap.** When `brand.staffDailyAwardCap > 0` and the actor is EMPLOYEE or SPOT_ADMIN, the sum of the actor's STAFF_* and ORDER_APOLOGY credits for the spot-local day plus this amount must stay within the cap, otherwise `AWARD_LIMIT_EXCEEDED {cap, kind:'DAILY'}`.
7. Credit. The `requestId` makes a double tap return `duplicate:true`.
8. After commit: `pointsUpdated` and a POINTS_EARNED push with `brandName`.

**`legacyAwardPoints`** (spot 1.0.1 `awardPoints`)
- With `templateId`: the template path.
- Without it, when the description matches `/^(.+) ×(\d+)$/`:
  - the quantity must be 1–99, otherwise the call is rejected;
  - an active template at the spot with name `$1` and `points × $2 == points` → template path (employees allowed, multiplier applied).
- Anything else takes the custom path, with its MANAGE_SPOT check and caps.
- Returns `true`, or throws.

#### 2.7.7 Referral (D2)

**Apply** (`applyReferralCode` and the signup sites):
- The code is uppercased.
- Rejected for self-referral, non-CLIENT referrers, and users who already have a DELIVERED or COLLECTED order.
- Creates `Referral(PENDING)`. No points at signup.

**Award**, inside `onOrderCompleted`, after the order points:
1. `pts = brand.isActive ? referralBonusPoints : 0`.
2. Claim the referral:
   ```sql
   UPDATE "Referral" SET "status"=CASE WHEN $pts>0 THEN 'AWARDED' ELSE 'NO_BONUS' END::"ReferralStatus",
     "brandId"=$b, "qualifyingOrderId"=$o, "awardedPoints"=$pts, "awardedAt"=$now, "pointsAwarded"=($pts>0)
   WHERE "referredUserId"=$referee AND "status"='PENDING' AND "pointsAwarded"=false RETURNING "id","referrerId"
   ```
3. If a row came back and `pts > 0`: credit both sides in `order.brandId`, locking the wallets in ascending userId order.
4. After commit: `REFERRAL_BONUS` push to both.

"First order" means the first completed order across the whole platform. `myReferralStats` sums `awardedPoints` over AWARDED referrals and reports NO_BONUS referrals separately.

#### 2.7.8 Rewards

**`claimPrize(userId, prizeId, requestId?)`**, one transaction, retried up to 3 times on a `qrCode` clash:
1. If a `requestId` is given:
   - `claimKey = prize_claim:{userId}:{requestId}`;
   - take `pg_advisory_xact_lock(hashtext(claimKey))`;
   - look the key up: same `prizeId` → return the existing UserPrize; different `prizeId` → `IDEMPOTENCY_CONFLICT`.
2. Take stock:
   ```sql
   UPDATE "Prize" SET "claimed"="claimed"+1 WHERE "id"=$p AND "isActive" AND "archivedAt" IS NULL
     AND ("quantity" IS NULL OR "claimed"<"quantity") AND ("validFrom" IS NULL OR "validFrom"<=$now)
     AND ("validUntil" IS NULL OR "validUntil">=$now)
     AND EXISTS (SELECT 1 FROM "Brand" b WHERE b."id"="Prize"."brandId" AND b."isActive")
   RETURNING "brandId","pointsCost","title"
   ```
   No row: re-read the prize and raise `REWARD_UNAVAILABLE` (out of stock / no longer available).
3. `debit` with key `prize_claim:{userPrizeId}` (id generated in advance).
4. Create the UserPrize with `claimKey`, `brandId`, `qrCode = generatePrizeCode()` (crypto RNG) and `validUntil = now + 7d`.
5. After commit: `pointsUpdated`.

**`redeemUserPrize(spot, raw, staff)`** (`validatePrizeQR`)
1. `normalizeScan` must yield a REWARD_CODE.
2. Conditional update: `userPrize.updateMany({where:{qrCode, isRedeemed:false, validUntil:{gte:now}, brandId: spot.brandId}, data:{isRedeemed:true, redeemedAt, redeemedAtSpotId, redeemedById}})`.
3. Count 0 → diagnose: `REWARD_INVALID`, `REWARD_WRONG_BRAND` (never names the other brand), `REWARD_USED`, `REWARD_EXPIRED`, `BRAND_INACTIVE`.
4. The brand check allows the 30-day grace after `deactivatedAt` (Q6).

**`handOverReward(spot, userPrizeId, customerRaw, staff)`** (new, E10)
- Level OPERATE.
- The customer is resolved from the scanned card and must equal `userPrize.userId`.
- Same conditional update as above, keyed by id. The same staff member re-sending within 60 s gets the redeemed row back.
- Error codes as above.

**`deletePrize`** archives when any UserPrize exists, otherwise it hard-deletes. Archived rewards that were already claimed stay redeemable. `updatePrize` cannot change `brandId`.

#### 2.7.9 Code normalization (D6) and legacy projections

`LoyaltyCode.normalizeScan(raw) → CUSTOMER_ID | CUSTOMER_CODE | REWARD_CODE | UNKNOWN`:
1. NFKC; strip control characters (wedge CR/LF/TAB); trim.
2. Strip an AIM prefix `/^\][A-Za-z][0-9A-Za-z]/`.
3. Leading `{` → JSON:
   - `{type:'LOYALTY_USER', userId}` → CUSTOMER_ID;
   - `o.code ?? o.loyaltyCode` is also accepted.
4. A UUID → CUSTOMER_ID.
5. Cyrillic-only input → map from ЙЦУКЕН to QWERTY by key position. QWERTZ is not corrected.
6. Uppercase, then strip `[^A-Z0-9]`.
7. Code patterns:
   - `^GL([A-HJ-NP-Z2-9]{8})$` or 8 bare characters → `GL-…`;
   - `^PR(...)$` → `PR-…`;
   - `^PRIZE([0-9A-F]{32})$` → legacy `PRIZE-<uuid>`.

`resolveCustomer` runs `user.findFirst({where:{accountType:'CLIENT', OR:[{id},{loyaltyCode}]}})`.

**Barcode and codes**
- The barcode is Code 128B of `GL-XXXXXXXX` as-is.
- New clients put the raw `GL-` code in the QR.
- The server accepts the legacy JSON indefinitely.
- `ensureLoyaltyCode` runs at every client signup site; `me` keeps the lazy fallback.

**Legacy projections** (old builds send no new arguments)
- `myPointBalance()` returns `legacyWallet` (max `availablePoints`, then `updatedAt` desc, then `brandId` asc), or null.
- `myPointTransactions()` returns all brands.
- `prizes()`:
  - an authenticated CLIENT with a legacy wallet gets that brand's active rewards;
  - otherwise, the active rewards of all active brands.
- `myPrizes()` returns every brand.
- `loyaltyCustomer(idOrCode)` uses the effective spot. With no spot: zeros and `brandId: null`. It never throws for a customer that was found.
- `pointsUpdated()` delivers only events that changed the legacy wallet. `totalPoints` and `availablePoints` carry that wallet's numbers, computed once at publish time.
- `awardPoints($spotId: ID)` and `validatePrizeQR($spotId: ID)` stay nullable and are resolved at runtime.

#### 2.7.10 Quota and brand moves (`BrandService`)

**`withSpotSlot(tx, brandId, spotId?)`**
1. `SELECT … FROM "Brand" WHERE id=$b FOR UPDATE`. Inactive brand → BRAND_INACTIVE.
2. Lock the spot row. If it is already active → no-op.
3. If `count(active) >= maxSpots` → `SPOT_LIMIT_REACHED {maxSpots, kind:'ACTIVE'}` with "Your plan allows {n} active spots. Ask Loodly to raise the limit."
4. Used by `createSpot(activate:true)`, `updateSpot(isActive:true)`, `setSpotActive(true)` and `moveSpotToBrand` (for an active spot, at the target brand).

**`createSpot`**
- Total spots, all statuses, must stay ≤ `maxSpots + 5` (`SPOT_LIMIT_REACHED kind:'TOTAL'`).
- The city must be active and one of the brand's cities (`CITY_NOT_IN_BRAND`).
- The id comes from `serverSpotId(name)`: a slug (≤ 32 characters) plus 6 random base36 characters, retried 3 times. Any client-supplied id is ignored.
- Default `isActive=false` (draft).
- Lowering `maxSpots` only blocks new activations.

**`moveSpotToBrand(spotId, brandId)`**, PLATFORM only, one transaction:
1. Refuse while any order at the spot is non-final (`SPOT_HAS_OPEN_ORDERS`, message "Finish or cancel open orders first").
2. Lock the target brand and take a slot if the spot is active.
3. Make sure `BrandCity(target, city)` exists.
4. Delete the spot's `BrandTaskSpot` rows.
5. Staff:
   - employees, and spot admins who have no other spot: delete their BrandStaff row, strip the role, bump tokenVersion and run the hygiene steps;
   - other spot-admin profiles for this spot are deleted.
6. Set `Spot.brandId` and `brandAssignedAt = now`.

Past orders, ledger rows and wallets keep their brand snapshot. Brand-staff history reads are filtered by `Order.brandId`, `PointTransaction.brandId` and `StaffLoginSession.brandId`, or by `historyCutoff`.

#### 2.7.11 Client overview

```
cityId = me.preferredCityId ?? fallbackCityId ?? null
wallets = PointBalance(userId), every brand. Inactive brands → paused=true (excluded from engaged, picker and auto-follow; sorted last)
ready   = unredeemed UserPrize where isRedeemableNow (unexpired; brand active or within the 30-day grace)
cityBrands = brandsInCity(cityId)   // active brands with ≥ 1 active spot in the city
per brand: LoyaltyWallet { hasWallet, paused, availablePoints, totalPoints, readyToPickUpCount, affordableRewardCount,
            nextReward, pointsToNextReward, inMyCity, lastActivityAt, activePromotion }
sort: paused asc, availablePoints desc, readyToPickUpCount desc, hasWallet desc, inMyCity desc, name asc
engaged = count(!paused && (availablePoints > 0 || readyToPickUpCount > 0))
showPointsPicker  = engaged > 1
showRewardsPicker = engaged > 1 || (engaged == 0 && cityBrands.length > 1)
defaultBrandId = engaged > 0 ? first engaged
               : (most recent lastActivityAt within 90 days) ?? (first in-city brand) ?? null
```

#### 2.7.12 Concurrency summary

| Race | Guard |
|---|---|
| Any wallet change | `FOR UPDATE` on (userId, brandId); unique key inserted with `ON CONFLICT DO NOTHING`; payload comparison; CHECK ≥ 0 |
| Double order credit | `pointsAwarded` claimed in the same transaction as the credit; key `order:{id}`; sweeper |
| Reward double spend, oversell, replay | Advisory lock on `claimKey`; conditional stock update; debit under lock |
| Double redemption | Conditional `isRedeemed` flip |
| Referral double pay | Conditional status claim plus `pointsAwarded=false`; per-side keys |
| Birthday / refund double pay | Keys per (user, brand, year) and per userPrize |
| Spot quota | Brand row `FOR UPDATE` plus spot row lock |
| Membership changes | `BrandStaff.userId` unique; StaffService transaction; composite FKs |

### 2.8 GraphQL contract

Everything is additive. New builds must:
- send `x-loodly-client: <app>@<version>` and `x-loodly-api: 2` (or `connectionParams.client` / `api` on WS);
- pass `brandId` / `spotId` / `spotIds` explicitly;
- read `errors[].extensions.code` before applying any auth logic, and log out only on `UNAUTHENTICATED`.

**Request limits:** query depth ≤ 10 and aliases ≤ 40. Brand, City, Spot, BrandStaff and wallet field resolvers are batched with DataLoader.

```graphql
enum StaffKind { BRAND_ADMIN SPOT_ADMIN EMPLOYEE }
enum StaffScopeKind { PLATFORM BRAND_ADMIN SPOT_ADMIN EMPLOYEE NONE }
enum StaffAccessLevel { OPERATE MANAGE_SPOT MANAGE_BRAND PLATFORM }
enum LedgerSource { ORDER ORDER_APOLOGY ORDER_REVERSAL STAFF_TEMPLATE STAFF_CUSTOM REFERRAL_REFERRER REFERRAL_REFEREE BIRTHDAY PRIZE_CLAIM PRIZE_REFUND ADMIN_ADJUSTMENT LEGACY }
enum BrandTaskKind { POINTS_MULTIPLIER }
enum BrandTaskStatus { ACTIVE PAUSED ARCHIVED }
enum ScanKind { CUSTOMER REWARD UNKNOWN }
enum ScanReason { REWARD_WRONG_BRAND REWARD_USED REWARD_EXPIRED REWARD_INVALID BRAND_INACTIVE SPOT_INACTIVE CUSTOMER_NOT_FOUND }
# Role gains BRAND_ADMIN (appended).

type BrandSummary { id: ID!  name: String!  logoUrl: String  isActive: Boolean!  description: String  descriptionLocal: JSON }
type Brand { id: ID! name: String! description: String descriptionLocal: JSON logoUrl: String coverUrl: String isActive: Boolean!
  cityIds: [ID!]! cities: [City!]! spots(cityId: ID): [SpotType!]! spotCount(cityId: ID): Int! rewardCount: Int!
  birthdayBonusPoints: Int! referralBonusPoints: Int! activePromotions(spotId: ID): [BrandPromotion!]! }
type BrandSettings { birthdayBonusEnabled: Boolean! birthdayBonusPoints: Int! referralBonusPoints: Int! fallbackPointsPerPln: Int! manualAwardCap: Int! staffDailyAwardCap: Int! }
type SpotQuota { maxSpots: Int! activeSpots: Int! remaining: Int! totalSpots: Int! }
type BrandAdminView { brand: Brand! settings: BrandSettings! quota: SpotQuota! totalSpots: Int! staffCount: Int! billingNote: String createdAt: DateTime! }
  # staffCount = every BrandStaff row of the brand; billingNote is null unless PLATFORM
type City { …existing… timezone: String! }
type SpotType { …existing… brandId: ID! brand: BrandSummary! timezone: String! activePromotion: BrandPromotion }
type PointBalanceType { …existing… brandId: ID! brand: BrandSummary! }
type PointTransactionType { …existing… brandId: ID! brand: BrandSummary! spotId: ID spot: SpotType source: LedgerSource basePoints: Int multiplierPercent: Int! }
type PrizeType { …existing… brandId: ID! brand: BrandSummary! archivedAt: DateTime }   # brand resolves even when inactive
type UserPrizeType { …existing… brandId: ID! brand: BrandSummary! redeemedAtSpotId: ID redeemedAtSpot: SpotType isExpired: Boolean! isRedeemableNow: Boolean! }
type LoyaltyCustomerType { …existing (this brand)… spotId: ID brandId: ID brandName: String readyToPickUpCount: Int! readyRewards: [UserPrizeType!]! activeMultiplierPercent: Int }
type StaffMember { …existing… kind: StaffKind brandId: ID spotIds: [ID!]! spots: [SpotType!]! invitePending: Boolean! }
type UserType { …existing… kind: StaffKind brandId: ID spotIds: [ID!] }      # null unless the caller is PLATFORM, self, or manages the user
type StaffLoginSessionType { …existing… brandId: ID event: String! clientApp: String }
type NotificationType { …existing… spotId: ID spotName: String brandId: ID }
type SpotPayoutSummaryType { …existing… brandId: ID brandName: String }
type PointsUpdate { …existing (legacy-wallet numbers)… brandId: ID brandName: String brandAvailablePoints: Int brandTotalPoints: Int
  source: LedgerSource legacyBrandId: ID spotId: ID spotName: String }     # change = signed delta on the brandId wallet; never 0
type BrandTaskWindow { dayOfWeek: Int! startTime: String! endTime: String! }
type BrandPromotion { taskId: ID! brandId: ID! brandName: String! title: String! titleLocal: JSON description: String descriptionLocal: JSON
  multiplierPercent: Int! isActiveNow: Boolean! activeUntil: DateTime nextStartsAt: DateTime windows: [BrandTaskWindow!]!
  spotIds: [ID!]! spotNames: [String!]! startsOn: String endsOn: String timezone: String! appliesToOrders: Boolean! appliesToTemplateAwards: Boolean! }
type LoyaltyWallet { brand: Brand! hasWallet: Boolean! paused: Boolean! availablePoints: Int! totalPoints: Int! readyToPickUpCount: Int!
  affordableRewardCount: Int! nextReward: PrizeType pointsToNextReward: Int inMyCity: Boolean! lastActivityAt: DateTime activePromotion: BrandPromotion }
type LoyaltyOverview { wallets: [LoyaltyWallet!]! engagedBrandCount: Int! showPointsPicker: Boolean! showRewardsPicker: Boolean!
  defaultBrandId: ID readyToPickUp: [UserPrizeType!]! cityId: ID city: City }
type StaffSpot { spotId: ID! spot: SpotType! brandId: ID! brandName: String! brandLogoUrl: String level: StaffAccessLevel! isActive: Boolean!
  pendingOrderCount: Int! myOpenClaimedCount: Int! staffCount: Int! manualAwardCap: Int }   # manualAwardCap only at MANAGE_SPOT+
type StaffContext { scope: StaffScopeKind! brand: Brand spots: [StaffSpot!]! defaultSpotId: ID canManageBrand: Boolean! mustChangePassword: Boolean! }
type StaffScanResult { kind: ScanKind! normalizedCode: String customer: LoyaltyCustomerType reward: UserPrizeType rewardUsableHere: Boolean reason: ScanReason }
  # reward is null for REWARD_WRONG_BRAND / REWARD_INVALID
type StaffAwardResult { transactionId: ID duplicate: Boolean! basePoints: Int! multiplierPercent: Int! awardedPoints: Int!
  promotion: BrandPromotion brand: Brand! brandAvailablePoints: Int! }
type PickupElsewhere { orderId: ID! orderNumber: String! spotId: ID! spotName: String! spotAddress: String! }
type CreateBrandPayload { brand: BrandAdminView! admin: StaffMember! }
type BrandTask { id: ID! brandId: ID! kind: BrandTaskKind! status: BrandTaskStatus! title: String! titleLocal: JSON description: String
  descriptionLocal: JSON multiplierPercent: Int appliesToOrders: Boolean! appliesToTemplateAwards: Boolean! startsOn: String endsOn: String
  windows: [BrandTaskWindow!]! spotIds: [ID!]! timesApplied: Int! createdAt: DateTime! updatedAt: DateTime! }

input BrandAdminInviteInput { email: String! name: String! language: Language }
input BrandSettingsInput { birthdayBonusEnabled: Boolean birthdayBonusPoints: Int referralBonusPoints: Int fallbackPointsPerPln: Int manualAwardCap: Int staffDailyAwardCap: Int }
input CreateBrandInput { name: String! description: String descriptionLocal: JSON cityIds: [ID!]! maxSpots: Int! admin: BrandAdminInviteInput!
  settings: BrandSettingsInput billingNote: String }                         # cityIds must hold ≥ 1 active city
input UpdateBrandPlatformInput { name: String maxSpots: Int isActive: Boolean billingNote: String }
input UpdateBrandProfileInput { description: String descriptionLocal: JSON logoUrl: String coverUrl: String }   # explicit null clears; omitted = unchanged; URLs must be platform-owned
input InviteStaffInput { email: String! name: String! kind: StaffKind! spotIds: [ID!]! language: Language password: String brandId: ID }
input AwardLoyaltyPointsInput { spotId: ID! customer: String! templateId: ID quantity: Int = 1 points: Int description: String requestId: String! }
input BrandTaskWindowInput { dayOfWeek: Int! startTime: String! endTime: String! }
input BrandTaskInput { kind: BrandTaskKind = POINTS_MULTIPLIER title: String! titleLocal: JSON description: String descriptionLocal: JSON
  multiplierPercent: Int! appliesToOrders: Boolean = true appliesToTemplateAwards: Boolean = true startsOn: String endsOn: String
  windows: [BrandTaskWindowInput!]! spotIds: [ID!] }
input UserChangeInput { …existing… language: Language }

type Query {
  adminBrands(includeInactive: Boolean = true): [BrandAdminView!]!          # PLATFORM
  adminBrand(id: ID!): BrandAdminView                                       # PLATFORM, or MANAGE_BRAND of it
  myBrand: BrandAdminView                                                   # BRAND_ADMIN
  brandSpots(brandId: ID, includeInactive: Boolean = true): [SpotType!]!    # MANAGE_BRAND / PLATFORM
  spots(includeInactive: Boolean = false, brandId: ID): [SpotType!]!
  spotsByCity(cityId: ID!, brandId: ID): [SpotType!]!
  myStaffContext: StaffContext!          # STAFF. Spots incl. inactive (flagged); PLATFORM: active spots only. defaultSpotId = last LOGIN/SPOT_SWITCH spot still listed
  myStaffSpots(includeInactive: Boolean = true, search: String, limit: Int = 200): [StaffSpot!]!
  brandStaff(brandId: ID, spotId: ID, kind: StaffKind, includeDisabled: Boolean = true): [StaffMember!]!   # MANAGE_BRAND; with spotId, MANAGE_SPOT
  staffScan(spotId: ID!, raw: String!): StaffScanResult!                                                   # OPERATE
  loyaltyCustomer(idOrCode: String!, spotId: ID): LoyaltyCustomerType
  pickupOrdersElsewhere(spotId: ID!, customer: String!): [PickupElsewhere!]!                               # OPERATE; same brand, other spots
  brandPrizes(brandId: ID, includeArchived: Boolean = false): [PrizeType!]!                                # OPERATE on any brand spot
  myLoyaltyOverview(fallbackCityId: ID): LoyaltyOverview!                                                  # CLIENT
  brandsInCity(cityId: ID!, includeWithoutSpots: Boolean = false): [Brand!]!
  brand(id: ID!): Brand                                                     # inactive → null unless its staff / PLATFORM
  brandPromotions(brandId: ID!, spotId: ID): [BrandPromotion!]!
  brandTasks(brandId: ID, includeArchived: Boolean = false): [BrandTask!]!  # MANAGE_BRAND
  myPointBalance(brandId: ID): PointBalanceType
  myPointTransactions(limit: Int = 50, brandId: ID): [PointTransactionType!]!
  prizes(includeInactive: Boolean = false, brandId: ID): [PrizeType!]!
  myPrizes(includeRedeemed: Boolean = true, brandId: ID): [UserPrizeType!]!
  spotPayoutSummaries(brandId: ID): [SpotPayoutSummaryType!]!               # PLATFORM
  spotStaffSessions(spotId: ID!, limit: Int, includeSwitches: Boolean = false): [StaffLoginSessionType!]!
  myNotifications(unreadOnly: Boolean, limit: Int, spotId: ID): [NotificationType!]!
  unreadNotificationCount(spotId: ID): Int!
}
type Mutation {
  createBrand(input: CreateBrandInput!): CreateBrandPayload!                # PLATFORM; one tx; invite email after commit
  updateBrandPlatform(brandId: ID!, input: UpdateBrandPlatformInput!): BrandAdminView!   # sets/clears deactivatedAt
  inviteBrandAdmin(brandId: ID!, email: String!, name: String!, language: Language): StaffMember!
  moveSpotToBrand(spotId: ID!, brandId: ID!): SpotType!
  deleteBrand(brandId: ID!): Boolean!                                       # only with no spots, orders, wallets or prizes
  updateBrandProfile(input: UpdateBrandProfileInput!, brandId: ID): BrandAdminView!
  setBrandCities(cityIds: [ID!]!, brandId: ID): BrandAdminView!             # ≥ 1 active city; CITY_IN_USE
  updateBrandSettings(input: BrandSettingsInput!, brandId: ID): BrandAdminView!
  createSpot(id: String, name: String!, address: String!, cityId: String!, latitude: Float!, longitude: Float!, phone: String!,
    description: String, deliveryEnabled: Boolean = true, deliveryRadiusKm: Float = 5, freeDeliveryThreshold: Float,
    pickupEnabled: Boolean = false, onlinePaymentEnabled: Boolean = true, brandId: ID, activate: Boolean = false): SpotType!
  updateSpot(…existing…, cityId: ID): SpotType!
  setSpotActive(spotId: ID!, isActive: Boolean!): SpotType!
  selectActiveSpot(spotId: ID!, deviceId: String): StaffSpot!               # OPERATE; DeviceToken.activeSpotId + SPOT_SWITCH session row
  inviteStaff(input: InviteStaffInput!): StaffMember!
  setSpotAdminSpots(userId: ID!, spotIds: [ID!]!): StaffMember!
  moveEmployee(userId: ID!, spotId: ID!): StaffMember!
  changeStaffKind(userId: ID!, kind: StaffKind!, spotIds: [ID!]!): StaffMember!
  removeStaffMember(userId: ID!): Boolean!
  awardLoyaltyPoints(input: AwardLoyaltyPointsInput!): StaffAwardResult!
  awardPoints(userId: ID!, points: Int!, description: String!, spotId: ID, templateId: ID, quantity: Int, requestId: String): Boolean!   # legacy wrapper
  validatePrizeQR(qrCode: String!, spotId: ID): UserPrizeType!
  handOverReward(spotId: ID!, userPrizeId: ID!, customer: String!): UserPrizeType!
  redeemPrize(prizeId: ID!, requestId: String): UserPrizeType!
  createPrize(…existing…, validFrom: DateTime, validUntil: DateTime, brandId: ID): PrizeType!
  updatePrize(…existing…, validFrom: DateTime, validUntil: DateTime): PrizeType!
  deletePrize(id: ID!): Boolean!
  createBrandTask(input: BrandTaskInput!, brandId: ID): BrandTask!
  updateBrandTask(id: ID!, input: BrandTaskInput!): BrandTask!              # full replace
  setBrandTaskStatus(id: ID!, status: BrandTaskStatus!): BrandTask!
  deleteBrandTask(id: ID!): Boolean!
  registerFCMToken(token: String!, platform: String!, deviceId: String!, clientApp: String, appVersion: String, activeSpotId: ID): Boolean!
  markAllNotificationsRead(spotId: ID): Boolean!
  createCity(…, timezone: String): City!   updateCity(…, timezone: String): City!
  claimBirthdayBonus: Boolean!             # deprecated, always false
}
type Subscription {
  newOrderNotification(spotIds: [ID!]): String!   # JSON {spotId, spotName, brandId, order}
  orderClaimed(spotIds: [ID!]): String!           # JSON {spotId, spotName, brandId, order}
  deliveryIncident(spotIds: [ID!]): String!       # JSON {spotId, spotName, brandId, incident}
  pointsUpdated(brandId: ID, allBrands: Boolean = false): PointsUpdate!
}
```

Legacy staff mutations keep their exact signatures, with the semantics in §2.6: `createSpotStaff`, `inviteSpotStaff`, `createEmployee`, `inviteSpotAdmin` (+`spotIds`), `createAdminAccount` (+`brandId`), `resendAdminInvite`, `adminResetStaffPassword`, `setStaffLoginDisabled`, `setUserLoginDisabled`, `assignSpotAdmin`, `removeSpotAdmin`.

**`extensions.code` values**

| Code | Extra extensions |
|---|---|
| `UNAUTHENTICATED` | |
| `SCOPE_FORBIDDEN` | |
| `PASSWORD_CHANGE_REQUIRED` | |
| `SPOT_REQUIRED` | |
| `BRAND_INACTIVE` | |
| `SPOT_INACTIVE` | |
| `SPOT_LIMIT_REACHED` | `{maxSpots, kind}` |
| `SPOT_HAS_OPEN_ORDERS` | |
| `CITY_NOT_IN_BRAND` | |
| `CITY_IN_USE` | |
| `CUSTOMER_NOT_FOUND` | |
| `INSUFFICIENT_POINTS` | `{missingPoints, brandId, brandName}` |
| `REWARD_UNAVAILABLE` | `{reason: 'OUT_OF_STOCK' \| 'UNAVAILABLE'}` |
| `REWARD_WRONG_BRAND`, `REWARD_USED`, `REWARD_EXPIRED`, `REWARD_INVALID` | |
| `REWARD_QUANTITY_BELOW_CLAIMED` | |
| `AWARD_LIMIT_EXCEEDED` | `{cap, kind}` |
| `STAFF_CONFLICT` | |
| `BRAND_NAME_TAKEN` | |
| `BRAND_TASK_INVALID` | `{field}` |
| `IDEMPOTENCY_CONFLICT` | |
| `UPGRADE_REQUIRED` | `{app, minVersion}`. GraphQL enforcement is off in v1 (`MIN_CLIENT_API_ENFORCED`) |

### 2.9 REST

**`clientInfo` middleware.** Mounted before `/authorization`, `/upload`, `/reports` and `/graphql` (`src/index.ts:105-120`). Resolvers choose shims by whether an argument is present, never by version string. One CORS preflight must be verified (`cors()` sets no `allowedHeaders`).

**`POST /authorization/login`** (`authRoutes.ts:149-278`)
1. Look up the user in the namespace, then validate the password **first**. Disabled, `emailVerified` and role gates all run after the password check, and failures return uniform messages.
2. Staff gate: `STAFF_ROLES`.
3. For ADMIN accounts, `loadStaffScope`. Non-PLATFORM with NO_MEMBERSHIP or ROLE_DRIFT → 403 `{code:'NO_MEMBERSHIP', error}`.
4. `x-loodly-client` is `admin-web@…` and the kind is SPOT_ADMIN or EMPLOYEE → 403 `{code:'USE_SPOT_APP', error, name}`, before any token or session row is issued.
5. Legacy client (no `x-loodly-api`) and the scope is BRAND_ADMIN or a multi-spot SPOT_ADMIN → **426** `{code:'UPGRADE_REQUIRED', error:<localized "Please update the Loodly Spot app (or refresh the admin page) to continue.">, minVersion}`.
6. `firstLogin = mustChangePassword`.
7. `spotId = resolveLegacySpotId`.
8. `primaryRole` comes from `STAFF_ROLE_PRIORITY`.
9. The `StaffLoginSession` row gains `brandId`, `event:'LOGIN'` and `clientApp`.

Response, additive only:
```json
{ "user": { "...existing": "", "firstLogin": false, "spotId": "…|null", "staffKind": "PLATFORM|BRAND_ADMIN|SPOT_ADMIN|EMPLOYEE",
  "mustChangePassword": false, "brand": {"id":"…","name":"…","logoUrl":"…","isActive":true},
  "spots": [{"id":"…","name":"…","logoUrl":"…","cityId":"…","cityName":"…","brandId":"…","brandName":"…","brandLogoUrl":"…","isActive":true,"level":"OPERATE"}] } }
```

**Other auth routes**
- **Rate limits.** `/login`, `/admin/forgot-password` and `/admin/reset-password` are limited per email and per IP.
- **Reset codes** come from `crypto.randomInt` (6 digits). A per-account `resetFailedAttempts` counter survives reissued codes; 10 failures per hour lock the account (`resetLockedUntil`). Responses are uniform.
- **`/admin/change-password`** sets `mustChangePassword=false`. Until N+1 it also runs a top-level `employeeProfile.updateMany({ data: { isFirstLogin: false } })`.
- **Signup sites** (`authRoutes.ts:358-370, 579-594, 775-790, 942-957`; `AuthResolver.ts:90-107, 212-217, 291-302`):
  - no wallet is created; `ensureLoyaltyCode` runs;
  - no +500 bonus;
  - a PENDING Referral is created;
  - `language` comes from the optional body or argument, then `Accept-Language`, then PL.
- **All code generators** (OTP, prize, loyalty, referral suffix, random password, secure token) move to `crypto.randomInt` / `randomBytes`.

**Uploads (`routes/upload.ts`)**
- `requireAuth` uses `req.user` from the global middleware, which checks `tokenVersion` and `loginDisabled`.
- Every route loads its entity and asserts access **before** the S3 upload.
- Responses are `{ imageUrl, url }`.

| Route | Access |
|---|---|
| `POST /upload/brand/:brandId?type=logo\|cover` (new) | MANAGE_BRAND; stored under `brands/{brandId}`; writes the URL to the brand |
| `/taste/:id`, `/product/:id`, `/spot/:spotId?type=…` | MANAGE_SPOT |
| `/news/:id` | MANAGE_SPOT on `news.spotId`, otherwise PLATFORM |
| `/prize/:id` | MANAGE_BRAND on `prize.brandId` |
| `/profile`, `/delivery-incident/:orderId` | Unchanged apart from the shared auth |

**Reports (`routes/reports.ts`)**
- Same `requireAuth` fix; access by `assertSpotAccess(MANAGE_SPOT)`.
- PDFs carry the brand logo and name, and brand-staff history uses the history filter.
- `/sessions` accepts `?includeSwitches=1`.
- `/points/:spotId` lists every ledger row with that `spotId` grouped by source, plus redemptions at the spot.
- New, MANAGE_BRAND: `GET /reports/brand/:brandId/points?from&to` and `GET /reports/brand/:brandId/orders?from&to`.

**Invites (`AdminResolver.ts:131-233, 325-422, 576-609`)**
- One helper picks the link target by kind: BRAND_ADMIN → `GELATO_ADMIN_URL`; others → `GELATO_SPOT_URL`.
- `ROLE_LABELS` gains "Brand Admin".
- The brand logo and the assigned spots are listed.
- Every interpolated value goes through `esc()`, and a grep gate catches `${` inside template HTML without `esc(`.

### 2.10 Realtime and notifications

**Recipients: `getSpotStaffRecipients(prisma, spotId, {kind})`**

Users with `loginDisabled` are excluded.

| Who | Bell row | Push devices |
|---|---|---|
| EMPLOYEE of the spot | yes | all active devices |
| SPOT_ADMIN of the spot | yes | `activeSpotId = spotId OR (activeSpotId IS NULL AND clientApp IS NULL)` |
| BRAND_ADMIN | when push-eligible | 1 active brand spot → all devices; otherwise `activeSpotId = spotId` |
| **Fallback** (SPOT_NEW_ORDER, DELIVERY_INCIDENT) when the device set is empty | yes | every device of every SPOT_ADMIN of the spot and BRAND_ADMIN of the brand; the title is prefixed with the spot name |

**FCM token dedupe.** `registerFCMToken` runs in one transaction: it sets `isActive=false` on every other DeviceToken with the same `token`, then upserts the (userId, deviceId) row. At send time only tokens whose owner is still a recipient are used.

**Payloads** (server-rendered, so old builds show the new text too):
- **SPOT_NEW_ORDER:** "Order #{n} at {spotName} is waiting to be claimed."; data includes `spotId`, `spotName`, `brandId`.
- **ORDER_MESSAGE:** adds `spotId`, `spotName`, `brandId`.
- **DELIVERY_INCIDENT:** routed through NotifyService; adds `orderId`, `spotId`, `spotName`.
- **POINTS_EARNED:** variables `{points, totalPoints (brand wallet), brandName}`. The PL template uses server plural forms: "+{points} punktów w lodziarni {brand}. Masz tam teraz {total}." Data includes `brandId`, `spotId`, `source`, `multiplierPercent`.
- **New NotificationTypes:** `BIRTHDAY_BONUS`, `REFERRAL_BONUS`, `REWARD_REFUNDED`, `REWARD_EXPIRING`.
  - Points-type pushes carry `fcmData.kind = 'POINTS_EARNED'`.
  - Bell `data` carries `brandId`, `brandName`, `points`, `totalPoints`.

**WebSocket**
- `publishNewOrderNotification`, `publishOrderClaimed` and `publishDeliveryIncident` carry `{spotId, spotName, brandId, …}`.
- `publishPointsUpdated(r)` computes `legacyWallet` once and fills in `legacyBrandId`.
- PubSub stays in memory on a single instance (scaling out needs Redis).

**Staff subscription filter**
- `allowed = accessibleSpotIdSet(OPERATE)`, cached on the operation with a 60 s TTL. No per-event DB queries.
- On each TTL refresh the User row is re-read. A tokenVersion mismatch, `loginDisabled`, a non-ADMIN account or a lost staff role makes the filter return false, and `RealtimeRegistry` closes the socket (4401).
- With `spotIds`: deliver when `payload.spotId ∈ spotIds ∩ allowed`.
- Without arguments: PLATFORM and single-spot scopes get everything in `allowed`; multi-spot scopes get the legacy spot only.

**FCM topics.** `spot_staff` now includes BRAND_ADMIN; broadcasts stay PLATFORM-only; unsubscribe happens on remove, disable and logout.

### 2.11 Gates and verification scripts

All scripts live in `scripts/verify/*`. Add an ESLint `no-restricted-syntax` rule alongside the greps.

**Grep gates** (each must have zero hits outside the allowed files):
- `SPOTS_ADMIN` (allowed in the enum mirror only);
- `\.roles\b` (allowed in `src/auth/*`);
- `(pointBalance|pointTransaction|userPrize|prize)\.(create|update|upsert|delete)` and `\$(queryRaw|executeRaw)` (allowed in `src/services/loyalty/*`, BrandService, jobs);
- `(spotAdmins|employees|spotAdminProfiles?|employeeProfiles?|brandStaff)\s*:` and the model calls (allowed in access, StaffService, BrandService, staffRecipients);
- HTML `${` without `esc(`.

**Scripts**
1. `verify-brand-migration.sql`:
   - negative wallets;
   - spots without a BrandCity;
   - brandId mismatches between profiles, spots and memberships;
   - duplicate employees;
   - leftover SPOTS_ADMIN;
   - roles without a matching kind (report-only);
   - ledger sum vs balance;
   - brands over quota (report-only);
   - null client codes;
   - referral status distribution;
   - duplicate active FCM tokens.
2. `multiplier-dst.ts`:
   - Warsaw and Kyiv windows at 09:59, 10:00, 13:59, 14:00;
   - `2026-10-22T08:30Z` matches; `2026-10-29T08:30Z` does not; `2026-10-29T09:30Z` matches; Kyiv `2026-10-22T07:30Z` matches;
   - the 2027-03-28 gap;
   - overlap gives 300;
   - an `appliesToOrders`-only task;
   - spot scope;
   - inclusive dates.
3. `ledger-concurrency.ts`:
   - 50 parallel claims → 1 succeeds;
   - **replaying a requestId (same prize, other prize, other brand) → 1 UserPrize and 1 debit, or IDEMPOTENCY_CONFLICT**;
   - 20× `awardOrderPoints` → 1 credit;
   - 10× validate → 1 redemption;
   - quota races;
   - a no-op `setSpotActive(true)` at exact quota succeeds;
   - same `requestId` → `duplicate`;
   - referral race → paid once;
   - same key on different wallets → no transaction abort.
4. `flows.ts`, on staging:
   - brand creation, invite and login with and without the header (426);
   - quota and drafts;
   - multi-spot admin;
   - a spot admin creating a SPOT_ADMIN is refused;
   - a 1.0.1 `UpdateSpotDetails` re-send of unchanged values succeeds;
   - multiplier on a cash pickup;
   - courier DELIVERED credits points;
   - template, custom, legacy `×N` and daily cap;
   - self-award refused;
   - referral at brand B, including NO_BONUS;
   - reward A/B, used, expired, hand-over;
   - moveSpotToBrand refused while orders are open;
   - brand-B staff cannot see brand-A history after a move;
   - loyalty hook failure does not fail the courier mutation or the Stripe webhook, and the sweeper credits later.
5. `birthday-job.ts` and `reward-expiry-job.ts`: idempotence, guard rules, catch-up, lease race.
6. `code-normalization.ts`: table-driven over every pattern in §2.7.9.
7. `isolation-matrix.ts`:
   - every staff operation × {PLATFORM, BRAND_ADMIN A, SPOT_ADMIN A, EMPLOYEE A, CLIENT, COURIER} against brand-B ids;
   - REST uploads and reports;
   - the 3 staff subscriptions;
   - asserts that no error message contains a logout substring;
   - an explicit foreign `spotId` on `loyaltyCustomer` → SCOPE_FORBIDDEN.
8. `legacy-contract.ts` is **differential**:
   - documents extracted from the shipped bundles (client, spot, courier), the deployed landing bundle and the current admin bundle;
   - each document that validates against the committed `schema.pre-N.gql` must also validate against N, under the depth and alias rules;
   - known-dead documents sit in a checked-in allowlist;
   - executed tests (not only validated) for: arg-less `myPointBalance`, `prizes`, `myPrizes`, `redeemPrize`; `loyaltyCustomer` without a spot; `AwardPoints($spotId: ID)`; `ValidatePrizeQR`; **`CollectPickupOrder` returning a numeric `pointsAwarded`**; arg-less subscriptions; REST login.
9. `subscriptions.ts`: filtering with `spotIds`; legacy spot only; an employee removed → socket closed within 60 s; a disabled user's socket closed immediately.

---

## 3. Admin web (`admin-global-web-new`)

The console deploys **right after** backend N and never before it. It uses only the SDL in §2.8.

**Principles**
- One route tree per scope.
- The brand pages are shared between a BRAND_ADMIN (brand from the session) and PLATFORM support mode (`/brands/:brandId/*`).
- `brandId` is always sent.
- No UI library. `erasableSyntaxOnly`, so no TS enums.
- Copy avoids plural forms.

### 3.1 Session and plumbing

- **`src/lib/clientInfo.ts`:** `CLIENT_HEADERS = {'x-loodly-client': 'admin-web@' + VITE_APP_VERSION, 'x-loodly-api': '2'}`. Sent on REST, GraphQL and uploads.
- **`src/lib/authApi.ts`:**
  - `AdminUser` gains `staffKind`, `mustChangePassword`, `brand`, `spots` (LoginSpot, including `brandName`).
  - `LoginResult` carries `code`.
  - New `adminChangePassword`.
- **`src/auth/scope.ts`:** `scopeFromUser`, `homeFor` (PLATFORM `/brands`, BRAND_ADMIN `/brand`, others `/use-spot-app`), and `canManageStaff`, which mirrors `assertCanManageStaff`.
- **`src/auth/AuthContext.tsx`:**
  - State: `user`, `status`, `scope`, `brand`, `isSuperAdmin`, `isBrandAdmin`, `mustChangePassword`, `blocked`.
  - `login` calls `apolloClient.clearStore()` before persisting, then writes `admin_session_v='2'`.
  - `myStaffContext` is fetched `network-only` and revalidated on focus every 60 s or more.
  - A move to SPOT_ADMIN or EMPLOYEE blocks the session; NONE logs out with `no_membership`.
  - `changePassword` logs in again with the new password.
- **`src/lib/apollo.ts`:** an ErrorLink.
  - Log out only on `extensions.code === 'UNAUTHENTICATED'` or HTTP 401.
  - `PASSWORD_CHANGE_REQUIRED` routes to `/change-password`.
  - Every other code is shown, never treated as a logout.
- **`src/lib/errors.ts`:** `errorCode` and `errorText` map known codes to `Errors.<CODE>` (with variables from `extensions`), network failures to `Errors.NETWORK`, and anything else to the first server message.
- **`src/lib/upload.ts`:** `uploadImage(path, file)` (≤ 10 MB, jpeg/png/webp), returning `imageUrl ?? url`, plus `uploadBrandImage`, `uploadPrizeImage`, `uploadNewsImage`.
- **`src/auth/ProtectedRoute.tsx`:** becomes `RequireSession`, which redirects to `/change-password` while `mustChangePassword` is set.

| Login result | Console behavior |
|---|---|
| PLATFORM | Platform tree, home `/brands`; can enter any brand at `/brands/:brandId/*` (support banner) |
| BRAND_ADMIN | Brand tree, home `/brand` with a setup checklist; sidebar shows the brand logo |
| 403 `USE_SPOT_APP` (server, G8) | `UseSpotAppPage`; nothing is stored |
| 403 `NO_MEMBERSHIP` | `Errors.NO_MEMBERSHIP` |
| 426 `UPGRADE_REQUIRED` | `Errors.UPGRADE_REQUIRED` with a Reload button |
| Old SPA session (no `admin_session_v`) | Spinner until `myStaffContext` answers |
| Brand inactive | Yellow banner; Create spot and Activate are disabled |

### 3.2 Routes

- **Platform tree** (`AppLayout variant="platform"`):
  - `/brands`, `/brands/new`;
  - `/brands/:brandId` (index `BrandProfilePage`; `spots`, `spots/new`, `spots/:spotId/edit`, `rewards`, `promotions`, `staff`, `orders`);
  - `/spots` (directory), `/orders`, `/payouts`, `/admins` (Accounts), `/news`, `/quests` (frozen; hidden from the nav);
  - `/prizes` redirects to `/brands`.
- **Brand tree** (`BrandScopeProvider source="self"`):
  - `/brand`, `/spots`, `/spots/new`, `/spots/:spotId/edit`, `/rewards`, `/promotions`, `/staff`, `/orders`;
  - `/prizes` redirects to `/rewards`;
  - `/spots/:spotId/invite` redirects to `/staff?invite=1&spot=:spotId`.
- **`src/brand/BrandScope.tsx`:** `useBrandScope()` returns `{brandId, view, isPlatform, brandActive, quota, paths, refetch}` from `ADMIN_BRAND`; `useOptionalBrandScope()` returns null outside a scope.
- **`BrandScopeLayout`** (PLATFORM): header, `BrandSwitcher`, support banner, inactive banner and tabs.

### 3.3 Pages

| Page | Data / mutations | Key behavior and states |
|---|---|---|
| `BrandsPage` | `ADMIN_BRANDS` | Search; All / Active / Inactive filter; cards with logo, cities, `QuotaMeter`, staff count; "Default" badge; empty, error and over-quota states |
| `CreateBrandPage` | `CITIES`, `CREATE_BRAND`, then logo upload | Name 2–60; descriptions via `LocalizedTextFields`; ≥ 1 city (`CreateCityModal` with a time zone); `maxSpots` ≥ 0; optional bonuses; first admin (name, email, language). Handles `STAFF_CONFLICT`, `BRAND_NAME_TAKEN`, and a logo upload that fails after creation |
| `BrandProfilePage` | `useBrandScope`, `BRAND_SPOTS`, `CITIES` | Cards: `SetupChecklist` (BRAND_ADMIN; profile, cities, spot, set-up in Loodly Spot (menu, hours, photo), activation, reward, spot team (≥ 1 spot admin or employee); the first open step is marked as next; plus a spot-app hint with the Spot link); `BrandIdentityCard` (name read-only for BRAND_ADMIN; logo and cover upload or remove → `UPDATE_BRAND_PROFILE(null)`; preview); `BrandCitiesCard` (cities with spots are locked; `CITY_IN_USE`); PLATFORM only: `BrandPlanCard` (name, `maxSpots`, isActive with confirm, `billingNote`), `BrandAdminsCard`, `BrandDangerZone` |
| `SpotsPage` | Brand scope: `BRAND_SPOTS`; platform: `MY_ADMIN_SPOTS` + brand filter | Status chips **Draft / Active / Inactive**. "+ Create spot" disabled when `quota.totalSpots >= maxSpots+5` or the brand is inactive. Card actions: Edit, Staff, Orders, **Activate** (opens `ActivationChecklist`: hours set, ≥ 1 menu item, photo; warnings only; disabled at quota with `Quota.limitReached`), Deactivate (confirm) |
| `CreateSpotPage` | Brand cities; `CREATE_SPOT` (no `id`; `activate:false`) | Lists only the brand's cities; "+ Add city" for PLATFORM only; toggles `pickupEnabled`, `onlinePaymentEnabled`, `freeDeliveryThreshold`. Success: "Spot {name} created as a draft. Set up menu and opening hours in the Loodly Spot app, then activate it." Blocked states: no cities, total cap, brand inactive |
| `EditSpotPage` | `SPOT_DETAIL`, `UPDATE_SPOT` (diff only, no `isActive`), `SET_SPOT_ACTIVE` | Basics (name, city with a change warning, `AddressAutocomplete`, phone, email, description, coordinates); ordering options; status card (quota gating); staff at this spot (`BRAND_STAFF` filtered); PLATFORM danger zone: move to brand (`SPOT_HAS_OPEN_ORDERS` handled), delete |
| `PrizesPage` → Rewards | `ADMIN_PRIZES({brandId})` (archived included) | Filters All / Active / Disabled / Archived; validity line; modal: localized title and description sent as objects, cost > 0, quantity ≥ claimed (`REWARD_QUANTITY_BELOW_CLAIMED`), `validFrom` / `validUntil` (create and update), photo upload with retry; Delete (no claims) or Archive |
| `PromotionsPage` | `BRAND_TASKS`, `BRAND_PROMOTIONS`, `BRAND_SPOTS` | `PromotionCard` (status, Live now / Starts {date} / Ended, ×multiplier, schedule summary, dates, spots, applies-to, times applied; Pause/Resume/Archive/Delete). Unknown kinds render read-only. Empty state with "Start from this example" (×2, Thursday 10:00–14:00). `PromotionModal`: name; multiplier ×1.5 / ×2 / ×3 / custom 1.1–10; schedule ranges (day chips, From/To, "Until midnight", errors `errNoDays`, `errTimeOrder`, `errTooManyWindows`); dates; spots all or selected; applies-to (≥ 1); local-time hint listing the zones; overlap and future-only notes; live preview; always sends the full `BrandTaskInput` with `spotIds`. `BonusSettingsCard`: birthday toggle and points, referral points, Advanced: `fallbackPointsPerPln`, `manualAwardCap`, `staffDailyAwardCap` (0 = off) |
| `StaffPage` | `BRAND_STAFF({brandId})` filtered client-side | URL `?kind&spot&q&invite=1`. Tabs All / Spot admins / Employees / Brand admins. `StaffTable` (spot chips, Pending / Disabled / Active). `StaffRowActions` gated by `canManageStaff`: change spots, make employee, move, make spot admin, resend, reset (code flow), disable/enable, remove. `InviteStaffModal`: role cards, spot checklist or single picker, language, email code (default) or password handover; success / `accessAdded`; `STAFF_CONFLICT` on the email field; legacy-app note |
| `OrdersPage` | `BRAND_SPOTS` or `MY_ADMIN_SPOTS` | `SpotPicker groupBy="brand"`; adds COLLECTED and TERMINATED styles |
| `PayoutsPage` | `SPOT_PAYOUT_SUMMARIES({brandId})` | Brand filter |
| `AdminsPage` → Accounts | `ADMIN_ACCOUNTS` (+`kind`, `brandId`, `spotIds`) | Read-only directory with role, brand and spot counts; disable; the create form is removed |
| `NewsPage`, `QuestsPage` | PLATFORM | News uses `uploadNewsImage`; Quests shows a legacy banner and hides Create |
| `LoginPage`, `UseSpotAppPage`, `ChangePasswordPage` | | `?expired=1` notice; Reload on 426; password rules ≥ 8 characters with upper, lower and a digit |

**Shared components:**
- `components/ui/{Field, Button, Modal, ConfirmDialog, Toggle, Alert, EmptyState, Badge, FilterChip, FullPageSpinner}`;
- `ChipMultiSelect` (with locked chips), `LocalizedTextFields` (`canonical`, `nonEmpty`), `ImageInput`, `QuotaMeter` (amber at ≥ 80 %, red at ≥ 100 %);
- `CreateCityModal` (time-zone select over `Europe/*`), `AddressAutocomplete`, `SpotPicker` (`groupBy`, `allLabel`), `SpotChecklist`, `BrandSwitcher`, `ActivationChecklist`;
- `staff/*`, `promotions/*`, `brand/*`;
- `lib/{schedule, format, constants}` (`DEFAULT_BRAND_ID` is used for the badge only).

### 3.4 Documents, cache, i18n

**Fragments:** `CityFields` (+timezone), `BrandFields`, `BrandAdminViewFields`, `AdminSpotFields` (+`brandId`, `brand{id name logoUrl isActive}`, `timezone`, ordering fields), `StaffMemberFields`, `PrizeFields` (+`archivedAt`, `validFrom`, `validUntil`), `BrandTaskFields`.

**Modules**
- `graphql/brands.ts`: `ADMIN_BRANDS`, `ADMIN_BRAND`, `CREATE_BRAND`, `UPDATE_BRAND_PLATFORM`, `UPDATE_BRAND_PROFILE`, `SET_BRAND_CITIES`, `UPDATE_BRAND_SETTINGS`, `INVITE_BRAND_ADMIN`, `MOVE_SPOT_TO_BRAND`, `DELETE_BRAND`.
- `graphql/spots.ts`: `CITIES`, `CREATE_CITY` (+timezone), `MY_ADMIN_SPOTS`, `BRAND_SPOTS`, `CREATE_SPOT`, `UPDATE_SPOT`, `SET_SPOT_ACTIVE`, `SPOT_DETAIL`, `DELETE_SPOT`.
- `graphql/staff.ts`: `MY_STAFF_CONTEXT` (without `spots`), `BRAND_STAFF`, `INVITE_STAFF`, `SET_SPOT_ADMIN_SPOTS`, `MOVE_EMPLOYEE`, `CHANGE_STAFF_KIND`, `REMOVE_STAFF_MEMBER`, `RESEND_ADMIN_INVITE`, `SET_STAFF_LOGIN_DISABLED`, `ADMIN_RESET_STAFF_PASSWORD`.
- `graphql/tasks.ts`, `graphql/prizes.ts`, `graphql/admin.ts`, `graphql/payouts.ts`.
- Delete `INVITE_SPOT_ADMIN`, `SPOT_ADMINS`, `CREATE_ADMIN_ACCOUNT` and `InviteSpotAdminPage`.
- `scripts/check-graphql.ts` (`npm run check:graphql`) validates every document against `loodly-be/schema.gql`.

**Cache (`src/lib/cachePolicies.ts`)**
- `BrandAdminView` is keyed by `['brand', ['id']]` with `settings` and `quota` merged; `StaffContext` is keyed by `[]`; `StaffSpot` by `['spotId']`; `BrandPromotion` is not normalized (`keyFields: false`); `BrandTask.windows` uses `merge: false`.
- Every scoped query takes `brandId` in its variables.
- `clearStore()` runs on logout and before persisting a new login.
- List membership changes go through `evictRoot(...)`, with `refetchQueries: ['AdminBrand']` where quota or counts change.
- Uploads use `cache.modify`.

**i18n**
- `translations/resources/types.ts` gives the `Translations` type; `pl` and `ua` are typed against it, so `tsc` fails on key drift.
- New namespaces: `Brands`, `BrandForm`, `Quota`, `Setup`, `Localized`, `Spots.*` (Draft and activation keys included), `CreateSpot`, `EditSpot`, `City`, `Prizes`, `Promotions`, `Bonuses` (+`staffDailyAwardCap` "Maximum points one staff member can give per day (0 = no limit)"), `Staff`, `SpotChecklist`, `Roles`, `Errors`, `SpotApp`, `ChangePassword`, `Upload`, `Admins.colBrand`, `Payouts.brandFilter`, `Quests.legacyBanner`, `Orders.statuses.{COLLECTED,TERMINATED}`.
- `Errors.*` covers every code in §2.8 plus `NO_MEMBERSHIP`, `SESSION_EXPIRED`, `NETWORK`, `UNKNOWN`, `USE_SPOT_APP`.
- Copy follows the glossary in §5.9; PL uses "lokal" for spot and "marka" only in staff-facing console copy.

### 3.5 QA

- Header present → BRAND_ADMIN login works; header absent → 426.
- A SPOT_ADMIN logging in gets 403 `USE_SPOT_APP` and no session row.
- Draft → activate with quota.
- Promotions validation.
- Staff flows, including `STAFF_CONFLICT`, and a brand admin seeing brand-admin rows read-only.
- A revoked token logs the user out through `UNAUTHENTICATED`.
- All three locales fit the 240 px sidebar.

---

## 4. Spot app (`mobile-spot` 1.1.0)

Ships after N has been stable for at least 72 hours. 1.0.1 keeps working through the shims.

### 4.1 Session and plumbing

- **`shared/api-client/src/clientInfo.ts`:** headers `spot@<version>` and `x-loodly-api: 2` at every request site: `apollo-server.ts:66-74`, `api/client.ts:15-18`, `refreshToken.ts:28-35`, `api/upload.ts:27`, `spot-details/index.tsx:45-49`, `news/index.tsx:40`, `MenuItemModal.tsx:42`, `services/downloadReport.ts`, and WS `connectionParams`.
- **Error plumbing (`graphql/client.ts`):**
  - read `extensions.code` into `GraphQLResult.error.code`;
  - `UNAUTHENTICATED` → refresh, then logout;
  - domain codes never log out;
  - `SCOPE_FORBIDDEN` → `spotStore.revalidate`;
  - `PASSWORD_CHANGE_REQUIRED` → sign out to login with a notice;
  - `UPGRADE_REQUIRED` → `UpgradeRequiredOverlay`;
  - toasts map `Errors.codes.*`.
- **`contexts/SessionProvider.tsx`** replaces the per-instance `useAuthState`. This fixes live bug C3: the root never saw login or logout, so alerts were disabled after login and polling continued after logout.
  - `signIn(loginData)` writes the tokens and calls `spotStore.hydrateFromLogin`.
  - `useAuthState` stays as a wrapper.
- **Login (`app/login/index.tsx:90-155`):**
  - 403 → `res.error`; 426 → error plus an "Update app" button;
  - `mustChangePassword || firstLogin` → change-password mode;
  - otherwise `session.signIn`, then `/choose-spot` or `/(tabs)`;
  - delete `storeSpotContext`.
- **`signOut()`:**
  1. `removeFCMToken(getInstallId())`;
  2. `realtime.dispose()`;
  3. remove the auth keys, `spotContext` and `staff.session.v2`;
  4. `spotStore.reset()`;
  5. go to `/login`.
  `staff.activeSpot.v2.<userId>` is kept. Session expiry does the same.

### 4.2 Spot context

**`stores/spotStore.ts`** is an external store read with `useSyncExternalStore`. State: `{status: idle|loading|ready|needsChoice|noAccess|error|signedOut, userId, staffKind, brand, spots: StaffSpotVM[], defaultSpotId, activeSpotId, epoch, fetchedAt}`. `StaffSpotVM` includes `isActive`, `level`, `pendingOrderCount`, `myOpenClaimedCount`, `staffCount` and `manualAwardCap`.

| Storage key | Content |
|---|---|
| `staff.session.v2` | Cached context; removed on logout |
| `staff.activeSpot.v2.<userId>` | `{spotId, selectedAt}`, kept |
| `scan.handheld` | Device preference |
| `deviceInstallId` | Permanent uuid |
| `spotContext` | Legacy; read once for migration, then deleted |

**Resolution**
- 0 spots → `noAccess`.
- 1 spot → ready.
- Explicit login with more than one spot → `needsChoice`, with `defaultSpotId` preselected.
- Cold start → restore the candidate if it is still accessible, **unless** `canSwitch` and the stored `selectedAt` falls on a previous local day or is more than 8 hours old. In that case `needsChoice`, with the last spot preselected.
- Upgrade from 1.0.1 → block on `myStaffContext`, using the legacy `spotContext.spotId` as the candidate.

**`refresh()`** runs:
- on foreground (if the last fetch is more than 2 minutes old);
- every 10 minutes;
- on WS reconnect;
- on `SCOPE_FORBIDDEN`;
- on pull-to-refresh.

`myStaffSpots` is also polled every 30 s in the foreground when `canSwitch`, for the counters. If the active spot disappears:
- one spot left → switch to it and toast `lostAccess`;
- more than one left → `needsChoice`;
- none left → `noAccess`.

**`setActiveSpot(spotId, reason: 'user'|'choose'|'revalidate'|'restore')`:**
1. Persist the selection.
2. `epoch++`.
3. Leave spot-scoped stack routes (`router.dismissTo('/(tabs)')`).
4. For `user` and `choose`: fire-and-forget `selectActiveSpot(spotId, installId)`, a haptic and the toast `switched`. Skip the call when the choice equals the login spot.

There is no `'push'` reason (§4.6).

**Remount and stale guards.** `withSpotScope` keys the inner screen by `activeSpotId`. It wraps the tabs `index`, `prepared`, `scan`, `couriers`, `profile` and the stacks `menu`, `spot-details`, `dashboard`, `complaints`, `news`, `news_comments/[postId]`, `staff`, `history`, `canceled`, `courier/[id]`. It does **not** wrap `order/[id]`, `notifications`, `settings`, `login` or `choose-spot`. Every async loader re-checks `spotStore.getActiveSpotId()` after `await`.

**Consumer migration.** Every reader of the stored spot moves to `useActiveSpotId()` / `useActiveSpot()`:
- `useSpotOrders`, `useSpotAttentionOrders`, `useSpotMenu`;
- `OrderAlertProvider`;
- the tab screens, dashboard, couriers, courier detail, complaints, news, history, staff;
- `useNotificationRegistration`, `NotificationBridge`, notifications.

`useRole` becomes a selector returning `{ roles, userId, spotId, level, staffKind, isAdmin = atLeast(MANAGE_SPOT), isBrandAdmin, isPlatform, isEmployee, can }`. `ADMIN_ROLES` and `SPOTS_ADMIN` are removed.

**Gates**
- `app/index.tsx` routes to spinner, `/login`, `/choose-spot` or `/(tabs)`.
- The new `StaffTabsGate` wraps **both** `_layout.tsx` and `_layout.ios.tsx`. This fixes C6: iOS had no auth redirect and no push registration. The gate:
  - performs the redirects;
  - runs `usePushRegistration`;
  - shows `InactiveBrandBanner` and **`InactiveSpotBanner`** ("Not visible to customers yet").
- Provider order: `SessionProvider > SpotContextProvider > RealtimeProvider > Stack + OrderAlertProvider + NotificationBridge + UpgradeRequiredOverlay`.

### 4.3 Switcher UX

- **Visibility.** The dropdown appears when there is more than one accessible spot (inactive spots count). EMPLOYEE never gets a dropdown.
- **Phone:** `SpotPill` in every tab header (`TabHeader`): minimum height 52, 18px bold name (city when the brand has several cities), chevron, 48dp hit area.
- **Tablet/web:** `SidebarBrandBlock` with the brand logo and name, plus a sidebar pill.
- **More screen:** role and brand subtitle (`Roles.*`), a "Current spot" row, and "Brand settings (admin panel)" for MANAGE_BRAND (`config.ADMIN_WEB_URL`).
- **`SpotSwitcherSheet`:**
  - search when there are more than 8 spots;
  - grouping by city, or by brand for PLATFORM;
  - the active spot pinned first;
  - a **"Not open yet"** section for inactive spots;
  - rows at least 72dp high: logo, 18px name, city and address, a check mark, a red "N waiting" badge, a "you claimed N" chip, a "Last used" tag;
  - no confirmation step.
- **`app/choose-spot.tsx`:** "Where are you working today?" with the same rows. In `noAccess` state it offers the admin panel (BRAND_ADMIN), Retry and Sign out.
- **`OtherSpotsStrip`** (new; Orders tab, when `canSwitch`): an amber row, e.g. "Mokotów: 2 waiting · Wola: 1 you claimed ›", that opens the sheet. Hidden when all counts are 0.
- **Context reinforcement:**
  - `ScreenHeader spotScoped` subtitle;
  - the order alert reads "at {spot}";
  - order detail shows a banner when the order belongs to another spot (§4.6).
- **Accessibility:** roles and labels on every control; text ≥ 16px (sidebar caption 14px); contrast ≥ 4.5:1.

### 4.4 Realtime

- **`RealtimeProvider` + `shared/realtime/wsClient.ts`** keep one graphql-ws client per userId; they replace `useSpotOrderSubscription`.
  - `connectionParams` = bearer token + `clientConnectionParams()`.
  - On connect: emit `resync` and revalidate the spot context.
  - The socket is disposed on sign-out and on a server close code 4401.
- **Subscriptions** `SpotNewOrders`, `SpotOrderClaimed` and `SpotDeliveryIncident` use `spotIds: [activeSpotId]`.
  - They resubscribe whenever the active spot changes and emit `resync`.
  - Each sink drops payloads whose `spotId` is not the active spot.
- **`OrderAlertProvider`:**
  - enabled only when signed in and the spot status is `ready`, and not on `/choose-spot`;
  - resets its queue and the dismissed set when the spot changes;
  - `canDismiss` = `StaffSpot.staffCount > 1`, which counts brand admins. This replaces the two staff queries.
  - foreground FCM events for another spot are ignored there and toasted by NotificationBridge instead.
- **`deliveryIncident`** → `refreshEmitter`, toast `SpotAttention.incidentToast`, refetch.

### 4.5 Role gating

`auth/levels.ts` defines `atLeast()` and `capabilitiesFor(level)`.

| Level | Capabilities |
|---|---|
| OPERATE | operate orders, cancel with apology, collect, collect without QR, template award, redeem / hand over reward, availability toggles, couriers, canceled list |
| MANAGE_SPOT | custom award, templates, menu edit, spot details, dashboard and exports, complaints, news, history, staff management, create employee, courier applications and earnings, sessions |
| MANAGE_BRAND | crucial spot fields, create spot admin, assign spots, change kind, brand reports, open admin web |

`level` always comes from `activeSpot.level`, never from global roles.

- **`AccessGuard`** (lock screen for deep links) on dashboard, spot-details and complaints; staff, news and history move onto it.
- **Spot details** (`app/spot-details/index.tsx`):
  - without `editCrucialSpotFields`, name, address and coordinates are read-only with a lock icon and `SpotDetails.crucialLocked`, and they are **omitted** from the mutation variables;
  - read-only brand and city rows;
  - `SPOT_DETAILS_QUERY` adds `brand{id name}` and `city{id name}`.
- **Draft spots:** MANAGE_SPOT can edit menu, hours, photos and templates. Loyalty actions and news show `SPOT_INACTIVE`.

### 4.6 Push and notifications

- **`utils/deviceId.ts`:** `getInstallId()` returns a persistent uuid that replaces `Constants.sessionId` (C7).
- **Registration:** `RegisterDevice(token, platform, deviceId, clientApp:'spot', appVersion, activeSpotId)` runs once the spot context is ready and again on token refresh. Logout removes the token.
- **Foreground** (`NotificationBridge`):
  - a SPOT_NEW_ORDER for another accessible spot → toast `SpotNotif.newOrderOtherSpot` with a tap action;
  - anything else → toast prefixed with the spot name;
  - always `refreshEmitter`.
- **Tap routing (`openPush`), with no auto-switch:**
  1. Wait for `spotStore.ready()`.
  2. For an order route: open `/order/[id]` directly. The order screen is not spot-scoped and the server checks OPERATE on the order's spot.
  3. For a non-order route at another accessible spot: confirm dialog "Switch to {spot}?". Yes → `setActiveSpot(id, 'user')`, then navigate.
  4. The target spot is no longer accessible → `/notifications`.
- **Order detail other-spot banner:** "This order is from {spot}." plus a "Switch to this spot" button (`setActiveSpot(..., 'user')`). `ORDER_DETAIL_QUERY` adds `spot { brand { id name } }`.
- **Bell:** `MyNotifications(…, spotId)`, `UnreadNotificationCount(spotId)`, `markAllNotificationsRead(spotId)`. An **"All my spots"** filter chip in the notifications screen drops the `spotId`. Rows show `spotName`.

### 4.7 Staff screen (`app/staff/index.tsx`, rewritten)

**Who may create whom (client mirror of the server rule)**
- SPOT_ADMIN: employees only; role toggle hidden; one of their own spots (no picker when there is only one).
- BRAND_ADMIN / PLATFORM: Employee or Spot admin. An employee gets one spot (radio); a spot admin gets one or more (checkboxes). PLATFORM passes `brandId = activeSpot.brandId`.

**List and actions**
- **Data:** `brandStaff(spotId: activeSpotId)`; BRAND_ADMIN can switch between "This spot" and "Whole brand".
- **`StaffMemberRow`:** name, "You" tag, email, kind badge, spot chips, pending tag, login switch, "…" menu.
- **Action sheet**, actions hidden when not allowed: reset password, change spots, move employee, make spot admin / make employee, remove (with confirm).
- **Invite form:** role, `SpotMultiSelect` (rows ≥ 56dp), name, email, invite or password mode, then `inviteStaff`. Shows `Staff.invited`, `Staff.created` or `Staff.spotsUpdated`; error codes are mapped.
- **Sessions:** `spotStaffSessions(includeSwitches: true)`, labels from `Roles.*`, and a Login / Switched sub-label.

### 4.8 Scanner and loyalty

**Camera (`QrScanner.tsx:107-168`)**
- `barcodeTypes: ['qr','code128']`.
- Guide frame and `Scan.cameraHint`; `h-80` on phones; one-shot guard.

**Keyboard wedge**
- **Web:** keep `WebScannerInput`; refocus on window focus and 150 ms after submit; Tab submits.
- **Native "handheld scanner" mode** (`scan.handheld`):
  - a 64dp `HandheldScannerInput` with `showSoftInputOnFocus={false}`;
  - refocuses while the Scan tab is focused;
  - submits on Enter, or auto-submits after a fast keystroke burst of ≥ 8 characters followed by 120 ms of silence.
- The client only trims. All parsing happens on the server; the regex at `scan.tsx:42-73` is removed.
- The screen links "How to connect a scanner" (staff guide, §7.6).

**Pipeline**
- Modes: Add points / Collect order / Redeem reward.
- `staffScan(activeSpotId, raw)` routes by `kind`:
  - UNKNOWN → `Scan.unknownCode`;
  - CUSTOMER → `LoyaltyAward` or `OrderCollect`; in reward mode, a mismatch card offers switching mode while keeping the scan result;
  - REWARD → `PrizeRedeem`; in the other modes, a mismatch card.

**`LoyaltyAward` (customer screen)**
1. `CustomerLoyaltyCard`: brand logo, "Points at {brand}", name, code, big tiles for available points and ready rewards.
2. **`HandOverRewardList`:** `customer.readyRewards`, each a 56dp "Hand over" row → confirm → `handOverReward`. Errors are mapped from the REWARD_* codes.
3. `PromotionBanner` when `activeMultiplierPercent > 100`.
4. Template chips (≥ 56dp) with a quantity stepper. The CTA reads "Add {base} × {m} = {points} points".
5. Custom points (`can.awardCustom`), pre-validated against `manualAwardCap`.
6. Cancel / Award.
7. Template manager (`can.manageTemplates`).
8. `BrandRewardsList`: informational; up to 5 rewards with affordable / missing / out-of-stock badges.

**Awarding**
- `awardLoyaltyPoints({spotId, customer: customer.id, templateId?, quantity?, points?, description?, requestId})`.
- `requestId` comes from `utils/requestId.ts`. It is reused on retry and cleared when the selection changes or after success.
- Success screen: "Added {points} points at {brand}", a `basePoints × multiplier` line, the new balance, and a `duplicate` note.
- Errors: `BRAND_INACTIVE`, `SPOT_INACTIVE`, `SCOPE_FORBIDDEN`, `CUSTOMER_NOT_FOUND`, `AWARD_LIMIT_EXCEEDED` (per-award or daily).

**`OrderCollect`**
- Uses `scan.customer`, then `getCollectablePickupOrders(activeSpotId, customer.id)`.
- When nothing is collectable here, calls `pickupOrdersElsewhere`:
  - accessible spot → banner "This order is waiting at {spot}" with "Switch to {spot}";
  - otherwise → "Please send the customer to {spot address}".
- Confirmation: `Scan.collectedWithPointsAtBrand`.

**`PrizeRedeem`** (PR code; preview, then confirm)
- `!rewardUsableHere` → message by `reason`: `rewardWrongBrand` (shows no title or brand), `rewardUsed` (+`rewardUsedAt`), `rewardExpired`, `rewardInvalid`, `rewardBrandInactive`.
- Usable → preview with a 56dp "Confirm hand-over" → `validatePrizeQR(normalizedCode, activeSpotId)`.

**Idle banner:** `brandPromotions(brandId, spotId)` → "{title}: points ×{m} now · until {time}". Refetched on focus and every 5 minutes.

### 4.9 Uncommitted work

The invoice and hand-over-without-QR work (`app/order/[id].tsx`, `CollectWithoutQrModal.tsx` (untracked), `SpotOrderCard`, the orders and spotOrders queries and types, translations) and the backend `OrderResolver.ts:1449-1496` change (TERMINATED orders are not collectable) are committed **first**, separately (task P0-14).

The brands work branches from that commit. It adds the other-spot banner and `collectedWithPointsAtBrand` to the order screen, which stays unwrapped.

### 4.10 Files, i18n, QA

**Create**
- `stores/spotStore.ts`; `contexts/{SessionProvider, SpotContextProvider}.tsx`; `hooks/useActiveSpot.ts`; `auth/levels.ts`.
- `components/hoc/withSpotScope.tsx`.
- `components/organisms/{StaffTabsGate, TabHeader, RealtimeProvider, UpgradeRequiredOverlay, InactiveBrandBanner, InactiveSpotBanner, OtherSpotsStrip}.tsx`.
- `components/molecules/SpotSwitcher/{SpotPill, SpotSwitcherSheet, SpotRow, SidebarBrandBlock}.tsx`; `AccessGuard.tsx`; `Staff/{StaffMemberRow, StaffActionsSheet, SpotMultiSelect}.tsx`; `Scan/{CustomerLoyaltyCard, HandOverRewardList, BrandRewardsList, PromotionBanner, ScanMismatchCard, PickupElsewhereBanner}.tsx`.
- `app/choose-spot.tsx`; `shared/realtime/wsClient.ts`; `shared/api-client/src/clientInfo.ts`.
- Query modules `staffContext` (`MyStaffContext`, `MyStaffSpots`, `SelectActiveSpot`), `staffLoyalty` (`StaffScan`, `BrandPrizes`, `BrandPromotions`, `AwardLoyaltyPoints`, `HandOverReward`, `PickupOrdersElsewhere`), `brandStaff`, `notifications/removeDevice.ts`.
- `utils/{requestId, deviceId, errorCodes, leaveSpotScopedScreens}.ts`.

**Modify** the files listed in §4.1–4.8. `app.json:5` becomes 1.1.0. `config` gains `ADMIN_WEB_URL` and the store URLs.

**Delete** `hooks/useSpotOrderSubscription.ts`, `storeSpotContext` and `getStoredSpotContext`. Dead client-era code (`usePrizes`, `usePointBalance`, `MerchantStore/*`, `settings`) is left untouched.

**i18n.** Namespaces `SpotSwitcher`, `ChooseSpot`, `Roles`, `Brand`, `Scan.*` (handover, reasons, wedge, promotions), `Staff.*`, `SpotDetails.*`, `Dashboard.*`, `Complaints.adminOnly`, `OrderAlert.atSpot`, `OrderTrack.{otherSpotBanner, switchToSpot}`, `SpotNotif.newOrderOtherSpot`, `SpotAttention.incidentToast`, `Errors.codes.*`, `Upgrade.*`, `OtherSpots.{waiting, youClaimed}`, `Scan.handOver*`, `Scan.elsewhere*`. All three files keep identical key sets, with plural suffixes `_one/_few/_many/_other` (pl, ua) and `_one/_other` (en).

**Static gates**
- `tsc --noEmit` shows no new errors.
- Zero grep hits for `getStoredSpotContext|storeSpotContext|'spotContext'` (except the migration), `SPOTS_ADMIN`, `useSpotOrderSubscription`, `roles\.(includes|some)\(` outside `auth/levels.ts`, and `Constants\.sessionId`.
- Every document validates against the schema.
- Locale key parity.

**Device matrix**

Devices: iPhone (NativeTabs), Android phone, Android tablet with a USB HID scanner, iPad, web.

1. A single-spot employee has alerts right after login.
2. A spot admin with A and B: choose screen, pill on all tabs, `SPOT_SWITCH` row recorded.
3. Switching mid-scan resets state with no flash.
4. A new order at B while on A shows only the strip count.
5. **A push for B while on A opens the order with the banner and does not switch.**
6. A one-spot-brand admin gets pushes on every device.
7. When no device covers B, B's managers get the fallback push.
8. Spot details: crucial fields locked for spot admins.
9. Staff rules hold.
10. Deep links hit the guards.
11. Code 128, a Ukrainian-layout wedge, legacy JSON and typed codes all scan.
12. Promotion preview and `duplicate` on double tap.
13. Per-award and daily caps.
14. A wrong-brand reward shows no title.
15. Hand-over from the card.
16. Reward used twice.
17. Reward code scanned in Add-points mode shows the mismatch card.
18. Revalidation after losing a spot.
19. Shared-tablet logout.
20. Brand deactivated.
21. A draft spot can be set up; loyalty is blocked there.
22. Pickup at the wrong spot shows the elsewhere banner.
23. Upgrade from 1.0.1.
24. The first open of a new day asks for the spot.

---

## 5. Client app (`mobile` 1.1.0)

Ships after N has been stable for at least 72 hours (manual store release). Every decision favors fewer choices and bigger text.

### 5.1 Verified constraints

| # | Constraint | Where |
|---|---|---|
| F1 | The whole app assumes one global wallet | `hooks/usePointBalance.ts:8-67` |
| F2 | No shared Apollo cache, so state is shared through a React context | `apollo-server.ts:56-81` |
| F3 | `useAuthState` is per instance | `hooks/useAuthState.ts:22-28` |
| F4 | NativeTabs must stay mounted, so the provider sits at the root | `app/(tabs)/_layout.ios.tsx:28-32` |
| F5 | The points WS lives in the tab layouts and fans out through `pointsEvents` | |
| F6 | The city is stored twice (AsyncStorage name and `preferredCityId`) | |
| F7 | Hermes lacks `Intl.PluralRules`; the `intl-pluralrules` polyfill is required | |
| F8 | Device `uk` must map to the app's `ua` | |
| F9 | Language is not synced to the server (fixed in N: `UserChangeInput.language`) | |
| F10 | Spot 1.0.1 accepts a raw `GL-` QR (`mobile-spot/app/(tabs)/scan.tsx:46-58`) | |
| F11 | History links to a route that does not exist and prints a wrong sign | `app/orders/index.tsx:64-69, 95-97` |
| F12 | Text too small, no accessibility labels | |
| F13 | The app opens on the News tab | `app/(tabs)/index.tsx:281-326` |
| F14 | No barcode, brightness or sheet library installed | |
| F15 | The Tasks tab promises +500 / +700 | |

### 5.2 Architecture

**`hooks/useBrands.tsx`: `BrandProvider`**
- Mounted in `app/_layout.tsx` inside `ToastProvider`, around `UpgradeRequiredGate`, `NotificationBridge` and the `Stack`.
- Always renders its children.
- Lazy: it fetches only after the first `ensureLoaded()`.
- Resets on `onSessionExpired` and the new `onLoggedOut`.

```ts
SELECTED_KEY = uid => `loodly.selectedBrand.v1:${uid}`         // kept across logout for the same user; removed on account delete
SNAPSHOT_KEY = uid => `loodly.loyaltyOverview.v1:${uid}`       // wallets + readyToPickUp WITHOUT qrCode; deleted on logout and expiry
LAST_CARD_KEY = 'loodly.lastCard.v1'                           // {loyaltyCode, firstName}; rewritten on every `me`; cleared on explicit logout and account delete
interface BrandContextValue { status; overview; mode: LoyaltyMode; wallets; engaged; others; paused; selectedWallet; readyToPickUp;
  cityId; city; fetchedAt; stale; offline; lastGain; ensureLoaded(); refresh({maxAgeMs}); selectBrand(id, reason:'user'|'push'|'earn');
  walletFor(brandId); setPickerOpen(open); setCardFocused(focused) }
```

**Data flow**
- WS `pointsUpdated(allBrands: true)` → `emitPointsUpdated` → `patchWallet` (an existing wallet is updated, with a refetch debounced 1.5 s; a new brand triggers an immediate refetch) → `lastGain`.
- **Auto-follow** happens only when `change > 0`, the source is STAFF_* or ORDER, the picker is closed, the app is active **and** My card or the fullscreen card is on screen (`cardFocused`). Otherwise the toast carries a "Show {brand}" action.
- Refresh triggers: `refreshEmitter`, AppState active (30 s), screen focus (10 s), city changed.
- **Activation:**
  1. read the snapshot;
  2. fetch `LoyaltyOverview`;
  3. if `cityId` is null and an AsyncStorage city name exists, resolve it with `utils/cityMatch.ts`, refetch with `fallbackCityId`, and heal `preferredCityId`.
- On error, keep the last data with "Updated HH:MM" (offline).

**Documents** (`shared/api-client/src/graphql/queries/loyalty`)
- `LoyaltyOverview` (`me{id loyaltyCode preferredCityId}` + `myLoyaltyOverview` with `wallets{… paused lastActivityAt brand{…WalletBrandFields} nextReward activePromotion{…PromotionFields}}`, `readyToPickUp{… isRedeemableNow brand prize}`, `city{id name nameLocal}`).
- `BrandsInCity` (with `spotCount(cityId)`), `BrandDetail`, `BrandRewards`.
- `PromotionFields` includes `timezone spotNames appliesToOrders appliesToTemplateAwards`.

**Changed documents**
- `PrizeDetail`, `MyPrizes` (+brand, `isExpired`, `isRedeemableNow`), `RedeemPrize($prizeId, $requestId)`.
- `GetMyPointBalance($brandId: ID!)` is used only as a fallback.
- `GetMyPointTransactions($limit, $brandId)` (+`source`, `multiplierPercent`, `spot{name}`, `brand`).
- `SpotDetail`, `AllSpots`, `SpotsByCity` (+brand, `activePromotion`).
- Order detail adds `spot.brand`.
- `RegisterDevice` (+`clientApp`, `appVersion`).
- WS subscription `pointsUpdated(allBrands: true)`.
- `UpdateProfile` (+`language`).
- The arg-less `Prizes` and `myPointBalance` calls are removed.

**Plumbing**
- `clientInfo.ts` headers at the 4 HTTP sites and in WS `connectionParams`.
- `client.ts` reads `extensions.code` before `isAuthError`: only `UNAUTHENTICATED` refreshes or logs out; domain codes use `silentCodes`.
- `UPGRADE_REQUIRED` → `UpgradeRequiredGate`.
- `requestId` from `utils/requestId.ts` (no `crypto.randomUUID` on Hermes).

**City and language**
- `useResolvedCity` prefers `me.preferredCityId`, then the AsyncStorage name.
- Selecting a city emits `cityChanged`.
- `LanguageSelectorModal` calls `updateProfile({language})`, and does so once after login when the device language differs.

### 5.3 Decision table (`utils/loyaltyMode.ts`, a pure function)

```ts
type LoyaltyMode = LOADING | ERROR | NO_CITY | NO_BRANDS_IN_CITY{cityId} | ONE_TO_DISCOVER{brandId} | MANY_TO_DISCOVER{cityId} | SINGLE{brandId} | MULTI{brandId}
isEngaged = w => !w.paused && (w.availablePoints > 0 || w.readyToPickUpCount > 0)
E=1 → SINGLE; E≥2 → MULTI (persisted selection if still valid, else defaultBrandId);
E=0 → showRewardsPicker ? MANY_TO_DISCOVER : defaultBrandId ? ONE_TO_DISCOVER : cityId ? NO_BRANDS_IN_CITY : NO_CITY
```

| Mode | My card: points strip (≤ 120dp, above the code) | Picker on Home | Rewards tab | Picker on Rewards |
|---|---|---|---|---|
| NO_CITY | "No points yet · Choose your city ›" (opens `CitySelectorModal`) | no | "Choose your city" + [Choose city] | no |
| NO_BRANDS_IN_CITY | "No points yet · {city}: no places with rewards yet" | no | "No rewards nearby yet" + [Change city] | no |
| ONE_TO_DISCOVER | "(logo) {Brand} · 0 points · Info ›" | no | Static brand header, HowToEarn, read-only catalog | no |
| MANY_TO_DISCOVER | "No points yet · {city}: N places with rewards ›" | no | HowToEarn (generic) + inline discovery list ("Your places" first, then city brands) | inline list |
| SINGLE | "(logo) {Brand} · 1 250 points · Info ›" | **hidden** | Ready to pick up (all brands) → static header → points → catalog → "N other places in {city} ›" (only when other wallets exist) | **hidden** |
| MULTI | "(logo) {Brand} · 1 250 points · Change ⌄" | yes | Ready to pick up → `BrandSwitcher` → points → catalog | yes (shared selection) |

**Rules in every mode**
- Ready-to-pick-up items from **all** brands show with a brand label.
- Paused wallets appear in a greyed "Paused" section on Rewards: "{brand} is not taking part right now. Your {n} points are saved."
- The persisted selection is written only by a picker tap, a push carrying `brandId`, or an auto-follow. A prize detail never changes it.

### 5.4 My card (code first)

**Home top tabs:** `initialRouteName="Account"`, labelled "My card", labels ≥ 16px. Order on the screen:
1. **`LoyaltyPointsStrip`** (≤ 120dp): logo, name, points, then "Change ⌄" or "Info ›".
2. **`LoyaltyCodeCard`**, full width. Title "Your card · one card for all places"; `CodeFormatToggle` (QR | Barcode, 56dp each); the code; "Card number" plus the code at 28px monospace; a 48dp "☀ Bigger and brighter" button.
   - The QR size is computed so the **whole code card is visible without scrolling on a 375×667 screen at 100 % and 130 % font size**; this is the acceptance criterion.
3. `ReadyToPickUpBanner`: "🎁 A reward is waiting: {reward} · {brand} ›", with "Use it today" or "Use it by tomorrow" when relevant.
4. `LoyaltyPointsCard` details: progress to the next reward, promotion ribbon, [See rewards].
5. "🕘 Points history ›".

```
┌──────────────────────────────────────────┐
│ loodly                          🔔   ⚙   │
│   News   │  My card  │  Tasks            │ 16px
│ ┌──────────────────────────────────────┐ │
│ │(LB) Lody Babci  1 250 points Change ⌄│ │ strip, 72dp
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Your card · one card for all places  │ │
│ │ [ ▣ QR code  ● ][ ║║║ Barcode     ]  │ │ 56dp
│ │           ┌──────────────┐           │ │
│ │           │  QR (≤220pt) │           │ │
│ │           └──────────────┘           │ │
│ │ GL-ABCD2345     [☀ Bigger/brighter]  │ │ ← fully above the fold
│ └──────────────────────────────────────┘ │
│ 🎁 A reward is waiting: Free scoop · GM ›│
│ ▓▓▓▓▓▓▓░░ 150 more points for: Large cone│
│ ✨ Double points · now, until 14:00       │
│ [            See rewards              ]  │
│ 🕘 Points history                      › │
└──────────────────────────────────────────┘
```

**Codes**
- QR value = raw `loyaltyCode`. Only when the code is null: legacy JSON `{userId, type:'LOYALTY_USER'}`.
- Barcode = Code 128B of `loyaltyCode`, rendered by the hand-written `utils/barcode/code128.ts` with `react-native-svg`:
  - 10-module quiet zones; pixel snapping to whole device pixels;
  - falls back to QR when a module would be under 2 px;
  - `jsbarcode` is a dev-only oracle in `scripts/verify-code128.js`;
  - test vectors: `GL-ABCD2345` (checksum 29), `GL-ZZZZZZZZ` (42), `GL-23456789` (57); 156 modules (176 with quiet zones).
- Code-format preference: `loodly.codeFormat.v1` (`qr` | `barcode`), shared by My card, fullscreen and the reward code.

**`LoyaltyCodeFullscreen`**
- White background, `expo-keep-awake`, `useMaxBrightness(true)` from `expo-brightness`, restored on blur, background and unmount.
- Toggle; maximum-size code; 34px code text; "Hold the phone still, about a hand away from the scanner."; 64dp Close.
- Portrait only.

**Offline and logged-out access**
- `LAST_CARD_KEY` means the card renders offline.
- After a **session expiry** (not an explicit logout), `/welcome` shows "Show my card", which renders the stored code.

### 5.5 Picker, rewards, brand page

- **`BrandSwitcher` / `BrandHeader`:** 64dp, logo 48, 20px name (up to 2 lines), "Change ⌄" or "Info ›".
- **`BrandPickerSheet`** (RN Modal, max height 85 %):
  - title "Choose a place", subtitle "You collect points at {n} places";
  - then the line "Points you collect at a place can be used only there, at any of its locations.";
  - rows in server order, then an "Other places" section and a "Paused" section;
  - row order is frozen while the sheet is open;
  - rows 72dp: logo, name, one status line (🎁 "{n} reward(s) to pick up" → ⭐ "Enough points for a reward" → "{n} points to the next reward" → "Start collecting here"), points, radio;
  - selected row: 2px red border; tap selects, plays a haptic and closes after 250 ms.
- **`RewardRow`** (single column):
  - 72px image, 20px localized title, cost;
  - status computed against `walletFor(prize.brandId)`: "✓ You can get this now", a progress bar with "{n} more points", or "Not available right now".
  - `useBrandRewards` keeps a 60 s cache per brand.
- **`ReadyToPickUpList`:** sits above the switcher; covers all brands; [Show code]; "Staff can also scan your card to hand it over."
- **`HowToEarnCard`:** steps (show the card / order in the app / choose a reward), the birthday gift, and referral "only at places that take part".
- **`BrandDiscoveryList`** and the **`app/brands/index.tsx`** screen: logo, description, "{n} locations · {m} rewards" (from `spotCount`), birthday and "×2 now" chips.
- **`app/brand/[id].tsx`:** cover, logo, description, "Your points here", promotions, HowToEarn, rewards, locations (my city first). An inactive brand shows "This place is not available right now."
- **Prize detail (`app/prize/[id].tsx`):**
  - the brand comes from the prize and the wallet from `useBrandWallet(prize.brandId)`;
  - brand row "Valid at all {brand} locations";
  - archived prizes or inactive brands show "no longer available";
  - **`ConfirmRedeemSheet`:** "Get this reward? {reward} at {brand} for {cost}. You will have {left} left. After you get it, you have 7 days to pick it up at any {brand} location." with [Yes, get it] / [Not now];
  - success → `router.replace('/prize/mine/{id}?fresh=1')`;
  - errors map `INSUFFICIENT_POINTS` (with `missingPoints`) and `REWARD_UNAVAILABLE`; retry reuses the same `requestId`.
- **My reward (`app/prize/mine/[id].tsx`):**
  - brand header; the fresh-claim banner;
  - **QR and Code 128 toggle for `PR-XXXXXXXX`**, sharing the format preference;
  - 28px code; brightness boost;
  - refetches when the screen regains focus or a push arrives; flips to "Used — enjoy!" once redeemed.

### 5.6 Promotions, history, other touch points

- **`BrandPromotionBanner`:**
  - headline: "Double points" / "Triple points" / "Points ×{x}";
  - "Now, until {time}" formatted in `promotion.timezone`;
  - schedule shown as stored ("Thu 10:00–14:00");
  - scope: "At all {brand} locations", or "At: {spotNames}";
  - applies-to line: "On app orders" / "At the counter" / both, from the two flags.
- **Points history (`app/orders/index.tsx`):**
  - the row title comes from `source` (keys `History.source.*`, e.g. ORDER → "Order at {brand}", STAFF_TEMPLATE / STAFF_CUSTOM → "At {spot}", BIRTHDAY, REFERRAL_*, PRIZE_CLAIM, PRIZE_REFUND, ORDER_APOLOGY);
  - `description` is shown only for LEGACY or unknown sources;
  - fixes: sign `−`, route `/order/track/{id}`;
  - "×2" chip when multiplied;
  - filtered by `brandId` in MULTI mode;
  - text ≥ 16px.
- **Settings pill:** selected brand logo and points; hidden when nothing is engaged.
- **Spot detail:** "Part of {brand} · Your points here", plus the promotion.
- **Order tracking:** the apology line names the brand.
- **Notifications:**
  - toast only when `change > 0`;
  - POINTS_EARNED, BIRTHDAY_BONUS, REFERRAL_BONUS and REWARD_REFUNDED route to `/(tabs)?section=account&brandId=…&t=…`;
  - REWARD_EXPIRING routes to `/prize/mine/{id}`;
  - new icons in the notification center.
- **Tasks tab:**
  - a Promotions section;
  - referral copy has no number ("only at places that take part; both get points after the friend's first order there"); NO_BONUS referrals are shown;
  - birthday copy: "Birthday gifts from: {brands}", plus the 30-day note;
  - `QuestCard.points` becomes optional.
- **Deleted:** `usePointBalance`, `usePrizes`. Do not extend the dead merchant-era components.

### 5.7 Design rules (older users)

- **Text:** minimum 16px; body 18px; row titles 20px; section titles 22px; screen titles 28px; the big number 56–60px with `maxFontSizeMultiplier` 1.3.
- **Touch targets:** rows ≥ 72dp; primary buttons 56dp; icon buttons 48dp with a text label.
- **Contrast:** small red text uses `#B01E1E`; secondary text `#4B5563`; badges always pair an icon with text.
- **Motion:** Reduce Motion disables the count-up and confetti.
- **Gestures:** no swipe-only interactions; layouts survive font scale 2.0.
- **Gate:** zero hits for `rg "text-xs|text-\[1[0-5]px\]"` in the new folders.

### 5.8 i18n

- `translations/index.ts` imports `intl-pluralrules` first and maps the plural rule for `ua` to `uk`; dev asserts check "5 punktów" and "22 бали".
- `utils/formatPoints.ts` provides `pointsText(t, n)`.
- New namespaces: `Loyalty`, `LoyaltyCode`, `Prizes` additions, `Promo`, `Brand`, `History.source.*`.
- Changed: `Home.account` "My card"; quest and Tasks copy; `Notifications.*` (`bodyBrand`, `birthdayBonus`, `referralBonus`, `rewardExpiring`, `rewardRefunded`); `PointsHistory.*`; `Ordering.terminated.pointsBrand`. `Home.qrInstructions` is removed.
- Plural matrices: pl 1/2/4/5/12/21/22/25/1001; ua 1/2/5/11/21/22/25; en 1/2.

### 5.9 Shared glossary

Applies to every app's customer-facing strings and to the server push templates.

| Concept | EN | PL | UA |
|---|---|---|---|
| brand | place ("{name}") | lodziarnia {name} (name never inflected) | морозиварня {name} |
| spot | location | lokal | заклад |
| points | points (no "pts") | punkty (no "pkt" in sentences) | бали |
| reward | reward | nagroda | нагорода |
| card | card | karta | картка |
| Rule line | "Points you collect at {brand} can be used only at {brand}, at any of its locations." | "Punkty zebrane w lodziarni {brand} wymienisz tylko w lodziarni {brand}, w dowolnym jej lokalu." | "Бали, зібрані в морозиварні {brand}, можна використати лише в {brand}, у будь-якому її закладі." |

A native speaker reviews PL and UA before release.

### 5.10 QA

The 4 extra seed personas (§2.4) are required.

- Each of the 6 modes, on My card and on Rewards.
- The code card is visible without scrolling on 375×667 at 100 % and 130 % font.
- Auto-follow only while My card is focused.
- A first credit at a second brand moves SINGLE to MULTI.
- Logout, then a second user: no data leaks; the snapshot has no `qrCode`.
- Airplane mode: the card still renders.
- Session expiry: "Show my card" on welcome.
- A deep-linked prize uses the prize's brand wallet.
- `requestId` replay produces no double spend.
- A PR barcode is read by an imager scanner.
- Staff hand-over flips the "Used" state.
- Brightness is restored.
- VoiceOver / TalkBack.
- Font scale 200 %.
- Plurals.
- A Ukrainian device starts in `ua`.
- Push routing from cold start, background and foreground.
- Paused brand state.

---

## 6. Landing (`landing-page-new`)

The landing is a live loyalty client: a static export served by Apache, with account, points, rewards, QR, quests and checkout. It needs no new npm dependency, no new dynamic route and no `.htaccess` change.

| Drop | When | Content |
|---|---|---|
| **L1a** (works on today's and N's schema) | Before N, and live by N | (1) Brand-neutral quest copy; the badge renders only when non-empty. (2) LoyaltyCard: QR shows the raw `GL-` code (JSON fallback), a QR/Barcode toggle with an in-house `app/lib/code128.ts` and `Barcode.tsx`, the preference in `gelato-code-format`, brightness overlay by format. (3) Expired rewards leave "Active" (`validUntil`). (4) PL spot wording "punkt" → "lokal". (5) Remove the "Locked" line. (6) `x-loodly-client: landing@<version>` header, **without** `x-loodly-api`. (7) `ApiError {message, code, extensions}`; `isAuthError` is true only for `UNAUTHENTICATED` or the legacy substrings, and false for domain codes. (8) Inactive spot → banner and no ordering. (9) Redeem errors show the server message |
| **L1b** (needs N) | After cutover (old instance stopped) | Additive brand fields on balance, transactions, prizes, `myPrizes` (`isExpired`), `redeemPrize(requestId)` and `SPOT_FIELDS`. Header "points at {brand}". Brand labels on rewards and history (when more than one brand). `requestId` per opening of the detail modal. Spot brand line (when the list spans 2+ brands). Inactive brand blocks ordering. Copy: "One card for every place. Points stay with the place where you collect them." / PL "Jedna karta do wszystkich lodziarni. Punkty zostają w lodziarni, w której je zbierasz." Optional read-only "Your points at other places" from `myLoyaltyOverview` when `engagedBrandCount > 1` |
| **L2** (parity) | Later phase | `BrandProvider` inside AccountDashboard; `myLoyaltyOverview`; `BrandPicker` + `Sheet` (bottom sheet below 640px, dialog above); shared selection `gelato-brand:<userId>` (cleared on logout); `?tab=prizes&brand=…` deep links (ad-hoc entry via `brand(id)`); "Ready to pick up" across brands; per-brand catalog and affordability; history with `brandId` and titles from `source`; no-points discovery; city chooser that writes `preferredCityId` and `gelato-city-id`; paused section; promotions using `timezone`, `spotNames` and applies-to; per-brand quest lists; explorer brand chips; `<Suspense>` on `/account` and `/spots`; reward QR plus PR barcode; refresh triggers (mount, after redeem, `visibilitychange` 30 s, tab switch, every 20 s while the card overlay is open, with a "+N at {brand}" toast); error mapping from `extensions`; `x-loodly-api: 2` |
| L3 | After L2 | Live points over graphql-ws; `/brands/[id]` static pages; point estimate at checkout; codegen |

**Static export rules**
- The pre-render stays `{ spots { id } }`, so a build against an older backend still works.
- Brand context travels in query strings.
- Locale JSON is bundled, so copy changes need a rebuild.
- Fallback behavior must be tested on Apache staging.

**Rollback:** keep `out-<sha>.tgz`. A backend R2 requires re-uploading the previous `out/` for L1b and L2.

**QA:** build (`out/spots/*.html` count = spots + 1), personas at 320px and 1280px, redeem double-click, deep links, wedge scanner on the barcode, logout clears the brand key, Lighthouse accessibility ≥ 90.

---

## 7. Backward compatibility and rollout

### 7.1 Installed builds after N

| Client | Behavior |
|---|---|
| Client 1.0.3 | Legacy wallet balance (null-safe); rewards of that brand only; redeem works; live toast only for legacy-wallet events; the server-rendered POINTS_EARNED push names the brand; the JSON QR keeps working. Its Tasks copy (+700/+500) becomes untrue; mitigated in §7.5 |
| Spot 1.0.1, single-spot staff | Unchanged. The employee logout trap is fixed (`spotEmployees` at OPERATE). Template awards are recognized from the description. Pickup collect returns `pointsAwarded`. Spot-news posting and custom points become admin-only (already hidden in the UI) |
| Spot 1.0.1, BRAND_ADMIN / multi-spot SPOT_ADMIN | Forced to re-login (M9 tokenVersion bump), then 426 with "Please update…" |
| Courier 1.0.0 | Unchanged (balance shows 0). Delivering now credits the customer; failures never reach the courier |
| Landing (old bundle) | Shims; L1a is required by N |
| Admin SPA (stale tab) | Login gets 426 "refresh the admin page"; reload fixes it |

### 7.2 Deploy order

1. **P0 release** (security groundwork, `auth_hardening` migration), deployed and clean for ≥ 1 week. Landing **L1a** uploaded. Uncommitted work committed (P0-14).
2. Snapshot dry run passes (§7.4). The rollback and roll-forward scripts have been rehearsed on staging.
3. Announce a 15-minute freeze on staff and admin writes. Take a Railway backup and `pg_dump -Fc`.
4. Deploy **backend N**. M1–M9 run on boot; the healthcheck holds promotion until `/health` answers.
5. When N is ACTIVE and a smoke query succeeds (authenticated `myStaffContext` and `{ __type(name:"StaffContext"){name} }` on staging): deploy the **admin web**.
6. Post-cutover operations:
   - (a) The super admin recreates the default brand's reward catalog (`createPrize(brandId:<D>)`), or explicitly accepts an empty catalog (a D5 consequence).
   - (b) Publish a PLATFORM global news item: "Points are now collected separately at each place. Test points were reset."
7. After the old Railway instance is gone: upload landing **L1b**.
8. Submit **mobile 1.1.0** and **mobile-spot 1.1.0** with manual or phased release. **No courier build.** Release once N has run clean for ≥ 72 hours. Deploy the spot web 1.1.0 build at the same time.
9. Once 1.1.0 is live, broadcast FCM to client devices with `clientApp IS NULL`: "Update the app to see your points at each place", with store links.
10. Onboard the first real brand **only after** mobile-spot 1.1.0 is live in both stores and on web. Rename or reassign the default brand's spots before landing L2.
11. Release **N+1** after ≥ 1 week of clean logs following the last 1.1.0 store release; **N+2** after N+1 is stable.
12. Legacy enforcement (`MIN_CLIENT_API_ENFORCED`) on the date chosen in Q10.

### 7.3 Configuration and flags

**`loodly-be/railway.json`** (new):
```json
{ "$schema":"https://railway.com/railway.schema.json",
  "build":{ "buildCommand":"npm ci && npx prisma generate && npm run build" },
  "deploy":{ "startCommand":"npx prisma migrate deploy && npm run start", "healthcheckPath":"/health",
             "healthcheckTimeout":300, "restartPolicyType":"ON_FAILURE", "restartPolicyMaxRetries":3 } }
```
Staging proof: inject a failing migration and confirm the old deployment keeps serving. `docs/RAILWAY_DEPLOY.md` is corrected to root `loodly-be`.

| Flag / env | Default | Purpose |
|---|---|---|
| `JOBS_ENABLED` | true | In-process jobs |
| `JOB_SECRET` | unset (route returns 404) | `/internal/jobs/:job` |
| `REWARD_EXPIRY_REFUND` | true | Q1 |
| `MIN_CLIENT_API_ENFORCED` | false | GraphQL `UPGRADE_REQUIRED` for legacy clients (Q10) |
| `GELATO_ADMIN_URL`, `GELATO_SPOT_URL` | existing | Invite links |
| Admin web: `VITE_APP_VERSION`, `VITE_SPOT_APP_URL` | | Headers, "Open Loodly Spot" |
| Spot: `EXPO_PUBLIC_ADMIN_WEB_URL_PROD/DEV`, store URLs | | Brand admin link, upgrade overlay |
| Landing: `NEXT_PUBLIC_APP_VERSION` | from `package.json` + git sha | Header |

### 7.4 Gates and pre-deploy checks

**A. Code gates**
1. `npm run typecheck`: no more than the 10 baseline errors (`docs/RAILWAY_DEPLOY.md:179-194`) and none in touched files.
2. Grep and ESLint gates (§2.11).
3. `graphql-inspector diff schema.pre-N.gql schema.gql` shows additions only, plus the `createSpot(id)` loosening. The differential legacy-contract check passes.
4. `prisma migrate diff` shows only the 3 transitional `DROP DEFAULT`s, and the folder order equals the applied order.
5. The seed runs.

**B. Read-only prod checks** (snapshot, then prod right before the deploy)

| Check | What |
|---|---|
| C0 | Server version; 24+ migrations applied, none failed |
| C1 | Duplicate employees (expect 0) |
| C2 | Orphan staff |
| C3 | Users with both profile kinds |
| C4 | Staff roles outside ADMIN accounts (expect 0) |
| C5 | SPOTS_ADMIN ids and the `SpotsAdminProfile` count, **exported** for rollback |
| C6 | Cities with countries (time-zone mapping review) |
| C7 | Spots per city, total and active |
| C8 | `pg_stat_user_tables.n_live_tup` for the locked tables |
| C9 | Loyalty sums plus CSV export (D5 evidence) |
| C10 | CLIENT users with a null code |
| C11 | Orders not in a final state |
| C12 | Referral preview |
| C13 | Preview of the cutover-affected users (re-login count) |
| C14 | Duplicate active FCM tokens |

**C. Snapshot dry run**
1. Restore a Railway backup into a scratch DB.
2. `prisma migrate deploy`, timing each file.
3. `verify-brand-migration.sql`.
4. Boot N, then run `scripts/verify/*` and the legacy documents.
5. Fail injection on a copy of M3 to prove atomicity and `migrate resolve --rolled-back`.
6. Run `rollback.sql`, then `rollforward.sql`.

### 7.5 Rollback and point of no return

- **R1. A migration fails at boot.** The healthcheck keeps the old deployment serving. Because the role rewrite is in M9, the old client can still read every row. Run `railway run npx prisma migrate resolve --rolled-back <name>`, fix and redeploy.
- **R2. Emergency code rollback**, only before the PONR:
  1. `rollback.sql`: `UPDATE "User" SET roles = array_remove(roles,'BRAND_ADMIN')`, then re-add `SPOTS_ADMIN` for the C5 ids.
  2. Redeploy the previous backend image, the previous admin web and the previous landing `out/`.
  3. Accepted degradations: ordering and order points work through the transitional defaults; staff and prize creation fail; referral payouts stay closed.
  4. To return to N: redeploy N, then run **`rollforward.sql`**, which repeats the M9 role rewrite from BrandStaff and strips SPOTS_ADMIN.
- **R3. Restore the snapshot.** Only inside the window, after counting the orders created since the deploy (they would be lost).
- **PONR** = the earlier of: the first non-default brand, or the first public store release of a 1.1.0 build. After it, fix forward only.

### 7.6 POS scanner pilot (D6)

Before marketing the barcode toggle:
- Pilot at 2 real shops with their actual scanners, on phone and tablet screens.
- Test scanning into the Loodly Spot web app on the POS PC and into a tablet in handheld mode.
- Write a one-page staff guide (Enter suffix, US/PL keyboard layout), linked from the Scan screen.
- Laser scanners often cannot read screens; imager scanners can.

---

## 8. Phased implementation plan

Effort: S ≤ 1 day, M 2–4 days, L 5+ days.

### Phase 0: Security and access-layer groundwork (release P0, today's schema)

| ID | Task | Files | Effort | Depends on |
|---|---|---|---|---|
| P0-14 | Commit the uncommitted invoice and hand-over work, plus the TERMINATED-collect backend change, as separate commits | mobile-spot/*, loodly-be `OrderResolver.ts` | S | – |
| P0-01 | `authChecker`: `AuthenticationError` (UNAUTHENTICATED) or ScopeError; `loginDisabled` in the middleware, WS context and `refreshToken` | `authMiddleware.ts`, `index.ts`, `AuthResolver.ts`, `src/auth/errors.ts` | S | P0-14 |
| P0-02 | `roles.ts` + `access.ts` v0 over the current profiles (SPOTS_ADMIN temporarily maps to PLATFORM scope); server message localization | `src/auth/*` | M | P0-01 |
| P0-03 | Replace the ~35 helpers and 44 bypasses with `access.ts`; close the fail-opens (`updateSpot` 466-472, order 736-766, Taste, Product); mandatory spot check in `awardPoints` / `validatePrizeQR`; `refundOrder` / `cancelPaymentIntent` scoping; `spotEmployees` at OPERATE with the reduced projection | all resolvers in §2.6 | L | P0-02 |
| P0-04 | REST `requireAuth` via `req.user`; assert before S3; reports access | `routes/upload.ts`, `routes/reports.ts` | M | P0-02 |
| P0-05 | Server-generated spot ids; `createSpot(id)` loosened | `SpotResolver.ts`, `BrandService` stub | S | P0-02 |
| P0-06 | Auth hardening: crypto generators, `auth_hardening` migration, rate limits, uniform reset errors, gates moved after the password | `CodeGenerator.ts`, `authRoutes.ts`, `middleware/rateLimit.ts`, `prisma/migrations` | M | – |
| P0-07 | `esc()` in every email template + gate | `AdminResolver.ts`, `EmailService`, `shared/utils/html.ts` | S | – |
| P0-08 | FCM token dedupe; token deactivation on disable | `NotificationResolver.ts`, `FCMService.ts` | S | – |
| P0-09 | Depth and alias validation rules | `src/graphql/validationRules.ts`, `index.ts` | S | P0-12 |
| P0-10 | Loyalty hook isolation (`safeLoyalty`, calls after announce) in `markOrderPaid`, `updateOrderStatus`, `collectPickupOrder`, `terminateOrder` | `OrderPaymentService.ts`, `OrderResolver.ts` | S | – |
| P0-11 | `railway.json` healthcheck; fix the deploy docs; staging fail-injection proof | `railway.json`, `docs/RAILWAY_DEPLOY.md` | S | – |
| P0-12 | Differential legacy-contract harness; commit `schema.pre-N.gql`; extract documents from the bundles | `scripts/verify/legacy-contract.ts` | M | – |
| P0-13 | Isolation-matrix skeleton, grep and ESLint gates | `scripts/verify/isolation-matrix.ts`, `.eslintrc` | M | P0-02 |
| L-01 | Landing L1a (§6) | landing-page-new | M | – |

**P0 verification**
- Legacy contract green.
- Isolation matrix green on today's roles; no logout substrings in errors.
- A revoked token is rejected on `/upload` and `/reports`.
- Reset-code lockout works.
- An email with `<b>` in a spot name renders escaped.
- Duplicate tokens are deactivated.
- A forced loyalty error does not fail the Stripe webhook or the collect.
- A failing migration on staging leaves the old instance serving.
- Spot 1.0.1 and client 1.0.3 smoke tests pass.

### Phase 1: Backend brands core (release N)

| ID | Task | Files | Effort | Depends on |
|---|---|---|---|---|
| B-01 | `schema.prisma` + migrations M1–M9 (generated + hand SQL, locks, the affected-users table) | `prisma/schema.prisma`, `prisma/migrations/*` | L | P0 |
| B-02 | `verify-brand-migration.sql`, `rollback.sql`, `rollforward.sql`, dry-run script | `scripts/*` | M | B-01 |
| B-03 | Seed rewrite (personas, brands, draft spot, clamped window) | `prisma/seed.ts`, `seed-orders.ts` | M | B-04, B-07 |
| B-04 | `access.ts` v1 on BrandStaff (scope, `requireActiveSpot` / `Brand`, `historyCutoff`, explicit-spot rule, restricted session) + `StaffService` (invites, re-attach rules, hygiene, tokenVersion, `RealtimeRegistry` hooks) | `src/auth/access.ts`, `src/services/StaffService.ts` | L | B-01 |
| B-05 | `BrandService`: CRUD, drafts, `withSpotSlot` no-op, total cap, `moveSpotToBrand` guards, URL ownership check | `src/services/brand/BrandService.ts`, `S3Service.ts` | M | B-04 |
| B-06 | Relation-shape fixes (§2.2 list) | resolvers, `authRoutes.ts` | M | B-01 |
| B-07 | `LoyaltyLedger` (ON CONFLICT insert, payload compare) + `LoyaltyService` (order points and hooks, apology, staff awards with caps and self-award guard, legacy award, referral, claim with `claimKey`, redeem, hand-over, overview, legacy projections, `withLoyaltyTx` retries) | `src/services/loyalty/*`, `OrderPointsService.ts` | L | B-01 |
| B-08 | `PointsRuleEngine`, timezone utilities, brand task CRUD and validation | `PointsRuleEngine.ts`, `time/timezone.ts`, `BrandTaskResolver.ts` | M | B-07 |
| B-09 | `LoyaltyCode.normalizeScan`, `resolveCustomer`, `ensureLoyaltyCode` at the signup sites | `LoyaltyCode.ts`, `authRoutes.ts`, `AuthResolver.ts` | S | B-01 |
| B-10 | Jobs: scheduler, JobLease, birthday, `reward_expiry`, `order_points_sweeper`, internal route, `run-job` script | `src/jobs/*`, `routes/internal.ts`, `scripts/run-job.ts` | M | B-07 |
| B-11 | GraphQL: Brand, Staff, Loyalty and BrandTask resolvers; type extensions (BrandSummary, wallet, StaffSpot counters, UserType fields, payouts); DataLoaders; error codes; `pickupOrdersElsewhere`; `handOverReward` | `src/resolvers/*`, `src/types/*`, `src/graphql/loaders.ts` | L | B-04, B-05, B-07, B-08 |
| B-12 | REST: clientInfo, login (USE_SPOT_APP, 426, spots including brand), change-password, signups with language, brand upload route, brand reports, invite links | `middleware/clientInfo.ts`, `authRoutes.ts`, `upload.ts`, `reports.ts`, `AdminResolver.ts` | M | B-04 |
| B-13 | Notifications and realtime: `staffRecipients` with fallback, payloads, PubSub, subscription filters, WS revalidation, `RealtimeRegistry`, new NotificationTypes, server plural templates, `UserChangeInput.language` | `services/notify/*`, `PubSubService.ts`, `SubscriptionResolver.ts`, `FCMService.ts`, `NotifyService.ts`, `realtime/*` | M | B-04, B-07 |
| B-14 | Verification suite (§2.11, items 2–9) | `scripts/verify/*` | L | B-11, B-12, B-13 |
| B-15 | Staging deploy, snapshot dry run, runbook rehearsal (R1, R2, roll-forward) | – | M | B-02, B-14 |

**Phase 1 verification**
- Every gate in §7.4 passes; every `verify-brand-migration.sql` query returns 0 rows except the report-only ones.
- `ledger-concurrency` passes, including the `requestId` replay cases.
- The `flows` suite passes on staging.
- The legacy contract passes, with `CollectPickupOrder` returning a number.
- The isolation matrix passes against brand-B ids, including a moved spot.
- Subscription revocation within 60 s, immediate on disable.
- Courier delivery credits points and survives a forced loyalty error.
- Login without the header gets 426 for a BRAND_ADMIN; an admin-web SPOT_ADMIN login gets 403 `USE_SPOT_APP`.
- Seed personas reproduce every client mode.
- Dry-run timings recorded; the lock waits stay under 10 s.

### Phase 2: Admin web (deploys right after N)

| ID | Task | Files | Effort | Depends on |
|---|---|---|---|---|
| A-01 | Plumbing: `clientInfo`, `authApi`, `scope`, `AuthContext`, ErrorLink (UNAUTHENTICATED), `errors`, `upload`, `config`, `RequireSession` | `src/lib/*`, `src/auth/*` | M | B-11, B-12 |
| A-02 | Routes, `BrandScope`, `BrandScopeLayout`, `AppLayout` variants | `src/App.tsx`, `src/routes.tsx`, `src/brand/*`, `components/AppLayout.tsx` | M | A-01 |
| A-03 | Shared UI components and the CreateCity / Address extraction | `src/components/**` | M | – |
| A-04 | Brands, CreateBrand, BrandProfile pages | `src/pages/*`, `components/brand/*` | L | A-02, A-03 |
| A-05 | Spots, CreateSpot (draft), EditSpot, ActivationChecklist | `src/pages/*` | M | A-02 |
| A-06 | Rewards page | `PrizesPage.tsx` | M | A-02 |
| A-07 | Promotions page + bonus settings | `components/promotions/*`, `lib/schedule.ts` | L | A-02 |
| A-08 | Staff page | `components/staff/*`, `StaffPage.tsx` | L | A-02 |
| A-09 | Orders, Payouts, Accounts, News, Quests, Login, UseSpotApp, ChangePassword pages | `src/pages/*` | M | A-01 |
| A-10 | GraphQL documents, cache policies, i18n with typed parity, `check:graphql` | `src/graphql/*`, `lib/cachePolicies.ts`, `translations/*`, `scripts/check-graphql.ts` | M | B-11 |

**Phase 2 verification:** `npm run build`, `lint` and `check:graphql`; the QA list in §3.5 on the staging seed; a stale old-SPA tab gets 426, and a reload fixes it.

### Phase 3: Landing

| ID | Task | Effort | Depends on |
|---|---|---|---|
| L-01 | L1a (Phase 0 table) | M | – |
| L-02 | L1b: additive documents, brand labels, `requestId`, inactive brand, copy | M | B-11 + cutover |
| L-03 | L2: `BrandProvider`, picker / sheet, overview, discovery, city chooser, promotions, per-brand quests, deep links, `x-loodly-api: 2` | L | L-02, C-02 (shared design) |

**Phase 3 verification:** §6 QA; the L1a bundle works against N; rollback re-upload drill.

### Phase 4: mobile-spot 1.1.0

| ID | Task | Effort | Depends on |
|---|---|---|---|
| S-01 | Headers, error codes, `SessionProvider` (C3 fix), logout hygiene, stable install id | M | B-11 |
| S-02 | `spotStore`, `SpotContextProvider`, consumer migration, `withSpotScope`, gates on both tab layouts, `choose-spot`, cold-start day rule | L | S-01 |
| S-03 | Switcher UI, `OtherSpotsStrip`, sidebar, More screen | M | S-02 |
| S-04 | `RealtimeProvider`, `OrderAlertProvider` rework, push registration, `openPush` without auto-switch, bell filter, other-spot banner | M | S-02 |
| S-05 | Capability gating, `AccessGuard`, spot-details lock, draft-spot behavior | M | S-02 |
| S-06 | Scanner (`code128`, wedge, handheld mode), `staffScan`, customer screen with hand-over, awards, `PrizeRedeem` preview, `pickupOrdersElsewhere` | L | S-02 |
| S-07 | Staff screen rewrite | M | S-05 |
| S-08 | i18n completeness, grep gates, device QA matrix | M | S-03 to S-07 |

**Phase 4 verification:** the static gates in §4.10 and device matrix items 1–24 pass.

### Phase 5: mobile 1.1.0

| ID | Task | Effort | Depends on |
|---|---|---|---|
| C-01 | Plumbing: headers, `extensions.code`, plural polyfill and `ua → uk`, city fix, language sync | M | B-11 |
| C-02 | Loyalty documents, `BrandProvider`, `loyaltyMode`, points strip, picker sheet | L | C-01 |
| C-03 | My card (code first), Code 128 encoder and component, fullscreen, brightness, keep-awake, offline / welcome card | M | C-02 |
| C-04 | Rewards tab, prize detail with confirm, My reward (PR barcode), discovery, brand page | L | C-02 |
| C-05 | Promotions, Tasks, notifications, history from `source`, settings pill, spot detail, order tracking, paused state | M | C-02 |
| C-06 | `verify-code128.js`, `verify-i18n.js`, QA matrix, accessibility pass | M | C-03 to C-05 |

**Phase 5 verification:** the §5.10 matrix; grep gates (no arg-less `myPointBalance` or `Prizes`, no `usePointBalance`, `LOYALTY_USER` only in the fallback, no small text classes).

### Phase 6: Contract and enforcement

| ID | Task | Effort | Depends on |
|---|---|---|---|
| K-01 | N+1 contract migration and schema cleanup (remove `isFirstLogin`, `SpotsAdminProfile`, `User.spotsAdminProfile` from the schema and code) | S | ≥ 1 week after N, after both 1.1.0 releases |
| K-02 | N+2: drop the `isFirstLogin` column and the `SpotsAdminProfile` table | S | K-01 stable |
| K-03 | Turn on `MIN_CLIENT_API_ENFORCED` for client 1.0.3 documents (Q10) | S | 1.1.0 adoption target |

**Phase 6 verification:** `migrate diff` is clean; `verify-brand-migration.sql` passes; no P2022 errors during the overlap; the zero-wallet cleanup count matches the preview.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Silent runtime breakage (`tsc --noCheck`, `prisma: any` at `PointsResolver.ts:473, 528` and `AdminResolver.ts:1003`) | Relation renames, typecheck gate, grep and ESLint gates, executed legacy contract, delete the `any` sites |
| Prisma rejects an overlapping composite relation | Scalar-only writes, `prisma validate` gate, fallback to service-level enforcement |
| Migration crash loop | `railway.json` healthcheck (staging-proven), atomic files, locks with `lock_timeout`, dry run, R1 |
| Old instance writing during the overlap | Transitional DB defaults; freeze; table locks; role rewrite last (M9); referral `pointsAwarded` guard; zero-wallet cleanup in N+1 |
| Rollback asymmetry (`BRAND_ADMIN` unreadable by the old client) | `rollback.sql` / `rollforward.sql`, rehearsed; PONR defined to include store releases |
| Ledger replay or abuse | `claimKey` + advisory lock, payload-compared keys, R-IDEM rule, daily caps, self-award guard, legacy quantity 1–99 |
| Cross-brand data exposure (moves, subscriptions, pushes, scans) | `historyCutoff` / brand snapshot filters; refuse moves with open orders; WS revalidation + RealtimeRegistry; FCM dedupe; `staffScan` reward null for other brands; reduced staff projection |
| Paying for N spots, using more | Loyalty and customer-facing writes require an active spot; drafts are capped at `maxSpots + 5` total |
| Account takeover through reset or invite | Crypto codes, persistent lockout, rate limits, uniform errors, gates after the password, consent-only re-attach |
| Phishing through tenant strings in platform emails | `esc()` + gate; platform-owned image URLs; invite rate limit |
| Visible behavior changes (courier deliveries earn; referral at first completed order; yearly birthday; SPOTS_ADMIN loses global reach; employees lose news and custom points) | Release notes to staff; PLATFORM news; 1.1.0 copy |
| Client 1.0.3 shows untrue promises and a single brand | Cutover news, an FCM update broadcast once 1.1.0 ships, enforcement date (Q10), brand-named server pushes |
| Missed orders at multi-spot brands | Mandatory per-spot counters, `OtherSpotsStrip`, fallback push to managers, "All my spots" bell filter |
| Wrong-spot actions by staff | Forced choice after login and daily; no auto-switch on push; pill on every tab; remount on switch |
| Legacy POS scanners cannot read screens | Pilot gate, staff guide, QR stays the default |
| `Europe/Kyiv` unknown to the Node ICU | Alias fallback, boot log warning |
| In-memory PubSub, rate limiter and registry assume a single instance | Documented constraint; Redis required before scaling out |
| One brand per staff email | Documented; a person working for two brands needs two emails |
| Static landing export shrinks when a brand is deactivated | `__fallback` keeps old links working; rebuild after deactivation |

---

## 10. Open questions for the product owner

| # | Question | Recommended default (implemented unless changed) |
|---|---|---|
| Q1 | Refund expired, unredeemed rewards? | Yes: refund the points plus send a reminder push 24 h before expiry (`REWARD_EXPIRY_REFUND=true`) |
| Q2 | Claw back points when an order is refunded or cancelled? | No; `ORDER_REVERSAL` stays reserved |
| Q3 | Should terminated orders earn order points? | Only when paid and not refunded. Unpaid cash orders get apology points only (today they earn regardless) |
| Q4 | Can employees grant apology points on terminate? | Yes (OPERATE), counted against `staffDailyAwardCap` when a brand sets one |
| Q5 | 30-day guard after a birth date is first set | On |
| Q6 | Rewards already claimed at a brand that gets deactivated | Redeemable for 30 days after deactivation; the brand's points are frozen and shown as "paused" |
| Q7 | Should a referred friend's first counter purchase (staff award) count as their "first order" under D2? | No, app orders only (literal D2) |
| Q8 | Let staff exchange a customer's points for a reward at the counter, with no in-app claim? | Not in v1; staff can only hand over rewards already claimed |
| Q9 | Remember the code format (QR or barcode) per brand? | No, per device |
| Q10 | When should installed client 1.0.3 be forced to update? | Enable `MIN_CLIENT_API_ENFORCED` 6 weeks after 1.1.0 ships, or at ≥ 80 % adoption |
| Q11 | Default brand "Loodly" owning the existing spots | Keep until those spots are reassigned to real brands; reassign before landing L2 |
| Q12 | Default `staffDailyAwardCap` for new brands | 0 (off); brand admins opt in |
| Q13 | Rename the EN "Prizes" tab and titles to "Rewards"? | Yes (copy only) |

---

## Appendix A. Rejected and partially rejected review findings

| Finding | Decision | Reason |
|---|---|---|
| Security: implement `moveSpotToBrand` as clone-and-deactivate (preferred fix) | **Rejected as the preferred approach.** The in-place move is kept with the finding's fallback guards: refuse when orders are open, check the order's brand snapshot in `assertOrderAccess` / `canReadOrder`, brand filters on history, and the new `Spot.brandAssignedAt` cutoff. | The main use is reassigning D5 default-brand spots to real brands. Changing spot ids would break static landing URLs and the history of staff, menus, templates and payouts. The guards close the leak. |
| Security: exclude inactive spots from SPOT_ADMIN / EMPLOYEE OPERATE scope | **Partially rejected.** Inactive spots stay in scope. `requireActiveSpot` blocks every loyalty and customer-facing write. | Staff must be able to finish in-flight orders after a deactivation, and spot admins must prepare draft spots (UX finding on onboarding). The quota bypass is closed by the write checks. |
| Security: move apology points to MANAGE_SPOT | **Rejected.** OPERATE is kept (Q4), with an optional daily cap. | 1.0.1 employees terminate orders with apology points today; the product owner decides (Q4). |
| Security: 8-digit codes for ADMIN resets | **Rejected.** 6 digits are kept, from `crypto.randomInt`. | A persistent per-account lockout (10 per hour) across reissued codes makes 10⁶ sufficient, and the shipped apps and emails say "6-digit code". |
| Security: 10-character reward codes | **Rejected.** | With a crypto RNG, 32⁸ ≈ 1.1×10¹² codes, single-use and brand-scoped redemption, guessing is impractical. Shorter codes stay typeable by older staff. |
| Security: redemption returns the customer's name for visual confirmation | **Deferred** (optional in the finding). | Hand-over from the customer card (E10) already shows the customer on screen. |
| Security: query cost or complexity library | **Partially rejected.** Depth (10) and alias (40) limits plus DataLoader and `BrandSummary` (which removes the spot↔brand cycle) are implemented. No cost library. | Covers the DoS vector without a new dependency; corpus-checked against installed documents. |
| UX: count as engaged any wallet with activity in the last 90 days (picker visibility) | **Partially rejected.** The picker and `engaged` stay "points > 0 or a reward ready to pick up". The 90-day activity rule is used **only** to choose `defaultBrandId` when nothing is engaged. | The product owner's wording is "if the user has points at only one brand, no dropdown". The default-brand rule still keeps the brand the user just spent at on screen. |
| UX: app-icon "Show my card" shortcut | **Deferred.** | Needs native shortcut configuration. Code-first My card, the default tab and the welcome-screen card cover the need in v1. |
| UX: auto-switch the active spot from a push (in the mobile-spot draft) | **Replaced** by the review fix (no auto-switch; banner and confirm). | Listed here because it reverses a draft spec decision. |
| Mobile-spot draft G5 (per-spot pending counts) marked optional | **Overruled; now mandatory** (UX finding). | Without it, multi-spot staff have no signal from their other spots. |
| Backbone §3.6: `adminResetStaffPassword` sets `mustChangePassword` | **Corrected** (admin-web G11). The code flow is kept and the flag is not set. | The user picks their own password through the code. |
| Backbone judging note: landing `QuestsTab` consumes `quests` | **Corrected** (landing G7). | The landing quest copy is hard-coded, which is why L1a must ship by N. The BrandTask decision stands, because admin `QuestsPage` does use `quests`. |
| Landing G4: public anonymous `brands` list | **Deferred to L3.** | Not needed until static brand pages exist. |
| Landing G10: checkout point estimate | **Deferred to L3.** | Not required by the product owner. |

The earlier backbone rejections stand: Design A's challenge C1, the synthetic zero `PointBalance`, Quest used as the brand-task store, "level = max over provided `updateSpot` args", the `AT TIME ZONE` birthday SQL, `staffKind` inside composite FKs, the `$extends` tenant guard, and the login 403 for inactive brands.