/**
 * Live smoke test of the console against a running, seeded LOCAL backend
 * (`npm run smoke`). Signs in over REST the way the console does (the app's
 * own `adminLogin`, `x-loodly-client: admin-web@…`), then runs the app's own
 * GraphQL documents (src/graphql/*.ts, loaded through Vite like
 * check:graphql, with the __typename fields Apollo adds) for the main flows
 * and asserts the results.
 *
 * Needs the loodly-be seed (`npx prisma migrate reset --force`): its super
 * admin, the Gelato Roma / Złoty Kłos brands and their staff. It writes data
 * (a brand, spots, a city, rewards, promotions, staff; names carry a run id)
 * and puts back what it changed on the seeded brands where it can (plan
 * size, bonus settings, cities). Only local hosts are accepted.
 *
 * Usage: SMOKE_API_URL=http://localhost:4201/graphql npm run smoke
 * Passwords: SMOKE_SUPERADMIN_PASSWORD, SMOKE_STAFF_PASSWORD (default: the seed's).
 */
import { randomBytes } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { print, type DocumentNode } from 'graphql';
import { addTypenameToDocument } from '@apollo/client/utilities';
import { createServer } from 'vite';

const API_URL = process.env.SMOKE_API_URL ?? 'http://localhost:4201/graphql';
const API_ORIGIN = API_URL.replace(/\/graphql$/, '');
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(API_URL).hostname)) {
  console.error(`Refusing to run against ${API_URL}: the smoke test writes data, local backends only.`);
  process.exit(2);
}
// The app's config.ts reads VITE_API_URL (Vite exposes VITE_* from process.env).
process.env.VITE_API_URL = API_URL;

const SEED = {
  superAdmin: 'superadmin@gelato.com',
  romaAdmin: 'admin.roma@loodly.dev',
  romaSpotAdmin: 'spotadmin.roma@loodly.dev',
  romaEmployee: 'employee.roma@loodly.dev',
  klosSpotAdmin: 'spotadmin.klos@loodly.dev',
  client: 'client@test.com',
  roma: 'Gelato Roma',
  klos: 'Złoty Kłos Bakery',
};
const SUPER_PASSWORD = process.env.SMOKE_SUPERADMIN_PASSWORD ?? 'Admin1234';
const STAFF_PASSWORD = process.env.SMOKE_STAFF_PASSWORD ?? 'Staff1234';

const RUN = Date.now().toString(36);

// ---------------------------------------------------------------------------
// The app's modules (documents, login, client headers), loaded through Vite
// ---------------------------------------------------------------------------

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vite = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});

type Module = Record<string, unknown>;
const load = (path: string) => vite.ssrLoadModule(path) as Promise<Module>;

const docs: Record<string, DocumentNode> = {};
// Every module in src/graphql (as check:graphql does), so new documents are reachable.
for (const file of readdirSync(resolve(root, 'src/graphql')).filter((f) => f.endsWith('.ts')).sort()) {
  for (const [name, value] of Object.entries(await load(`/src/graphql/${file}`))) {
    if (value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'Document') {
      docs[name] = value as DocumentNode;
    }
  }
}
const { CLIENT_HEADERS } = (await load('/src/lib/clientInfo.ts')) as { CLIENT_HEADERS: Record<string, string> };
type AppLoginResult =
  | { ok: true; token: string; user: { staffKind: string; brand: { id: string; name: string } | null; mustChangePassword: boolean } }
  | { ok: false; code: string; status: number; name?: string };
const { adminLogin } = (await load('/src/lib/authApi.ts')) as {
  adminLogin: (email: string, password: string) => Promise<AppLoginResult>;
};

// ---------------------------------------------------------------------------
// Tiny test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    const extra = detail === undefined ? '' : ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    failures.push(`${label}${extra}`);
    console.log(`  ✗ ${label}${extra}`);
  }
}

async function section(title: string, body: () => Promise<void>) {
  console.log(`\n${title}`);
  try {
    await body();
  } catch (err) {
    check(`${title}: finished without an exception`, false, err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// GraphQL / REST helpers
// ---------------------------------------------------------------------------

type GqlError = { message: string; extensions?: Record<string, unknown> };
type GqlResult<T> = { status: number; data: T | null; errors: GqlError[] };

const printed = new Map<DocumentNode, string>();
function queryText(doc: DocumentNode): string {
  let text = printed.get(doc);
  if (!text) {
    text = print(addTypenameToDocument(doc));
    printed.set(doc, text);
  }
  return text;
}

function doc(name: string): DocumentNode {
  const d = docs[name];
  if (!d) throw new Error(`No document ${name} in src/graphql`);
  return d;
}

/** Runs one of the app's documents (by export name) with the console's headers. */
async function gql<T = Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  token: string,
  name: string,
  variables: Record<string, unknown> = {},
): Promise<GqlResult<T>> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CLIENT_HEADERS, authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: queryText(doc(name)), variables }),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: T | null; errors?: GqlError[] };
  return { status: res.status, data: body.data ?? null, errors: body.errors ?? [] };
}

/** The data of a call that must succeed (throws with the server's message otherwise). */
async function ok<T = Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  token: string,
  name: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await gql<T>(token, name, variables);
  if (res.errors.length > 0 || !res.data) {
    const e = res.errors[0];
    throw new Error(`${name}: ${e ? `${String(e.extensions?.code)} ${e.message}` : `HTTP ${res.status}, no data`}`);
  }
  return res.data;
}

const codeOf = (res: GqlResult<unknown>) => (res.errors[0]?.extensions?.code as string | undefined) ?? null;

/** Asserts that a call fails with one of the codes and leaks no data. */
async function expectError(
  label: string,
  token: string,
  name: string,
  variables: Record<string, unknown>,
  codes: string[],
): Promise<GqlResult<Record<string, unknown>>> {
  const res = await gql<Record<string, unknown>>(token, name, variables);
  const code = codeOf(res);
  const leaked = res.data && Object.values(res.data).some((v) => v !== null && v !== undefined);
  check(`${label} → ${codes.join(' | ')}`, !!code && codes.includes(code) && !leaked, {
    code,
    message: res.errors[0]?.message,
    data: leaked ? res.data : undefined,
  });
  return res;
}

async function restLogin(email: string, password: string) {
  const res = await fetch(`${API_ORIGIN}/authorization/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CLIENT_HEADERS },
    body: JSON.stringify({ email, password, loginContext: 'ADMIN_WEB' }),
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

/** A password that meets the console's rules (lib/constants passwordProblems). */
function testPassword(): string {
  return `Qa${randomBytes(6).toString('hex')}9X`;
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

type Spot = { id: string; name: string; isActive: boolean; brandId: string; cityId: string; city?: { name: string } | null };
type BrandView = {
  brand: { id: string; name: string; isActive: boolean; cityIds: string[]; referralBonusPoints: number; birthdayBonusPoints: number; description?: string | null };
  quota: { maxSpots: number; activeSpots: number; remaining: number; totalSpots: number };
  settings: Record<string, number | boolean>;
  staffCount: number;
  billingNote?: string | null;
};
type Member = { id: string; email: string; kind: string | null; spotIds: string[]; brandId: string | null; invitePending: boolean; loginDisabled: boolean };

let superToken = '';
let superId = '';
let superName = '';
let romaToken = '';
let romaId = '';
let klosId = '';
const cities: Record<string, string> = {};
let romaSpots: Spot[] = [];
let klosSpots: Spot[] = [];

const cleanup: Array<{ label: string; run: () => Promise<unknown> }> = [];

console.log(`Loodly console smoke test against ${API_URL} (run ${RUN})`);

try {
  await section('0. Backend', async () => {
    const res = await fetch(`${API_ORIGIN}/health`).catch(() => null);
    check('GET /health answers ok', !!res && res.ok);
    check('client header is admin-web@<version>', /^admin-web@\d+\.\d+\.\d+/.test(CLIENT_HEADERS['x-loodly-client'] ?? ''), CLIENT_HEADERS);
    check('API contract header is 2', CLIENT_HEADERS['x-loodly-api'] === '2');
  });

  await section('1. Sign-in gate (REST, app adminLogin)', async () => {
    const sa = await adminLogin(SEED.superAdmin, SUPER_PASSWORD);
    check('super admin signs in', sa.ok, sa);
    if (sa.ok) {
      superToken = sa.token;
      check('super admin is PLATFORM without a brand', sa.user.staffKind === 'PLATFORM' && sa.user.brand === null, sa.user);
    }

    const ba = await adminLogin(SEED.romaAdmin, STAFF_PASSWORD);
    check('brand admin signs in', ba.ok, ba);
    if (ba.ok) {
      romaToken = ba.token;
      romaId = ba.user.brand?.id ?? '';
      check(
        `brand admin is BRAND_ADMIN of ${SEED.roma}`,
        ba.user.staffKind === 'BRAND_ADMIN' && ba.user.brand?.name === SEED.roma && !ba.user.mustChangePassword,
        ba.user,
      );
    }

    for (const email of [SEED.romaSpotAdmin, SEED.romaEmployee]) {
      const raw = await restLogin(email, STAFF_PASSWORD);
      check(
        `${email}: server answers 403 USE_SPOT_APP with the name and no token`,
        raw.status === 403 && raw.body.code === 'USE_SPOT_APP' && typeof raw.body.name === 'string' && !raw.body.token,
        { status: raw.status, code: raw.body.code },
      );
    }
    const spotAdmin = await adminLogin(SEED.romaSpotAdmin, STAFF_PASSWORD);
    check('app adminLogin of a spot admin → USE_SPOT_APP', !spotAdmin.ok && spotAdmin.code === 'USE_SPOT_APP' && spotAdmin.status === 403, spotAdmin);

    const wrong = await adminLogin(SEED.superAdmin, `${SUPER_PASSWORD}-wrong`);
    check('wrong password → INVALID_CREDENTIALS', !wrong.ok && wrong.code === 'INVALID_CREDENTIALS', wrong);
    const client = await adminLogin(SEED.client, 'Client1234');
    check('a client account gets a known refusal (no session)', !client.ok && client.code !== 'UNKNOWN', client);

    const noToken = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...CLIENT_HEADERS, authorization: 'Bearer invalid.token.value' },
      body: JSON.stringify({ query: queryText(doc('MY_STAFF_CONTEXT')) }),
    });
    const body = (await noToken.json().catch(() => ({}))) as { errors?: GqlError[] };
    const code = body.errors?.[0]?.extensions?.code;
    check('invalid token → UNAUTHENTICATED (the console logs out)', noToken.status === 401 || code === 'UNAUTHENTICATED', {
      status: noToken.status,
      code,
    });
  });

  if (!superToken || !romaToken || !romaId) throw new Error('Sign-in failed: nothing else can run.');

  await section('2. Platform: context, brands, directories', async () => {
    const ctx = (await ok(superToken, 'MY_STAFF_CONTEXT')).myStaffContext;
    check('myStaffContext: PLATFORM, can manage brands', ctx.scope === 'PLATFORM' && ctx.canManageBrand === true, ctx);
    const me = (await ok(superToken, 'ME')).me;
    check('me: super admin identity', me.email === SEED.superAdmin && me.roles.includes('SUPER_ADMIN'), me);
    superId = me.id;
    superName = me.name ?? '';

    const list = (await ok(superToken, 'CITIES')).cities as { id: string; name: string; timezone: string }[];
    for (const c of list) cities[c.name] = c.id;
    check('cities: Warsaw, Krakow, Lviv, Gdansk', ['Warsaw', 'Krakow', 'Lviv', 'Gdansk'].every((n) => cities[n]), Object.keys(cities));

    const brands = (await ok(superToken, 'ADMIN_BRANDS')).adminBrands as BrandView[];
    const roma = brands.find((b) => b.brand.id === romaId);
    const klos = brands.find((b) => b.brand.name === SEED.klos);
    klosId = klos?.brand.id ?? '';
    check('adminBrands lists both seeded brands', !!roma && !!klos, brands.map((b) => b.brand.name));
    check('Gelato Roma: 3 active spots, 4 in total (draft Praga)', roma?.quota.activeSpots === 3 && roma?.quota.totalSpots === 4, roma?.quota);
    check('Złoty Kłos: plan of 2', klos?.quota.maxSpots === 2, klos?.quota);

    const all = (await ok(superToken, 'MY_ADMIN_SPOTS')).myAdminSpots as Spot[];
    romaSpots = all.filter((s) => s.brandId === romaId);
    klosSpots = all.filter((s) => s.brandId === klosId);
    check('myAdminSpots (PLATFORM): every spot of both brands, inactive included', romaSpots.length === 4 && klosSpots.length === 2 && all.some((s) => !s.isActive), {
      roma: romaSpots.length,
      klos: klosSpots.length,
    });

    const accounts = (await ok(superToken, 'ADMIN_ACCOUNTS')).adminAccounts as { email: string; kind: string | null; brandId: string | null }[];
    const romaAdmin = accounts.find((a) => a.email === SEED.romaAdmin);
    check('adminAccounts lists the brand admin with kind and brand', romaAdmin?.kind === 'BRAND_ADMIN' && romaAdmin?.brandId === romaId, romaAdmin);

    const payouts = (await ok(superToken, 'SPOT_PAYOUT_SUMMARIES', { brandId: null })).spotPayoutSummaries as { brandId: string }[];
    check('spotPayoutSummaries (all brands) answers', Array.isArray(payouts));
    const romaPayouts = (await ok(superToken, 'SPOT_PAYOUT_SUMMARIES', { brandId: romaId })).spotPayoutSummaries as { brandId: string }[];
    check('spotPayoutSummaries(brandId) only has that brand', romaPayouts.every((p) => p.brandId === romaId), romaPayouts);
    const center = romaSpots.find((s) => s.name.includes('Warsaw Center'));
    if (center) {
      const history = (await ok(superToken, 'SPOT_PAYOUT_HISTORY', { spotId: center.id })).spotPayoutHistory;
      check('spotPayoutHistory answers', Array.isArray(history));
      const orders = (await ok(superToken, 'SPOT_ORDERS', { spotId: center.id })).spotOrders;
      check('spotOrders (PLATFORM) answers', Array.isArray(orders));
    }
    const quests = (await ok(superToken, 'QUESTS')).quests;
    check('quests (frozen page) answers', Array.isArray(quests));
  });

  await section('3. Platform: create a brand and run its plan', async () => {
    const name = `QA Smoke ${RUN}`;
    const adminEmail = `qa.smoke.${RUN}@loodly.dev`;
    const created = (
      await ok(superToken, 'CREATE_BRAND', {
        input: {
          name,
          description: 'QA smoke brand',
          descriptionLocal: { pl: 'Marka testowa QA', en: 'QA smoke brand', ua: 'Тестова марка QA' },
          cityIds: [cities.Warsaw],
          maxSpots: 1,
          admin: { name: 'QA Smoke Admin', email: adminEmail, language: 'PL' },
          settings: { birthdayBonusEnabled: true, birthdayBonusPoints: 50, referralBonusPoints: 20 },
          billingNote: 'QA smoke',
        },
      })
    ).createBrand as { brand: BrandView; admin: Member };
    const brandId = created.brand.brand.id;
    cleanup.push({ label: 'delete the QA brand', run: () => ok(superToken, 'DELETE_BRAND', { brandId }) });
    check('createBrand: brand with plan 1 and the bonus settings', created.brand.quota.maxSpots === 1 && created.brand.settings.birthdayBonusPoints === 50 && created.brand.brand.referralBonusPoints === 20, created.brand);
    check('createBrand: first admin invited (BRAND_ADMIN, pending)', created.admin.kind === 'BRAND_ADMIN' && created.admin.invitePending && created.admin.brandId === brandId, created.admin);
    await expectError('createBrand with a taken name', superToken, 'CREATE_BRAND', {
      input: { name, cityIds: [cities.Warsaw], maxSpots: 1, admin: { name: 'X', email: `qa.dup.${RUN}@loodly.dev` } },
    }, ['BRAND_NAME_TAKEN']);

    const listed = ((await ok(superToken, 'ADMIN_BRANDS')).adminBrands as BrandView[]).some((b) => b.brand.id === brandId);
    check('adminBrands shows the new brand', listed);
    const view = (await ok(superToken, 'ADMIN_BRAND', { id: brandId })).adminBrand as BrandView;
    check('adminBrand: billing note and one staff member', view.billingNote === 'QA smoke' && view.staffCount === 1, view);

    const spotVars = (label: string) => ({
      brandId,
      name: `QA Smoke ${RUN} ${label}`,
      address: 'ul. Testowa 1',
      cityId: cities.Warsaw,
      latitude: 52.2297,
      longitude: 21.0122,
      phone: '+48000000000',
      description: null,
      deliveryEnabled: false,
      deliveryRadiusKm: 0,
      freeDeliveryThreshold: null,
      pickupEnabled: true,
      onlinePaymentEnabled: false,
    });
    await expectError('createSpot in a city outside the brand', superToken, 'CREATE_SPOT', { ...spotVars('Kraków'), cityId: cities.Krakow }, ['CITY_NOT_IN_BRAND']);
    const a = (await ok(superToken, 'CREATE_SPOT', spotVars('A'))).createSpot as Spot;
    cleanup.push({ label: 'delete QA spot A', run: () => ok(superToken, 'DELETE_SPOT', { id: a.id }) });
    check('createSpot (PLATFORM for a brand): a draft of that brand', !a.isActive && a.brandId === brandId, a);
    const activeA = (await ok(superToken, 'SET_SPOT_ACTIVE', { spotId: a.id, isActive: true })).setSpotActive as Spot;
    check('activate within the plan (1/1)', activeA.isActive);
    const b = (await ok(superToken, 'CREATE_SPOT', spotVars('B'))).createSpot as Spot;
    cleanup.push({ label: 'delete QA spot B', run: () => ok(superToken, 'DELETE_SPOT', { id: b.id }) });
    const limit = await expectError('activate beyond the plan', superToken, 'SET_SPOT_ACTIVE', { spotId: b.id, isActive: true }, ['SPOT_LIMIT_REACHED']);
    check('SPOT_LIMIT_REACHED carries maxSpots 1', limit.errors[0]?.extensions?.maxSpots === 1, limit.errors[0]?.extensions);
    const quota = ((await ok(superToken, 'ADMIN_BRAND', { id: brandId })).adminBrand as BrandView).quota;
    check('quota: 1 of 1 active, 2 in total', quota.activeSpots === 1 && quota.remaining === 0 && quota.totalSpots === 2, quota);

    const raised = (await ok(superToken, 'UPDATE_BRAND_PLATFORM', { brandId, input: { maxSpots: 2 } })).updateBrandPlatform as BrandView;
    check('updateBrandPlatform: plan raised to 2', raised.quota.maxSpots === 2 && raised.quota.remaining === 1, raised.quota);
    const activeB = (await ok(superToken, 'SET_SPOT_ACTIVE', { spotId: b.id, isActive: true })).setSpotActive as Spot;
    check('activate after the plan change', activeB.isActive);

    const off = (await ok(superToken, 'UPDATE_BRAND_PLATFORM', { brandId, input: { isActive: false } })).updateBrandPlatform as BrandView;
    check('deactivate the brand', off.brand.isActive === false);
    await expectError('createSpot for an inactive brand', superToken, 'CREATE_SPOT', spotVars('C'), ['BRAND_INACTIVE']);
    await expectError('createPrize for an inactive brand', superToken, 'CREATE_PRIZE', { brandId, title: 'QA', pointsCost: 10 }, ['BRAND_INACTIVE']);
    const on = (await ok(superToken, 'UPDATE_BRAND_PLATFORM', { brandId, input: { isActive: true } })).updateBrandPlatform as BrandView;
    check('reactivate the brand', on.brand.isActive === true);

    for (const s of [a, b]) await ok(superToken, 'SET_SPOT_ACTIVE', { spotId: s.id, isActive: false });
    await expectError('deleteBrand while it has spots', superToken, 'DELETE_BRAND', { brandId }, ['BAD_USER_INPUT', 'BRAND_HAS_SPOTS']);

    const city = (
      await ok(superToken, 'CREATE_CITY', {
        name: `QA City ${RUN}`,
        latitude: 50.06,
        longitude: 19.94,
        nameLocal: { pl: `Miasto QA ${RUN}`, en: `QA City ${RUN}`, ua: `Місто QA ${RUN}` },
        country: 'PL',
        timezone: 'Europe/Warsaw',
      })
    ).createCity as { id: string; timezone: string };
    check('createCity (CreateCityModal) stores the time zone', !!city.id && city.timezone === 'Europe/Warsaw', city);
  });

  await section('4. Brand admin: context, brand view, isolation', async () => {
    const ctx = (await ok(romaToken, 'MY_STAFF_CONTEXT')).myStaffContext;
    check('myStaffContext: BRAND_ADMIN of Gelato Roma', ctx.scope === 'BRAND_ADMIN' && ctx.canManageBrand && ctx.brand?.id === romaId && !ctx.mustChangePassword, ctx);
    const view = (await ok(romaToken, 'ADMIN_BRAND', { id: romaId })).adminBrand as BrandView;
    check('adminBrand (own): quota 3/3, 4 in total', view.quota.maxSpots === 3 && view.quota.activeSpots === 3 && view.quota.totalSpots === 4, view.quota);
    check('adminBrand (own): seeded bonuses (birthday 100, referral 50)', view.settings.birthdayBonusPoints === 100 && view.settings.referralBonusPoints === 50, view.settings);
    check('adminBrand (own): no billing note for brand staff', view.billingNote == null, view.billingNote);

    await expectError('adminBrand of another brand', romaToken, 'ADMIN_BRAND', { id: klosId }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    await expectError('adminBrands (PLATFORM only)', romaToken, 'ADMIN_BRANDS', {}, ['SCOPE_FORBIDDEN']);
    await expectError('brandSpots of another brand', romaToken, 'BRAND_SPOTS', { brandId: klosId }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    await expectError('updateBrandPlatform (PLATFORM only)', romaToken, 'UPDATE_BRAND_PLATFORM', { brandId: romaId, input: { maxSpots: 99 } }, ['SCOPE_FORBIDDEN']);
    await expectError('adminAccounts (PLATFORM only)', romaToken, 'ADMIN_ACCOUNTS', {}, ['SCOPE_FORBIDDEN']);
    await expectError('spotPayoutSummaries (PLATFORM only)', romaToken, 'SPOT_PAYOUT_SUMMARIES', { brandId: romaId }, ['SCOPE_FORBIDDEN']);
    if (klosSpots[0]) {
      await expectError('spotOrders of another brand’s spot', romaToken, 'SPOT_ORDERS', { spotId: klosSpots[0].id }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    }

    const spots = (await ok(romaToken, 'BRAND_SPOTS', { brandId: romaId })).brandSpots as Spot[];
    check('brandSpots (own): 4 spots incl. the Praga draft', spots.length === 4 && spots.some((s) => !s.isActive) && spots.every((s) => s.brandId === romaId), spots.map((s) => s.name));
    const mine = (await ok(romaToken, 'MY_ADMIN_SPOTS')).myAdminSpots as Spot[];
    check('myAdminSpots: only Gelato Roma spots', mine.length > 0 && mine.every((s) => s.brandId === romaId), mine.map((s) => s.name));
    const center = spots.find((s) => s.name.includes('Warsaw Center'));
    if (center) {
      const orders = (await ok(romaToken, 'SPOT_ORDERS', { spotId: center.id })).spotOrders;
      check('spotOrders (own spot) answers', Array.isArray(orders));
    }
  });

  await section('5. Brand admin: spots, activation and the plan', async () => {
    const start = ((await ok(superToken, 'ADMIN_BRAND', { id: romaId })).adminBrand as BrandView).quota;
    // Make the plan exactly full, so the next activation is refused.
    if (start.maxSpots !== start.activeSpots) {
      await ok(superToken, 'UPDATE_BRAND_PLATFORM', { brandId: romaId, input: { maxSpots: start.activeSpots } });
    }
    cleanup.push({
      label: 'restore the Gelato Roma plan',
      run: () => ok(superToken, 'UPDATE_BRAND_PLATFORM', { brandId: romaId, input: { maxSpots: start.maxSpots } }),
    });

    const draft = (
      await ok(romaToken, 'CREATE_SPOT', {
        brandId: romaId,
        name: `QA Roma ${RUN}`,
        address: 'ul. Próbna 2',
        cityId: cities.Warsaw,
        latitude: 52.24,
        longitude: 21.02,
        phone: '+48000000001',
        description: 'QA draft',
        deliveryEnabled: true,
        deliveryRadiusKm: 3,
        freeDeliveryThreshold: null,
        pickupEnabled: true,
        onlinePaymentEnabled: true,
      })
    ).createSpot as Spot & { phone: string };
    cleanup.push({ label: 'delete the QA Roma spot', run: () => ok(superToken, 'DELETE_SPOT', { id: draft.id }) });
    check('createSpot (brand admin): a draft of the brand', !draft.isActive && draft.brandId === romaId, draft);

    const detail = (await ok(romaToken, 'SPOT_DETAIL', { id: draft.id })).spot as Spot;
    check('spot(id) returns the draft', detail?.id === draft.id && detail.isActive === false);
    const updated = (await ok(romaToken, 'UPDATE_SPOT', { id: draft.id, phone: '+48000000002', description: 'QA draft (edited)' })).updateSpot as Spot & {
      phone: string;
      description: string;
    };
    check('updateSpot with changed fields only', updated.phone === '+48000000002' && updated.description === 'QA draft (edited)', updated);
    const menu = await ok(romaToken, 'SPOT_MENU_COUNT', { spotId: draft.id });
    check('activation checklist menu count answers (empty for a new spot)', Array.isArray(menu.spotTastes) && Array.isArray(menu.spotProducts));

    const refused = await expectError('activate with the plan full', romaToken, 'SET_SPOT_ACTIVE', { spotId: draft.id, isActive: true }, ['SPOT_LIMIT_REACHED']);
    check('SPOT_LIMIT_REACHED carries maxSpots', typeof refused.errors[0]?.extensions?.maxSpots === 'number', refused.errors[0]?.extensions);

    const plan = start.activeSpots + 1;
    await ok(superToken, 'UPDATE_BRAND_PLATFORM', { brandId: romaId, input: { maxSpots: plan } });
    const active = (await ok(romaToken, 'SET_SPOT_ACTIVE', { spotId: draft.id, isActive: true })).setSpotActive as Spot;
    check(`activate within the raised plan (${plan}/${plan})`, active.isActive);
    const full = ((await ok(romaToken, 'ADMIN_BRAND', { id: romaId })).adminBrand as BrandView).quota;
    check('quota after activation: full, 0 remaining', full.activeSpots === plan && full.remaining === 0, full);
    const praga = romaSpots.find((s) => !s.isActive && s.id !== draft.id);
    if (praga) {
      const beyond = await expectError('activate one more (Praga draft) beyond the plan', romaToken, 'SET_SPOT_ACTIVE', { spotId: praga.id, isActive: true }, ['SPOT_LIMIT_REACHED']);
      check(`SPOT_LIMIT_REACHED maxSpots = ${plan}`, beyond.errors[0]?.extensions?.maxSpots === plan, beyond.errors[0]?.extensions);
    }
    const off = (await ok(romaToken, 'SET_SPOT_ACTIVE', { spotId: draft.id, isActive: false })).setSpotActive as Spot;
    check('deactivate always works', off.isActive === false);
    await expectError('deleteSpot (PLATFORM only)', romaToken, 'DELETE_SPOT', { id: draft.id }, ['SCOPE_FORBIDDEN']);
    if (klosSpots[0]) {
      await expectError('updateSpot of another brand’s spot', romaToken, 'UPDATE_SPOT', { id: klosSpots[0].id, phone: '+48000000009' }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    }
  });

  await section('6. Brand admin: profile, cities, bonus settings', async () => {
    const before = (await ok(romaToken, 'ADMIN_BRAND', { id: romaId })).adminBrand as BrandView;
    const profile = (
      await ok(romaToken, 'UPDATE_BRAND_PROFILE', {
        brandId: romaId,
        input: { description: `QA ${RUN}`, descriptionLocal: { pl: `QA ${RUN} pl`, en: `QA ${RUN} en`, ua: `QA ${RUN} ua` } },
      })
    ).updateBrandProfile as BrandView;
    check('updateBrandProfile saves the description', profile.brand.description === `QA ${RUN}`, profile.brand.description);
    cleanup.push({
      label: 'restore the Gelato Roma description',
      run: () => ok(romaToken, 'UPDATE_BRAND_PROFILE', { brandId: romaId, input: { description: before.brand.description ?? null } }),
    });

    const sameCities = (await ok(romaToken, 'SET_BRAND_CITIES', { brandId: romaId, cityIds: before.brand.cityIds })).setBrandCities as BrandView;
    check('setBrandCities (unchanged list) answers', sameSet(sameCities.brand.cityIds, before.brand.cityIds), sameCities.brand.cityIds);
    if (before.brand.cityIds.includes(cities.Krakow)) {
      await expectError(
        'setBrandCities without a city that has a spot (Kraków)',
        romaToken,
        'SET_BRAND_CITIES',
        { brandId: romaId, cityIds: before.brand.cityIds.filter((id) => id !== cities.Krakow) },
        ['CITY_IN_USE'],
      );
    }

    const settings = (
      await ok(romaToken, 'UPDATE_BRAND_SETTINGS', { brandId: romaId, input: { referralBonusPoints: 60, birthdayBonusPoints: 120 } })
    ).updateBrandSettings as BrandView;
    check(
      'updateBrandSettings: referral 60, birthday 120 (settings and brand)',
      settings.settings.referralBonusPoints === 60 && settings.settings.birthdayBonusPoints === 120 && settings.brand.referralBonusPoints === 60,
      settings.settings,
    );
    cleanup.push({
      label: 'restore the Gelato Roma bonus settings',
      run: () =>
        ok(romaToken, 'UPDATE_BRAND_SETTINGS', {
          brandId: romaId,
          input: { referralBonusPoints: before.settings.referralBonusPoints, birthdayBonusPoints: before.settings.birthdayBonusPoints },
        }),
    });
    await expectError('updateBrandSettings with a negative value', romaToken, 'UPDATE_BRAND_SETTINGS', { brandId: romaId, input: { referralBonusPoints: -5 } }, ['BAD_USER_INPUT']);
    await expectError('updateBrandSettings of another brand', romaToken, 'UPDATE_BRAND_SETTINGS', { brandId: klosId, input: { referralBonusPoints: 5 } }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
  });

  await section('7. Brand admin: rewards', async () => {
    const list = (await ok(romaToken, 'ADMIN_PRIZES', { brandId: romaId, includeArchived: true })).brandPrizes as {
      id: string;
      title: string;
      claimed: number;
      quantity: number | null;
      archivedAt: string | null;
      brandId: string;
    }[];
    check('brandPrizes: the seeded rewards of the brand only', list.length >= 3 && list.every((p) => p.brandId === romaId), list.map((p) => p.title));

    const title = `QA reward ${RUN}`;
    const created = (
      await ok(romaToken, 'CREATE_PRIZE', {
        brandId: romaId,
        title,
        titleLocal: { pl: `Nagroda QA ${RUN}`, en: title, ua: `Нагорода QA ${RUN}` },
        description: 'QA',
        descriptionLocal: { pl: 'QA', en: 'QA', ua: 'QA' },
        pointsCost: 150,
        quantity: 10,
        isActive: true,
        validFrom: new Date(Date.now() - 3600_000).toISOString(),
        validUntil: new Date(Date.now() + 30 * 86400_000).toISOString(),
      })
    ).createPrize as { id: string; brandId: string; pointsCost: number; claimed: number; titleLocal: Record<string, string>; isActive: boolean };
    check('createPrize: active reward of the brand with translations', created.brandId === romaId && created.pointsCost === 150 && created.claimed === 0 && created.titleLocal?.pl === `Nagroda QA ${RUN}`, created);

    const edited = (await ok(romaToken, 'UPDATE_PRIZE', { id: created.id, pointsCost: 175, isActive: false })).updatePrize as {
      pointsCost: number;
      isActive: boolean;
      quantity: number | null;
      title: string;
    };
    check('updatePrize (changed fields only) keeps the rest', edited.pointsCost === 175 && !edited.isActive && edited.quantity === 10 && edited.title === title, edited);
    const unlimited = (await ok(romaToken, 'UPDATE_PRIZE', { id: created.id, quantity: null })).updatePrize as { quantity: number | null };
    check('updatePrize quantity null = unlimited', unlimited.quantity === null, unlimited);

    const deleted = (await ok(romaToken, 'DELETE_PRIZE', { id: created.id })).deletePrize;
    const after = (await ok(romaToken, 'ADMIN_PRIZES', { brandId: romaId, includeArchived: true })).brandPrizes as { id: string }[];
    check('deletePrize of a never-claimed reward removes it', deleted === true && !after.some((p) => p.id === created.id));

    const claimed = list.find((p) => p.claimed > 0 && !p.archivedAt);
    if (claimed) {
      await expectError(
        `updatePrize quantity below claimed (${claimed.claimed})`,
        romaToken,
        'UPDATE_PRIZE',
        { id: claimed.id, quantity: claimed.claimed - 1 },
        ['REWARD_QUANTITY_BELOW_CLAIMED'],
      );
      await ok(romaToken, 'DELETE_PRIZE', { id: claimed.id });
      const kept = ((await ok(romaToken, 'ADMIN_PRIZES', { brandId: romaId, includeArchived: true })).brandPrizes as typeof list).find(
        (p) => p.id === claimed.id,
      );
      check('deletePrize of a claimed reward archives it (still listed, archivedAt set)', !!kept?.archivedAt, kept);
    } else {
      console.log('  - no claimed reward left to archive (already archived by an earlier run)');
    }

    const klosPrizes = (await ok(superToken, 'ADMIN_PRIZES', { brandId: klosId, includeArchived: true })).brandPrizes as { id: string }[];
    check('brandPrizes (PLATFORM, support mode) of Złoty Kłos answers', klosPrizes.length >= 2);
    await expectError('brandPrizes of another brand', romaToken, 'ADMIN_PRIZES', { brandId: klosId, includeArchived: true }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    if (klosPrizes[0]) {
      await expectError('updatePrize of another brand’s reward', romaToken, 'UPDATE_PRIZE', { id: klosPrizes[0].id, pointsCost: 1 }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    }
  });

  await section('8. Brand admin: promotions', async () => {
    const tasks = (await ok(romaToken, 'BRAND_TASKS', { brandId: romaId, includeArchived: true })).brandTasks as {
      id: string;
      title: string;
      status: string;
      multiplierPercent: number;
    }[];
    const seeded = tasks.find((t) => t.title === 'Double points hour');
    check('brandTasks: the seeded ×2 promotion is ACTIVE', seeded?.status === 'ACTIVE' && seeded.multiplierPercent === 200, seeded);
    const live = (await ok(romaToken, 'BRAND_PROMOTIONS', { brandId: romaId })).brandPromotions as {
      taskId: string;
      isActiveNow: boolean;
      timezone: string;
    }[];
    const seededLive = live.find((l) => l.taskId === seeded?.id);
    check('brandPromotions: the seeded promotion runs now (Warsaw time)', !!seededLive?.isActiveNow && seededLive.timezone === 'Europe/Warsaw', live);

    // The console's example: ×2 on Thursdays 10:00–14:00 at every location.
    const input = {
      kind: 'POINTS_MULTIPLIER',
      title: `QA promo ${RUN}`,
      titleLocal: { pl: `Promocja QA ${RUN}`, en: `QA promo ${RUN}`, ua: `Акція QA ${RUN}` },
      description: null,
      descriptionLocal: null,
      multiplierPercent: 200,
      appliesToOrders: true,
      appliesToTemplateAwards: true,
      startsOn: null,
      endsOn: null,
      windows: [{ dayOfWeek: 4, startTime: '10:00', endTime: '14:00' }],
      spotIds: [],
    };
    const created = (await ok(romaToken, 'CREATE_BRAND_TASK', { brandId: romaId, input })).createBrandTask as {
      id: string;
      status: string;
      windows: unknown[];
      spotIds: string[];
      brandId: string;
    };
    check('createBrandTask: ACTIVE, one window, every location', created.status === 'ACTIVE' && created.windows.length === 1 && created.spotIds.length === 0 && created.brandId === romaId, created);
    const upcoming = ((await ok(romaToken, 'BRAND_PROMOTIONS', { brandId: romaId })).brandPromotions as { taskId: string; isActiveNow: boolean; nextStartsAt: string | null }[]).find(
      (l) => l.taskId === created.id,
    );
    check('brandPromotions lists the new promotion (running or upcoming)', !!upcoming && (upcoming.isActiveNow || !!upcoming.nextStartsAt), upcoming);

    const paused = (await ok(romaToken, 'SET_BRAND_TASK_STATUS', { id: created.id, status: 'PAUSED' })).setBrandTaskStatus as { status: string };
    check('pause → PAUSED', paused.status === 'PAUSED');
    const center = romaSpots.find((s) => s.isActive);
    const replaced = (
      await ok(romaToken, 'UPDATE_BRAND_TASK', {
        id: created.id,
        input: { ...input, multiplierPercent: 150, spotIds: center ? [center.id] : [] },
      })
    ).updateBrandTask as { multiplierPercent: number; spotIds: string[]; status: string };
    check('updateBrandTask (full replace): ×1.5 at one location, still paused', replaced.multiplierPercent === 150 && replaced.spotIds.length === (center ? 1 : 0) && replaced.status === 'PAUSED', replaced);
    const resumed = (await ok(romaToken, 'SET_BRAND_TASK_STATUS', { id: created.id, status: 'ACTIVE' })).setBrandTaskStatus as { status: string };
    check('resume → ACTIVE', resumed.status === 'ACTIVE');
    await expectError('createBrandTask with ×0.5', romaToken, 'CREATE_BRAND_TASK', { brandId: romaId, input: { ...input, multiplierPercent: 50 } }, ['BRAND_TASK_INVALID', 'BAD_USER_INPUT']);
    await expectError('createBrandTask with 22 windows (max 21)', romaToken, 'CREATE_BRAND_TASK', {
      brandId: romaId,
      input: { ...input, windows: Array.from({ length: 22 }, (_, i) => ({ dayOfWeek: (i % 7) + 1, startTime: `${String(i).padStart(2, '0')}:00`, endTime: `${String(i).padStart(2, '0')}:30` })) },
    }, ['BRAND_TASK_INVALID', 'BAD_USER_INPUT']);
    await expectError('createBrandTask with an end before the start', romaToken, 'CREATE_BRAND_TASK', {
      brandId: romaId,
      input: { ...input, windows: [{ dayOfWeek: 4, startTime: '14:00', endTime: '10:00' }] },
    }, ['BRAND_TASK_INVALID', 'BAD_USER_INPUT']);
    // No windows = all day (spec §2.2 BrandTaskWindow, 0–21 windows): accepted, then removed.
    const allDay = (await ok(romaToken, 'CREATE_BRAND_TASK', { brandId: romaId, input: { ...input, title: `QA all-day ${RUN}`, windows: [] } }))
      .createBrandTask as { id: string; windows: unknown[] };
    check('createBrandTask without windows = all day (accepted)', allDay.windows.length === 0, allDay);
    check('deleteBrandTask (all-day promotion)', (await ok(romaToken, 'DELETE_BRAND_TASK', { id: allDay.id })).deleteBrandTask === true);

    const removed = (await ok(romaToken, 'DELETE_BRAND_TASK', { id: created.id })).deleteBrandTask;
    const left = (await ok(romaToken, 'BRAND_TASKS', { brandId: romaId, includeArchived: true })).brandTasks as { id: string }[];
    check('deleteBrandTask of a never-applied promotion removes it', removed === true && !left.some((t) => t.id === created.id));

    await expectError('brandTasks of another brand', romaToken, 'BRAND_TASKS', { brandId: klosId, includeArchived: true }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    const platformTasks = (await ok(superToken, 'BRAND_TASKS', { brandId: romaId, includeArchived: true })).brandTasks;
    check('brandTasks (PLATFORM, support mode) answers', Array.isArray(platformTasks) && platformTasks.length >= 1);
  });

  await section('9. Brand admin: staff', async () => {
    const staff = (await ok(romaToken, 'BRAND_STAFF', { brandId: romaId })).brandStaff as Member[];
    const byEmail = (email: string) => staff.find((m) => m.email === email);
    check(
      'brandStaff: brand admin, spot admin (2 spots), employee of the brand',
      byEmail(SEED.romaAdmin)?.kind === 'BRAND_ADMIN' &&
        byEmail(SEED.romaSpotAdmin)?.kind === 'SPOT_ADMIN' &&
        byEmail(SEED.romaSpotAdmin)?.spotIds.length === 2 &&
        byEmail(SEED.romaEmployee)?.kind === 'EMPLOYEE',
      staff.map((m) => `${m.email}:${m.kind}`),
    );
    check('brandStaff has no other brand’s staff', staff.every((m) => m.brandId === romaId), staff.map((m) => m.brandId));
    const before = ((await ok(romaToken, 'ADMIN_BRAND', { id: romaId })).adminBrand as BrandView).staffCount;

    const active = (await ok(romaToken, 'BRAND_SPOTS', { brandId: romaId })).brandSpots as Spot[];
    const [s1, s2] = active.filter((s) => s.isActive);
    if (!s1 || !s2) throw new Error('Gelato Roma needs two active spots');

    const spotAdminEmail = `qa.spotadmin.${RUN}@loodly.dev`;
    const spotAdmin = (
      await ok(romaToken, 'INVITE_STAFF', {
        input: { brandId: romaId, kind: 'SPOT_ADMIN', spotIds: [s1.id, s2.id], name: 'QA Spot Admin', email: spotAdminEmail, language: 'PL' },
      })
    ).inviteStaff as Member;
    cleanup.push({ label: 'remove the QA spot admin', run: () => ok(romaToken, 'REMOVE_STAFF_MEMBER', { userId: spotAdmin.id }) });
    check('inviteStaff: spot admin with 2 spots, invite pending', spotAdmin.kind === 'SPOT_ADMIN' && sameSet(spotAdmin.spotIds, [s1.id, s2.id]) && spotAdmin.invitePending && spotAdmin.brandId === romaId, spotAdmin);

    const employeeEmail = `qa.employee.${RUN}@loodly.dev`;
    const employeePassword = testPassword();
    const employee = (
      await ok(romaToken, 'INVITE_STAFF', {
        input: { brandId: romaId, kind: 'EMPLOYEE', spotIds: [s1.id], name: 'QA Employee', email: employeeEmail, language: 'EN', password: employeePassword },
      })
    ).inviteStaff as Member;
    cleanup.push({ label: 'remove the QA employee', run: () => ok(romaToken, 'REMOVE_STAFF_MEMBER', { userId: employee.id }) });
    // invitePending = never signed in (CONTRACTS §14.1), so it stays true until the first login, password or not.
    check('inviteStaff: employee at one spot with a handed-over password', employee.kind === 'EMPLOYEE' && sameSet(employee.spotIds, [s1.id]) && employee.brandId === romaId, employee);
    const employeeLogin = await restLogin(employeeEmail, employeePassword);
    check('the new employee signing in to the console → 403 USE_SPOT_APP', employeeLogin.status === 403 && employeeLogin.body.code === 'USE_SPOT_APP', {
      status: employeeLogin.status,
      code: employeeLogin.body.code,
    });

    await expectError('inviteStaff of another brand’s staff member', romaToken, 'INVITE_STAFF', {
      input: { brandId: romaId, kind: 'EMPLOYEE', spotIds: [s1.id], name: 'Conflict', email: SEED.klosSpotAdmin },
    }, ['STAFF_CONFLICT']);
    await expectError('inviteStaff: employee at 2 spots', romaToken, 'INVITE_STAFF', {
      input: { brandId: romaId, kind: 'EMPLOYEE', spotIds: [s1.id, s2.id], name: 'Two', email: `qa.two.${RUN}@loodly.dev` },
    }, ['SPOT_REQUIRED', 'BAD_USER_INPUT']);
    if (klosSpots[0]) {
      await expectError('inviteStaff at another brand’s spot', romaToken, 'INVITE_STAFF', {
        input: { brandId: romaId, kind: 'EMPLOYEE', spotIds: [klosSpots[0].id], name: 'Foreign', email: `qa.foreign.${RUN}@loodly.dev` },
      }, ['SCOPE_FORBIDDEN', 'NOT_FOUND', 'BAD_USER_INPUT']);
    }

    const atS2 = (await ok(romaToken, 'BRAND_STAFF', { brandId: romaId, spotId: s2.id })).brandStaff as Member[];
    check('brandStaff(spotId): the spot admin is there, the employee of another spot is not', atS2.some((m) => m.id === spotAdmin.id) && !atS2.some((m) => m.id === employee.id));
    const count = ((await ok(romaToken, 'ADMIN_BRAND', { id: romaId })).adminBrand as BrandView).staffCount;
    check('adminBrand staffCount grows by 2', count === before + 2, { before, count });

    const narrowed = (await ok(romaToken, 'SET_SPOT_ADMIN_SPOTS', { userId: spotAdmin.id, spotIds: [s2.id] })).setSpotAdminSpots as Member;
    check('setSpotAdminSpots → one spot', sameSet(narrowed.spotIds, [s2.id]), narrowed);
    const moved = (await ok(romaToken, 'MOVE_EMPLOYEE', { userId: employee.id, spotId: s2.id })).moveEmployee as Member;
    check('moveEmployee → the other spot', sameSet(moved.spotIds, [s2.id]), moved);
    const demoted = (await ok(romaToken, 'CHANGE_STAFF_KIND', { userId: spotAdmin.id, kind: 'EMPLOYEE', spotIds: [s1.id] })).changeStaffKind as Member;
    check('changeStaffKind spot admin → employee', demoted.kind === 'EMPLOYEE' && sameSet(demoted.spotIds, [s1.id]), demoted);
    const promoted = (await ok(romaToken, 'CHANGE_STAFF_KIND', { userId: employee.id, kind: 'SPOT_ADMIN', spotIds: [s1.id, s2.id] })).changeStaffKind as Member;
    check('changeStaffKind employee → spot admin with 2 spots', promoted.kind === 'SPOT_ADMIN' && promoted.spotIds.length === 2, promoted);

    check('resendAdminInvite (pending invite)', (await ok(romaToken, 'RESEND_ADMIN_INVITE', { userId: spotAdmin.id })).resendAdminInvite === true);
    check('adminResetStaffPassword', (await ok(romaToken, 'ADMIN_RESET_STAFF_PASSWORD', { userId: employee.id })).adminResetStaffPassword === true);
    check('setStaffLoginDisabled true', (await ok(romaToken, 'SET_STAFF_LOGIN_DISABLED', { userId: employee.id, disabled: true })).setStaffLoginDisabled === true);
    const disabled = ((await ok(romaToken, 'BRAND_STAFF', { brandId: romaId })).brandStaff as Member[]).find((m) => m.id === employee.id);
    check('brandStaff shows the member disabled', disabled?.loginDisabled === true, disabled);
    check('setStaffLoginDisabled false', (await ok(romaToken, 'SET_STAFF_LOGIN_DISABLED', { userId: employee.id, disabled: false })).setStaffLoginDisabled === true);

    const klosStaff = (await ok(superToken, 'BRAND_STAFF', { brandId: klosId })).brandStaff as Member[];
    check('brandStaff (PLATFORM, support mode) of Złoty Kłos', klosStaff.length >= 3 && klosStaff.every((m) => m.brandId === klosId));
    await expectError('brandStaff of another brand', romaToken, 'BRAND_STAFF', { brandId: klosId }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    const foreign = klosStaff.find((m) => m.kind === 'EMPLOYEE');
    if (foreign) {
      await expectError('setStaffLoginDisabled on another brand’s member', romaToken, 'SET_STAFF_LOGIN_DISABLED', { userId: foreign.id, disabled: true }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
      await expectError('removeStaffMember of another brand’s member', romaToken, 'REMOVE_STAFF_MEMBER', { userId: foreign.id }, ['SCOPE_FORBIDDEN', 'NOT_FOUND']);
    }

    const removed = (await ok(romaToken, 'REMOVE_STAFF_MEMBER', { userId: spotAdmin.id })).removeStaffMember;
    const afterRemove = (await ok(romaToken, 'BRAND_STAFF', { brandId: romaId })).brandStaff as Member[];
    check('removeStaffMember drops the member from the list', removed === true && !afterRemove.some((m) => m.id === spotAdmin.id));
    cleanup.splice(cleanup.findIndex((c) => c.label === 'remove the QA spot admin'), 1);
  });

  await section('10. Platform: partnership requests (Requests inbox)', async () => {
    type Lead = {
      id: string;
      companyName: string;
      contactName: string;
      email: string;
      phone: string;
      city: string | null;
      businessTypes: string[];
      spotsCount: number;
      language: string | null;
      status: string;
      adminNote: string | null;
      statusChangedAt: string | null;
      statusChangedBy: { id: string; name: string | null } | null;
      createdAt: string;
    };
    type Counts = { new: number; contacted: number; approved: number; declined: number; total: number };
    const counts = async () => (await ok(superToken, 'BUSINESS_LEAD_COUNTS')).businessLeadCounts as Counts;
    const page = async (vars: Record<string, unknown>) =>
      (await ok(superToken, 'BUSINESS_LEADS', { status: null, search: null, limit: 25, offset: 0, ...vars })).businessLeads as {
        items: Lead[];
        total: number;
      };

    // Seeded: one request per status (CONTRACTS §20).
    const c0 = await counts();
    check('businessLeadCounts: totals add up', c0.total === c0.new + c0.contacted + c0.approved + c0.declined, c0);
    check('businessLeadCounts: ≥ 1 of each seeded status', c0.new >= 1 && c0.contacted >= 1 && c0.approved >= 1 && c0.declined >= 1, c0);

    const all = await page({});
    check('businessLeads (all): total = counts.total', all.total === c0.total, { total: all.total, counts: c0.total });
    const sorted = all.items.every((l, i, arr) => i === 0 || arr[i - 1].createdAt >= l.createdAt);
    check('businessLeads: newest first', sorted, all.items.map((l) => l.createdAt));

    for (const status of ['NEW', 'CONTACTED', 'APPROVED', 'DECLINED'] as const) {
      const filtered = await page({ status });
      const key = status.toLowerCase() as keyof Counts;
      check(
        `businessLeads(status: ${status}): only ${status}, total = counts.${key}`,
        filtered.items.every((l) => l.status === status) && filtered.total === c0[key],
        { total: filtered.total, statuses: filtered.items.map((l) => l.status) },
      );
    }

    const first = await page({ limit: 2, offset: 0 });
    const second = await page({ limit: 2, offset: 2 });
    check(
      'businessLeads paging: limit 2, offset 2 continues without overlap',
      first.items.length === Math.min(2, c0.total) && first.total === c0.total && !second.items.some((l) => first.items.some((f) => f.id === l.id)),
      { first: first.items.map((l) => l.id), second: second.items.map((l) => l.id) },
    );

    const bySearch = await page({ search: 'bakery' });
    check('search "bakery" (company / email, case-insensitive) finds Demo Bakery & Coffee', bySearch.items.some((l) => l.companyName === 'Demo Bakery & Coffee') && bySearch.total === bySearch.items.length, bySearch.items.map((l) => l.companyName));
    const byEmail = await page({ search: 'SOLODKA.example' });
    check('search by email part finds the UA request', byEmail.items.length === 1 && byEmail.items[0].language === 'UA', byEmail.items.map((l) => l.email));
    const byCity = await page({ search: 'gdańsk' });
    check('search by city', byCity.items.some((l) => l.city === 'Gdańsk'), byCity.items.map((l) => l.city));
    const combined = await page({ status: 'DECLINED', search: 'bakery' });
    check('status filter + search combine (DECLINED + "bakery" → none)', combined.total === 0 && combined.items.length === 0, combined);
    const none = await page({ search: `zz-no-such-request-${RUN}` });
    check('search without matches → empty page, total 0', none.total === 0 && none.items.length === 0);

    const contacted = all.items.find((l) => l.status === 'CONTACTED');
    if (contacted) {
      const detail = (await ok(superToken, 'BUSINESS_LEAD', { id: contacted.id })).businessLead as Lead;
      check(
        'businessLead(id): detail with the seeded note and who changed the status',
        detail.id === contacted.id && !!detail.adminNote && detail.statusChangedBy?.id === superId && !!detail.statusChangedAt,
        detail,
      );
    }
    const unknown = (await ok(superToken, 'BUSINESS_LEAD', { id: '00000000-0000-0000-0000-000000000000' })).businessLead;
    check('businessLead(unknown id) → null', unknown === null, unknown);

    // A fresh request through the public landing mutation (not an app document), so the
    // status flow does not depend on seeded rows. Falls back to the seeded NEW one.
    const company = `QA Lead ${RUN}`;
    const submit = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation SubmitBusinessLead($input: BusinessLeadInput!) { submitBusinessLead(input: $input) }',
        variables: {
          input: {
            companyName: company,
            contactName: 'QA Contact',
            email: `qa.lead.${RUN}@example.com`,
            phone: '+48 500 123 456',
            city: 'Warszawa',
            businessTypes: ['ICE_CREAM', 'CAFE'],
            spotsCount: 3,
            message: 'QA smoke request',
            language: 'EN',
            consent: true,
          },
        },
      }),
    });
    const submitBody = (await submit.json().catch(() => ({}))) as { data?: { submitBusinessLead?: boolean }; errors?: GqlError[] };
    let lead: Lead | undefined;
    if (submitBody.data?.submitBusinessLead === true) {
      const found = await page({ status: 'NEW', search: company });
      lead = found.items[0];
      check('a submitted request shows up in the inbox as NEW', found.total === 1 && lead?.status === 'NEW' && lead.spotsCount === 3, found.items);
      const c1 = await counts();
      check('counts.new grows by 1', c1.new === c0.new + 1 && c1.total === c0.total + 1, { before: c0, after: c1 });
    } else {
      console.log(`  - submitBusinessLead refused (${String(submitBody.errors?.[0]?.extensions?.code)}); using the seeded NEW request`);
      lead = all.items.find((l) => l.status === 'NEW');
    }
    if (!lead) throw new Error('No NEW request to work with');
    const id = lead.id;

    const toContacted = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'CONTACTED' })).updateBusinessLead as Lead;
    check(
      'mark contacted: status, stamp and who (the super admin)',
      toContacted.status === 'CONTACTED' && !!toContacted.statusChangedAt && toContacted.statusChangedBy?.id === superId && toContacted.statusChangedBy?.name === superName,
      toContacted,
    );
    const stamp = toContacted.statusChangedAt;

    const noted = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, adminNote: '  Call on Monday  ' })).updateBusinessLead as Lead;
    check('note only: saved (trimmed or as sent), status and stamp unchanged', !!noted.adminNote?.includes('Call on Monday') && noted.status === 'CONTACTED' && noted.statusChangedAt === stamp, noted);
    const same = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'CONTACTED' })).updateBusinessLead as Lead;
    check('same status again keeps the stamp and the note', same.statusChangedAt === stamp && !!same.adminNote, same);

    await new Promise((r) => setTimeout(r, 20));
    const approved = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'APPROVED' })).updateBusinessLead as Lead;
    check('approve: APPROVED, stamp moves, note kept', approved.status === 'APPROVED' && approved.statusChangedAt !== stamp && !!approved.adminNote, approved);
    const declined = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'DECLINED' })).updateBusinessLead as Lead;
    check('decline: DECLINED', declined.status === 'DECLINED', declined);
    const reopened = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'NEW' })).updateBusinessLead as Lead;
    check('back to NEW (the panel offers it)', reopened.status === 'NEW', reopened);
    const cleared = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, adminNote: '' })).updateBusinessLead as Lead;
    check('note "" clears it (the panel sends the trimmed text)', cleared.adminNote === null, cleared.adminNote);
    await expectError('note over 2000 characters', superToken, 'UPDATE_BUSINESS_LEAD', { id, adminNote: 'x'.repeat(2001) }, ['BAD_USER_INPUT']);
    await expectError('updateBusinessLead of an unknown id', superToken, 'UPDATE_BUSINESS_LEAD', { id: '00000000-0000-0000-0000-000000000000', status: 'CONTACTED' }, ['NOT_FOUND']);
    const finalState = (await ok(superToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'DECLINED' })).updateBusinessLead as Lead;
    const listed = await page({ status: 'DECLINED', search: lead.companyName });
    check('the list follows the status (DECLINED filter has it)', finalState.status === 'DECLINED' && listed.items.some((l) => l.id === id));

    // Platform only (CONTRACTS §20): brand staff are refused.
    await expectError('brand admin: businessLeads', romaToken, 'BUSINESS_LEADS', { status: null, search: null, limit: 25, offset: 0 }, ['SCOPE_FORBIDDEN']);
    await expectError('brand admin: businessLeadCounts', romaToken, 'BUSINESS_LEAD_COUNTS', {}, ['SCOPE_FORBIDDEN']);
    await expectError('brand admin: businessLead', romaToken, 'BUSINESS_LEAD', { id }, ['SCOPE_FORBIDDEN']);
    await expectError('brand admin: updateBusinessLead', romaToken, 'UPDATE_BUSINESS_LEAD', { id, status: 'APPROVED' }, ['SCOPE_FORBIDDEN']);
    const untouched = (await ok(superToken, 'BUSINESS_LEAD', { id })).businessLead as Lead;
    check('the request is unchanged after the refused update', untouched.status === 'DECLINED', untouched.status);
  });
} catch (err) {
  check('smoke run finished', false, err instanceof Error ? err.message : String(err));
} finally {
  if (cleanup.length > 0) console.log('\nCleanup');
  for (const step of cleanup.reverse()) {
    try {
      await step.run();
      console.log(`  · ${step.label}`);
    } catch (err) {
      console.log(`  ! ${step.label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  await vite.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed > 0 ? 1 : 0);
