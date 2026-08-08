# Deploying the backend to Railway

Step-by-step for `backend-new` (Express + Apollo + Prisma/Postgres + WebSockets).

The repo is a monorepo, so the single most important setting is the **root
directory** — Railway must build from `backend-new/`, not the repo root.

---

## 1. Create the project and the database

1. <https://railway.app> → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. In the project, **+ New** → **Database** → **Add PostgreSQL**.
   Railway provisions it and exposes `DATABASE_URL` as a shared variable.

Add Postgres *before* the first successful deploy, so `DATABASE_URL` exists when
the app boots.

## 2. Point the service at `backend-new/`

Service → **Settings**:

| Setting | Value |
|---|---|
| Root Directory | `backend-new` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && npm run start` |

Notes:

- `prisma generate` must run **during build** — the client is generated code and
  is not in git.
- `prisma migrate deploy` (not `migrate dev`) applies the 21 existing migrations
  without prompting and never resets data.
- Do NOT set `PORT` yourself. Railway injects it; `src/index.ts:49` already reads
  `process.env.PORT`.
- `npm ci` requires `package-lock.json` to be committed. If it is not, use
  `npm install`.
- `npm run build` is `tsc --noCheck` — it emits JS without failing on the
  remaining pre-existing type errors. Run `npm run typecheck` locally to see
  them; see "Known type errors" below.

## 3. Environment variables

Service → **Variables**. `DATABASE_URL` is provided by the Postgres plugin —
reference it rather than pasting a literal:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Required for the app to function:

```
NODE_ENV=production

# Auth — generate fresh values, do NOT reuse the dev ones
JWT_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google sign-in (same Web client as the apps + landing page)
GOOGLE_CLIENT_ID=268509902642-tiajg536hrhbl6rk2i8e7c1u6r5fq6jd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<from Google Cloud console>

# Browser origins allowed to call the API (comma-separated).
# Appended to the localhost defaults in src/index.ts:76.
CORS_ORIGINS=https://loodly.pl,https://www.loodly.pl,https://admin.loodly.pl
```

Feature-dependent — set the ones you use:

```
# Push notifications. Prefer the inline form on Railway: there is no persistent
# filesystem to hold a .json key file, so FIREBASE_SERVICE_ACCOUNT_PATH will not
# work here. FCMService (src/services/FCMService.ts:355) accepts either.
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Photo uploads (S3-compatible)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_KEY=...
AWS_REGION=...
AWS_BUCKET_NAME=...
AWS_CLOUDFRONT_URL=...        # optional CDN in front of the bucket

# Email + SMS
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@loodly.pl
SENDGRID_FROM_NAME=Loodly
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+48...

# Deep links / email links
CLIENT_WEB_URL=https://loodly.pl
ADMIN_WEB_URL=https://admin.loodly.pl
CLIENT_MOBILE_URL=gelato://

# Optional
REDIS_URL=...                 # add Railway Redis and use ${{Redis.REDIS_URL}}
SENTRY_DSN=...
GOOGLE_MAPS_API_KEY=...
```

Skip `APPLE_*` — those four vars in `.env.example` are unused scaffolding
(nothing in `src/` reads them). Also skip `DATABASE_URL_SHADOW`; it is only for
`migrate dev` locally.

## 4. Custom domain

Service → **Settings → Networking → Custom Domain** → `api.loodly.pl`.

Railway shows a CNAME target; add it at your DNS provider:

```
api   CNAME   <something>.up.railway.app
```

TLS is issued automatically once DNS resolves. Verify:

```bash
curl https://api.loodly.pl/graphql -H 'content-type: application/json' \
  -d '{"query":"{ __typename }"}'
```

## 5. Point the clients at it

Once the domain answers:

- `landing-page-new/.env` → API base URL
- `admin-global-web-new` → API base URL
- `mobile*/eas.json` → `EXPO_PUBLIC_BACKEND_*_URL_PROD` (currently still
  `https://api.bonapka.pl`)
- Google Cloud console → add `https://loodly.pl` to the Web client's
  **Authorized JavaScript origins**

## 6. Seeding (optional, first deploy only)

`npm run prisma:seed` needs `ts-node`, which is a devDependency, so run it as a
one-off from your machine against the Railway database rather than in the start
command:

```bash
cd backend-new
DATABASE_URL='<Railway public DATABASE_URL>' npx ts-node prisma/seed.ts
```

Never leave a seed in the start command — it would re-run on every restart.

---

## Gotchas

**WebSockets.** Subscriptions run on the same HTTP server (`/graphql`), so
Railway's proxy handles the upgrade with no extra config. Clients must use
`wss://api.loodly.pl/graphql`.

**Ephemeral filesystem.** Anything written to disk is lost on redeploy. Uploads
already go to S3 (`S3Service.ts`), so this only matters if you add local file
writes later — including a Firebase key file, hence the inline credentials above.

**Migrations run on every boot.** `migrate deploy` is idempotent, so restarts are
safe, but a migration that fails will crash-loop the service. Check deploy logs
after the first release.

**One dyno, one process.** In-memory GraphQL subscription state is per-instance,
so if you scale to multiple replicas, subscribers on different instances stop
seeing each other's events. Wire the Redis `pubSub` before scaling past one.

---

## Known type errors

`npm run build` uses `tsc --noCheck` because 10 pre-existing type errors would
otherwise fail the deploy. They were invisible locally because `npm run dev`
runs `ts-node-dev --transpileOnly`. `npm run typecheck` lists them.

Most are cosmetic (Express/Apollo typing, a Stripe apiVersion string), but one
is a real bug still outstanding:

- `SpotResolver.ts:556` and `:580` write `data: { admins: { connect … } }`, but
  `Spot` has no `admins` relation — spot admins are modelled through
  `SpotAdminProfile` (`spotAdmins`). Those two mutations throw at runtime.

Fixing that means restructuring the resolver to create/connect a
`SpotAdminProfile`, so it was left for a separate change rather than bundled
into the deploy prep.
