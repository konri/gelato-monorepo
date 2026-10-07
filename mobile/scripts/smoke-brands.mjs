#!/usr/bin/env node
/**
 * Live smoke of the client app's brands flows (BRANDS_SPEC §5.10) against a
 * LOCAL backend with the seed of `npx prisma migrate reset --force`
 * (loodly-be prisma/seed.ts personas). It sends the app's own documents
 * (scripts/graphql-docs.mjs) with the app's headers and checks the results
 * with the app's own pure helpers (utils/loyaltyMode.ts, utils/notificationRouting.ts).
 *
 *   SMOKE_API_URL=http://localhost:4100 node scripts/smoke-brands.mjs
 *
 * Needs Node >= 22.18 (type stripping for the .ts helpers, global WebSocket).
 * Not idempotent: it claims rewards and awards points, so run it on a freshly
 * seeded scratch database.
 *
 *   node scripts/smoke-brands.mjs --upgrade
 *     against a server started with MIN_CLIENT_API=3 MIN_CLIENT_VERSION=client:1.1.0:
 *     checks the UPGRADE_REQUIRED answers the app's upgrade gate reads.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { documentFor, loadAppDocuments, ROOT } from './graphql-docs.mjs';

const require = createRequire(join(ROOT, 'package.json'));
const { createClient } = require('graphql-ws');
const { resolveLoyaltyMode, isEngaged } = await import(join(ROOT, 'utils/loyaltyMode.ts'));
const { routeFromNotification, routeFromPushData } = await import(join(ROOT, 'utils/notificationRouting.ts'));
const en = (await import(join(ROOT, 'translations/resources/en.ts'))).default;
const pl = (await import(join(ROOT, 'translations/resources/pl.ts'))).default;
const ua = (await import(join(ROOT, 'translations/resources/ua.ts'))).default;

const API = (process.env.SMOKE_API_URL ?? 'http://localhost:4100').replace(/\/$/, '');
const GQL = `${API}/graphql`;
const APP_VERSION = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo.version;
// The app's clientInfo.ts headers.
const CLIENT_HEADERS = { 'x-loodly-client': `client@${APP_VERSION}`, 'x-loodly-api': '2' };
const SPOT_HEADERS = { 'x-loodly-client': 'spot@1.1.0', 'x-loodly-api': '2' };
const CLIENT_PASSWORD = 'Client1234'; // prisma/seed.ts dev personas (local only)
const STAFF_PASSWORD = 'Staff1234';

const docs = loadAppDocuments();
const D = (name) => documentFor(docs, name);

// ── Tiny test harness ────────────────────────────────────────────────────────
let passed = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${ok ? '✓' : '✗'} ${name}${!ok && detail ? ` — ${detail}` : ''}`);
  return ok;
};
const section = (title) => console.log(`\n── ${title}`);

let ipSeq = 10;
async function login(email, password, { headers = CLIENT_HEADERS, loginContext = 'MOBILE_CLIENT' } = {}) {
  ipSeq += 1;
  const res = await fetch(`${API}/authorization/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.77.0.${ipSeq}`, ...headers },
    body: JSON.stringify({ email, password, loginContext }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.token?.access_token) {
    throw new Error(`login ${email} failed: ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  }
  return { token: body.token.access_token, user: body.user };
}

async function gql(token, query, variables = {}, headers = CLIENT_HEADERS) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({ errors: [{ message: `HTTP ${res.status}` }] }));
  return { status: res.status, data: body.data ?? null, errors: body.errors ?? null };
}
const ok = async (token, name, variables, headers) => {
  const r = await gql(token, D(name), variables, headers);
  if (r.errors) throw new Error(`${name}: ${JSON.stringify(r.errors).slice(0, 300)}`);
  return r.data;
};
const codeOf = (r) => r.errors?.[0]?.extensions?.code ?? null;

const newRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;

// ── Personas (prisma/seed.ts §19.2) ──────────────────────────────────────────
const PERSONAS = [
  { email: 'client@test.com', mode: 'MULTI', engaged: 2 },
  { email: 'single@test.com', mode: 'SINGLE', brand: 'Gelato Roma' },
  { email: 'reward@test.com', mode: 'SINGLE', brand: 'Gelato Roma', ready: true },
  { email: 'warsaw@test.com', mode: 'MANY_TO_DISCOVER', cityBrands: 2 },
  { email: 'krakow@test.com', mode: 'ONE_TO_DISCOVER', brand: 'Gelato Roma', cityBrands: 1 },
  { email: 'nocity@test.com', mode: 'NO_CITY' },
  { email: 'gdansk@test.com', mode: 'NO_BRANDS_IN_CITY', cityBrands: 0 },
  { email: 'lviv@test.com', mode: 'SINGLE', brand: 'Złoty Kłos Bakery', language: 'ua', cityBrands: 1 },
];

async function upgradeSmoke() {
  const { upgradeInfoFrom } = await import(join(ROOT, 'shared/api-client/src/upgradeEvents.ts'));
  const expected = { minVersion: '1.1.0', minApi: 3 };
  const same = (a) => a.minVersion === expected.minVersion && a.minApi === expected.minApi;
  section('UPGRADE_REQUIRED (MIN_CLIENT_API=3, MIN_CLIENT_VERSION=client:1.1.0)');
  const r = await gql(null, D('LoyaltyOverview'), {});
  const ext = r.errors?.[0]?.extensions ?? {};
  check(`GraphQL → extensions.code UPGRADE_REQUIRED (HTTP ${r.status})`, ext.code === 'UPGRADE_REQUIRED', JSON.stringify(r.errors));
  check('upgradeInfoFrom(extensions) gives the gate its version', same(upgradeInfoFrom(ext)), JSON.stringify(upgradeInfoFrom(ext)));
  const rt = await gql(null, D('RefreshToken'), { refreshToken: 'x' });
  check('token refresh is gated too (refreshToken.ts raises the gate)', codeOf(rt) === 'UPGRADE_REQUIRED', JSON.stringify(rt.errors?.[0]?.extensions));
  const res = await fetch(`${API}/authorization/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.77.2.1', ...CLIENT_HEADERS },
    body: JSON.stringify({ email: 'client@test.com', password: CLIENT_PASSWORD, loginContext: 'MOBILE_CLIENT' }),
  });
  const body = await res.json().catch(() => ({}));
  check('REST login → 426 { code: UPGRADE_REQUIRED }', res.status === 426 && body.code === 'UPGRADE_REQUIRED', `${res.status} ${JSON.stringify(body)}`);
  check('upgradeInfoFrom(REST body) gives the gate its version', same(upgradeInfoFrom(body)));
  const plain = await fetch(GQL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: '{ cities { id } }' }) });
  check('header-less callers (courier 1.0.0) are not gated', plain.status === 200 && !(await plain.json()).errors);
  const wsErr = await new Promise((resolve) => {
    const ws = createClient({
      url: GQL.replace(/^http/, 'ws'),
      webSocketImpl: WebSocket,
      retryAttempts: 0,
      connectionParams: () => ({ authorization: '', client: `client@${APP_VERSION}`, api: 2 }),
    });
    const timer = setTimeout(() => resolve(null), 4000);
    ws.subscribe({ query: D('PointsUpdated') }, {
      next: () => {},
      error: (e) => { clearTimeout(timer); void ws.dispose(); resolve(e); },
      complete: () => { clearTimeout(timer); void ws.dispose(); resolve(null); },
    });
  });
  const wsCode = Array.isArray(wsErr) ? wsErr[0]?.extensions?.code : null;
  check('WS subscribe → error with extensions.code UPGRADE_REQUIRED (usePointsSubscription raises the gate)', wsCode === 'UPGRADE_REQUIRED' && same(upgradeInfoFrom(wsErr[0].extensions)), JSON.stringify(wsErr));
}

const session = {};
const overviews = {};
const brandIdByName = {};

async function overviewOf(email) {
  const data = await ok(session[email].token, 'LoyaltyOverview', {});
  overviews[email] = data;
  return data;
}

try {
  if (process.argv.includes('--upgrade')) {
    await upgradeSmoke();
    throw Symbol.for('done');
  }
  section('Headers and auth codes');
  {
    const r = await gql(null, D('LoyaltyOverview'), {});
    check('LoyaltyOverview without a token → extensions.code UNAUTHENTICATED', codeOf(r) === 'UNAUTHENTICATED', JSON.stringify(r.errors?.[0]?.extensions));
    const bad = await fetch(`${API}/authorization/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.77.1.1', ...CLIENT_HEADERS },
      body: JSON.stringify({ email: 'client@test.com', password: 'wrong-password', loginContext: 'MOBILE_CLIENT' }),
    });
    const body = await bad.json();
    check('REST login error body carries code INVALID_CREDENTIALS', body.code === 'INVALID_CREDENTIALS', JSON.stringify(body));
  }

  section('Personas: LoyaltyOverview → utils/loyaltyMode');
  for (const p of PERSONAS) {
    session[p.email] = await login(p.email, CLIENT_PASSWORD);
    const { me, myLoyaltyOverview: o } = await overviewOf(p.email);
    const mode = resolveLoyaltyMode(o, null, 'ready');
    const brandName = (id) => o.wallets.find((w) => w.brand.id === id)?.brand.name;
    for (const w of o.wallets) brandIdByName[w.brand.name] = w.brand.id;
    check(`${p.email}: mode ${p.mode}`, mode.kind === p.mode, `got ${JSON.stringify(mode)}`);
    check(`${p.email}: loyaltyCode is a GL- code`, /^GL-[A-Z0-9]{8}$/.test(me.loyaltyCode ?? ''), me.loyaltyCode);
    if (p.brand) check(`${p.email}: mode brand is ${p.brand}`, brandName(mode.brandId) === p.brand, brandName(mode.brandId));
    if (p.engaged) check(`${p.email}: ${p.engaged} engaged wallets (server count agrees)`, o.wallets.filter(isEngaged).length === p.engaged && o.engagedBrandCount === p.engaged);
    if (p.mode === 'MULTI') {
      const other = o.wallets.filter(isEngaged).find((w) => w.brand.id !== mode.brandId);
      const sel = resolveLoyaltyMode(o, other.brand.id, 'ready');
      check(`${p.email}: a persisted selection is kept in MULTI`, sel.kind === 'MULTI' && sel.brandId === other.brand.id);
      check(`${p.email}: showPointsPicker in MULTI`, o.showPointsPicker === true);
    }
    if (p.mode === 'SINGLE') check(`${p.email}: no picker in SINGLE`, o.showPointsPicker === false);
    if (p.ready) {
      const item = o.readyToPickUp[0];
      check(`${p.email}: reward ready to pick up, with brand and PR- code`, !!item && !!item.brand?.name && /^PR-/.test(item.qrCode ?? '') && item.isRedeemableNow === true, JSON.stringify(item));
    }
    if (p.language) check(`${p.email}: profile language ${p.language} (enum ${me.language})`, me.language === p.language.toUpperCase(), me.language);
    if (p.mode === 'NO_CITY') check(`${p.email}: no city`, o.cityId == null && o.city == null);

    if (p.cityBrands != null) {
      const { brandsInCity } = await ok(session[p.email].token, 'BrandsInCity', { cityId: o.cityId });
      check(`${p.email}: BrandsInCity(${o.city?.name}) lists ${p.cityBrands}`, brandsInCity.length === p.cityBrands, `got ${brandsInCity.map((b) => b.name)}`);
      check(`${p.email}: every city brand has ≥ 1 location there`, brandsInCity.every((b) => b.spotCount > 0));
    }
  }

  section('Brand page and catalog (BrandDetail, BrandRewards)');
  const romaId = brandIdByName['Gelato Roma'];
  const klosId = brandIdByName['Złoty Kłos Bakery'];
  check('seed brands found in overviews', !!romaId && !!klosId);
  const single = session['single@test.com'].token;
  {
    const { brand } = await ok(single, 'BrandDetail', { id: romaId });
    check('BrandDetail: Gelato Roma with cities and active locations', brand?.name === 'Gelato Roma' && brand.cities.length >= 2 && brand.spots.length >= 3);
    check('BrandDetail: drafts are not listed', brand.spots.every((s) => s.isActive !== false));
    check('BrandDetail: active promotion with timezone and spot names', brand.activePromotions.length >= 1 && brand.activePromotions.every((x) => !!x.timezone && Array.isArray(x.spotNames)));
    const { prizes } = await ok(single, 'BrandRewards', { brandId: romaId });
    check('BrandRewards: Gelato Roma has rewards, all of that brand', prizes.length >= 1 && prizes.every((x) => x.brandId === romaId), `${prizes.length}`);
    const { prizes: klos } = await ok(single, 'BrandRewards', { brandId: klosId });
    check('BrandRewards: Złoty Kłos catalog is separate', klos.length >= 1 && klos.every((x) => x.brandId === klosId));
    const { brand: paused } = await ok(single, 'BrandSummary', { id: klosId });
    check('BrandSummary works for order tracking', paused?.name === 'Złoty Kłos Bakery');
  }

  section('Claim a reward (RedeemPrize with requestId replay)');
  let claimed = null;
  {
    const { myLoyaltyOverview: o } = overviews['single@test.com'];
    const wallet = o.wallets.find((w) => w.brand.id === romaId);
    const { prizes } = await ok(single, 'BrandRewards', { brandId: romaId });
    const prize = prizes.filter((x) => x.isActive && x.pointsCost <= wallet.availablePoints).sort((a, b) => a.pointsCost - b.pointsCost)[0];
    check('single@test.com can afford a Gelato Roma reward', !!prize, `available ${wallet.availablePoints}`);
    const before = (await ok(single, 'GetMyPointBalance', { brandId: romaId })).myPointBalance.availablePoints;
    const { prize: detail } = await ok(single, 'PrizeDetail', { id: prize.id });
    check('PrizeDetail (deep link) carries its brand', detail.brand?.id === romaId && detail.brandId === romaId);

    const requestId = newRequestId();
    const first = await gql(single, D('RedeemPrize'), { prizeId: prize.id, requestId });
    check('RedeemPrize succeeds', !first.errors, JSON.stringify(first.errors));
    claimed = first.data?.redeemPrize;
    const replay = await gql(single, D('RedeemPrize'), { prizeId: prize.id, requestId });
    check('replaying the same requestId returns the same claim', replay.data?.redeemPrize?.id === claimed?.id, JSON.stringify(replay.errors));
    const after = (await ok(single, 'GetMyPointBalance', { brandId: romaId })).myPointBalance.availablePoints;
    check(`points debited once (${before} → ${after}, cost ${prize.pointsCost})`, before - after === prize.pointsCost);
    check('claim has a PR- code, its brand and the 7-day window', /^PR-/.test(claimed?.qrCode ?? '') && claimed?.brand?.id === romaId && !!claimed?.validUntil && claimed?.isRedeemableNow === true);

    // Two taps at once with one requestId (a retry racing the first call).
    const rid2 = newRequestId();
    const affordable = after >= prize.pointsCost;
    if (affordable) {
      const [a, b] = await Promise.all([
        gql(single, D('RedeemPrize'), { prizeId: prize.id, requestId: rid2 }),
        gql(single, D('RedeemPrize'), { prizeId: prize.id, requestId: rid2 }),
      ]);
      const ids = [a, b].map((r) => r.data?.redeemPrize?.id).filter(Boolean);
      const after2 = (await ok(single, 'GetMyPointBalance', { brandId: romaId })).myPointBalance.availablePoints;
      check('concurrent calls with one requestId: one claim, one debit', new Set(ids).size === 1 && after - after2 === prize.pointsCost, `ids ${ids} codes ${[codeOf(a), codeOf(b)]} ${after}→${after2}`);
    }

    const { myPrizes } = await ok(single, 'MyPrizes', {});
    const mine = myPrizes.find((x) => x.id === claimed?.id);
    check('MyPrizes includes the claim with its brand', !!mine && mine.brand?.name === 'Gelato Roma' && mine.prize?.id === prize.id);
    const { myPrizes: onlyKlos } = await ok(single, 'MyPrizes', { brandId: klosId });
    check('MyPrizes(brandId) filters by brand', onlyKlos.every((x) => x.brandId === klosId));
    const { myPrize } = await ok(single, 'MyPrize', { id: claimed.id });
    check('MyPrize (My reward screen) loads the claim', myPrize?.id === claimed.id && myPrize.isRedeemed === false);
    const { myLoyaltyOverview: o2 } = await overviewOf('single@test.com');
    check('overview: claim is ready to pick up', o2.readyToPickUp.some((x) => x.id === claimed.id && x.brand?.id === romaId));
    check('overview: the wallet counts the reward to pick up', (o2.wallets.find((w) => w.brand.id === romaId)?.readyToPickUpCount ?? 0) >= 1);
  }

  section('Errors the claim sheet explains (silent codes)');
  {
    const krakow = session['krakow@test.com'].token;
    const { prizes } = await ok(krakow, 'BrandRewards', { brandId: romaId });
    const r = await gql(krakow, D('RedeemPrize'), { prizeId: prizes[0].id, requestId: newRequestId() });
    const ext = r.errors?.[0]?.extensions ?? {};
    check('INSUFFICIENT_POINTS with missingPoints and brandName', ext.code === 'INSUFFICIENT_POINTS' && Number(ext.missingPoints) === prizes[0].pointsCost && ext.brandName === 'Gelato Roma', JSON.stringify(ext));
  }

  section('Points history (GetMyPointTransactions)');
  {
    const { myPointTransactions: all } = await ok(single, 'GetMyPointTransactions', { limit: 50 });
    const claimRow = all.find((x) => x.source === 'PRIZE_CLAIM');
    check('history has the PRIZE_CLAIM row with its brand', !!claimRow && claimRow.brand?.id === romaId, JSON.stringify(claimRow));
    check('PRIZE_CLAIM amount sign (app prints a minus for spent points)', !!claimRow && (claimRow.amount < 0 || claimRow.type !== 'EARNED'), JSON.stringify({ amount: claimRow?.amount, type: claimRow?.type }));
    const { myPointTransactions: roma } = await ok(single, 'GetMyPointTransactions', { limit: 50, brandId: romaId });
    check('history filtered by brandId', roma.length > 0 && roma.every((x) => x.brandId === romaId));
    const sources = new Set(all.map((x) => x.source));
    for (const [lng, res] of Object.entries({ en, pl, ua })) {
      const missing = [...sources].filter((s) => !res.History?.source?.[s]);
      check(`History.source.* (${lng}) covers ${[...sources].join(', ')}`, missing.length === 0, `missing ${missing}`);
    }
  }

  section('Referral and Tasks documents');
  {
    const client = session['client@test.com'].token;
    const { myReferralStats } = await ok(client, 'GetMyReferralStats', {});
    check('GetMyReferralStats: client@test.com has the pending invitation of single@test.com', myReferralStats.pendingReferrals >= 1, JSON.stringify(myReferralStats));
    const { myReferralCode } = await ok(client, 'GetMyReferralCode', {});
    check('GetMyReferralCode', !!myReferralCode?.code);
  }

  section('Staff side: live points, auto mode switch, hand-over, counter exchange');
  // Custom points need MANAGE_SPOT (spot admins); employees award templates.
  const romaStaff = await login('spotadmin.roma@loodly.dev', STAFF_PASSWORD, { headers: SPOT_HEADERS, loginContext: 'ADMIN_WEB' });
  const klosStaff = await login('spotadmin.klos@loodly.dev', STAFF_PASSWORD, { headers: SPOT_HEADERS, loginContext: 'ADMIN_WEB' });
  const spotNamed = (u, part) => (u.spots ?? []).find((s) => s.name?.includes(part))?.id ?? u.spotId;
  const romaSpot = spotNamed(romaStaff.user, 'Warsaw Center');
  const klosSpot = spotNamed(klosStaff.user, 'Śródmieście');
  check('staff logins carry their spots', !!romaSpot && !!klosSpot, JSON.stringify([romaStaff.user.spots, klosStaff.user.spots]));
  const AWARD = `mutation SmokeAward($input: AwardLoyaltyPointsInput!) {
    awardLoyaltyPoints(input: $input) { awardedPoints brandAvailablePoints duplicate brand { id name } }
  }`;

  // krakow@test.com: ONE_TO_DISCOVER → SINGLE after a first credit, seen live on the app's socket.
  {
    const kr = session['krakow@test.com'];
    const events = [];
    const ws = createClient({
      url: GQL.replace(/^http/, 'ws'),
      webSocketImpl: WebSocket,
      lazy: false,
      retryAttempts: 0,
      connectionParams: () => ({ authorization: `Bearer ${kr.token}`, client: `client@${APP_VERSION}`, api: 2 }),
    });
    const subErrors = [];
    const unsubscribe = ws.subscribe(
      { query: D('PointsUpdated') },
      { next: (m) => events.push(m.data?.pointsUpdated), error: (e) => subErrors.push(e), complete: () => {} },
    );
    await new Promise((r) => setTimeout(r, 800));
    const code = overviews['krakow@test.com'].me.loyaltyCode;
    const award = await gql(romaStaff.token, AWARD, { input: { customer: code, spotId: romaSpot, points: 120, description: 'smoke', requestId: newRequestId() } }, SPOT_HEADERS);
    check('staff awards 120 points at Gelato Roma (by GL- code)', award.data?.awardLoyaltyPoints?.awardedPoints >= 120, JSON.stringify(award.errors));
    for (let i = 0; i < 30 && events.length === 0; i++) await new Promise((r) => setTimeout(r, 100));
    const ev = events[0];
    check('pointsUpdated(allBrands: true) delivers the brand event to the app socket', !!ev && ev.brandId === romaId && ev.brandAvailablePoints >= 120 && ev.change > 0, JSON.stringify(ev ?? subErrors));
    check('event source lets the app auto-follow (STAFF_*)', !!ev && /^STAFF_/.test(ev.source ?? ''), ev?.source);
    unsubscribe();
    await ws.dispose();
    const { myLoyaltyOverview: o } = await overviewOf('krakow@test.com');
    const mode = resolveLoyaltyMode(o, null, 'ready');
    check('krakow@test.com: ONE_TO_DISCOVER → SINGLE after the first credit', mode.kind === 'SINGLE' && mode.brandId === romaId, JSON.stringify(mode));
  }

  // single@test.com: SINGLE → MULTI after a first credit at a second brand.
  {
    const code = overviews['single@test.com'].me.loyaltyCode;
    const award = await gql(klosStaff.token, AWARD, { input: { customer: code, spotId: klosSpot, points: 30, description: 'smoke', requestId: newRequestId() } }, SPOT_HEADERS);
    check('staff awards points at Złoty Kłos', !award.errors, JSON.stringify(award.errors));
    const { myLoyaltyOverview: o } = await overviewOf('single@test.com');
    const mode = resolveLoyaltyMode(o, null, 'ready');
    check('single@test.com: SINGLE → MULTI after a credit at a second brand', mode.kind === 'MULTI', JSON.stringify(mode));
  }

  // Hand-over of the claimed reward flips My reward to "Used".
  if (claimed) {
    const r = await gql(romaStaff.token, `mutation SmokeHandOver($customer: String!, $spotId: ID!, $userPrizeId: ID!) {
      handOverReward(customer: $customer, spotId: $spotId, userPrizeId: $userPrizeId) { id isRedeemed }
    }`, { customer: overviews['single@test.com'].me.loyaltyCode, spotId: romaSpot, userPrizeId: claimed.id }, SPOT_HEADERS);
    check('staff hands over the claimed reward', r.data?.handOverReward?.isRedeemed === true, JSON.stringify(r.errors));
    const { myPrize } = await ok(single, 'MyPrize', { id: claimed.id });
    check('MyPrize flips to redeemed (My reward → "Used")', myPrize.isRedeemed === true && !!myPrize.redeemedAt && myPrize.redeemedAtSpot?.id === romaSpot);
    const { myLoyaltyOverview: o } = await overviewOf('single@test.com');
    check('the used reward leaves "ready to pick up"', !o.readyToPickUp.some((x) => x.id === claimed.id));
  }

  // A3 counter exchange → bell row the app localizes and routes to My card.
  {
    const client = session['client@test.com'];
    const o = overviews['client@test.com'].myLoyaltyOverview;
    const wallet = o.wallets.find((w) => w.brand.id === romaId);
    const { prizes } = await ok(client.token, 'BrandRewards', { brandId: romaId });
    const prize = prizes.filter((x) => x.pointsCost <= wallet.availablePoints).sort((a, b) => a.pointsCost - b.pointsCost)[0];
    const r = await gql(romaStaff.token, `mutation SmokeExchange($spotId: ID!, $customerId: ID!, $prizeId: ID!, $requestId: String!) {
      exchangeRewardAtCounter(spotId: $spotId, customerId: $customerId, prizeId: $prizeId, requestId: $requestId) { pointsSpent brandAvailablePoints duplicate }
    }`, { spotId: romaSpot, customerId: overviews['client@test.com'].me.id, prizeId: prize?.id, requestId: newRequestId() }, SPOT_HEADERS);
    check('counter exchange for client@test.com', r.data?.exchangeRewardAtCounter?.pointsSpent === prize?.pointsCost, JSON.stringify(r.errors));
    await new Promise((res) => setTimeout(res, 500));
    const { myNotifications } = await ok(client.token, 'MyNotifications', { limit: 20 });
    const row = myNotifications.find((n) => n.type === 'REWARD_EXCHANGED');
    const data = typeof row?.data === 'string' ? JSON.parse(row.data) : row?.data;
    check('bell row REWARD_EXCHANGED with brandName, prizeName, points', !!row && data?.brandName === 'Gelato Roma' && !!data?.prizeName && Number(data?.points) === prize?.pointsCost, JSON.stringify(row));
    const route = row ? routeFromNotification(row.type, data) : null;
    check('the app routes it to My card on that brand', typeof route === 'string' && route.includes('section=account') && route.includes(`brandId=${encodeURIComponent(romaId)}`), route);
    const pushRoute = routeFromPushData({ kind: 'POINTS_EARNED', event: 'REWARD_EXPIRING', brandId: romaId, userPrizeId: 'abc' });
    check('a REWARD_EXPIRING push opens My reward', pushRoute === '/prize/mine/abc', pushRoute);
  }

  section('App order → points at the order brand; A2 referral on the first purchase');
  {
    const s1 = session['single@test.com'].token;
    const { spotProducts } = await ok(s1, 'SpotProducts', { spotId: romaSpot });
    const product = spotProducts.find((x) => !x.isBox && x.price > 0 && x.isAvailable !== false);
    check('SpotProducts lists an orderable product at Warsaw Center', !!product);
    const created = await gql(s1, D('CreateOrder'), {
      input: { spotId: romaSpot, items: [{ productId: product.id, quantity: 2 }], fulfillmentType: 'PICKUP', paymentMethod: 'cash' },
    });
    check('CreateOrder (pickup, pay at the counter)', !created.errors, JSON.stringify(created.errors));
    const orderId = created.data?.createOrder?.id;
    const { order } = await ok(s1, 'OrderDetail', { id: orderId });
    check('OrderDetail carries the order brand (apology line, tracking)', order.brandId === romaId);
    const col = await gql(romaStaff.token, `mutation SmokeCollect($orderId: ID!) { collectPickupOrder(orderId: $orderId) { pointsAwarded } }`, { orderId }, SPOT_HEADERS);
    check('staff collects the pickup order', !col.errors, JSON.stringify(col.errors));
    const { myPointTransactions: rows } = await ok(s1, 'GetMyPointTransactions', { limit: 50, brandId: romaId });
    const orderRow = rows.find((x) => x.source === 'ORDER');
    check(`ORDER row (+${orderRow?.amount ?? 0}) links to /order/track/{id}`, orderRow?.referenceType === 'order' && orderRow.referenceId === orderId && orderRow.amount > 0, JSON.stringify(orderRow));
    const referee = rows.find((x) => x.source === 'REFERRAL_REFEREE');
    check('A2: the invited friend gets the Gelato Roma referral bonus on the first purchase', !!referee && referee.amount > 0, JSON.stringify(rows.map((x) => x.source)));
    const client = session['client@test.com'].token;
    const { myPointTransactions: crow } = await ok(client, 'GetMyPointTransactions', { limit: 50, brandId: romaId });
    check('A2: the referrer gets the bonus too', crow.some((x) => x.source === 'REFERRAL_REFERRER' && x.amount > 0));
    const { myReferralStats } = await ok(client, 'GetMyReferralStats', {});
    check('referral stats: completed, points by brand', myReferralStats.completedReferrals >= 1 && myReferralStats.earnedByBrand.some((b) => b.brandId === romaId && b.points > 0), JSON.stringify(myReferralStats));
    await new Promise((res) => setTimeout(res, 300));
    const { myNotifications } = await ok(client, 'MyNotifications', { limit: 20 });
    const bell = myNotifications.find((n) => n.type === 'REFERRAL_BONUS');
    const data = typeof bell?.data === 'string' ? JSON.parse(bell.data) : bell?.data;
    const route = bell ? routeFromNotification(bell.type, data) : null;
    check('REFERRAL_BONUS bell row routes to My card on Gelato Roma', typeof route === 'string' && route.includes(`brandId=${encodeURIComponent(romaId)}`), JSON.stringify(bell));
    for (const [lng, res] of Object.entries({ en, pl, ua })) {
      const sources = new Set([...rows, ...crow].map((x) => x.source));
      const missing = [...sources].filter((x) => !res.History?.source?.[x]);
      check(`History.source.* (${lng}) covers ${[...sources].join(', ')}`, missing.length === 0, `missing ${missing}`);
    }
  }

  section('Profile and device (UpdateProfile, RegisterDevice, city fallback)');
  {
    const nc = session['nocity@test.com'].token;
    const { cities } = await ok(nc, 'Cities', {});
    const warsaw = cities.find((c) => c.name === 'Warsaw');
    const { myLoyaltyOverview: viaDevice } = await ok(nc, 'LoyaltyOverview', { fallbackCityId: warsaw?.id });
    const m = resolveLoyaltyMode(viaDevice, null, 'ready');
    check('NO_CITY + device city (fallbackCityId) → MANY_TO_DISCOVER in Warsaw', m.kind === 'MANY_TO_DISCOVER' && viaDevice.cityId === warsaw?.id, JSON.stringify(m));
    const healed = await ok(nc, 'UpdateProfile', { data: { preferredCityId: warsaw.id } });
    check('UpdateProfile heals preferredCityId', healed.updateProfile.preferredCityId === warsaw.id);
    const { me, myLoyaltyOverview: after } = await ok(nc, 'LoyaltyOverview', {});
    check('the healed profile city drives the overview', me.preferredCityId === warsaw.id && after.cityId === warsaw.id);

    const lv = session['lviv@test.com'].token;
    const lang = await ok(lv, 'UpdateProfile', { data: { language: 'PL' } });
    check('UpdateProfile language (app → server enum)', lang.updateProfile.language === 'PL');
    await ok(lv, 'UpdateProfile', { data: { language: 'UA' } });
    const dev = await ok(lv, 'RegisterDevice', { token: `smoke-${newRequestId()}`, platform: 'ios', deviceId: `smoke-device-${newRequestId()}`, clientApp: 'client', appVersion: APP_VERSION });
    check('RegisterDevice with clientApp / appVersion', dev.registerFCMToken === true);
  }

  section('Paused brand (super admin pauses Złoty Kłos, then restores it)');
  {
    const admin = await login('superadmin@gelato.com', 'Admin1234', { headers: { 'x-loodly-client': 'admin-web@1.1.0', 'x-loodly-api': '2' }, loginContext: 'ADMIN_WEB' });
    const PAUSE = `mutation SmokePause($brandId: ID!, $input: UpdateBrandPlatformInput!) { updateBrandPlatform(brandId: $brandId, input: $input) { brand { id isActive } } }`;
    const adminHeaders = { 'x-loodly-client': 'admin-web@1.1.0', 'x-loodly-api': '2' };
    const paused = await gql(admin.token, PAUSE, { brandId: klosId, input: { isActive: false } }, adminHeaders);
    check('Złoty Kłos paused', !paused.errors, JSON.stringify(paused.errors));
    try {
      const client = session['client@test.com'].token;
      const { myLoyaltyOverview: o } = await ok(client, 'LoyaltyOverview', {});
      const kw = o.wallets.find((w) => w.brand.id === klosId);
      const mode = resolveLoyaltyMode(o, klosId, 'ready');
      check('client@test.com: paused wallet kept (paused, points saved, sorted last)', !!kw && kw.paused && kw.availablePoints > 0 && o.wallets[o.wallets.length - 1].brand.id === klosId);
      check('client@test.com: MULTI → SINGLE on Gelato Roma, a stored selection of the paused brand is ignored', mode.kind === 'SINGLE' && mode.brandId === romaId, JSON.stringify(mode));
      const { myLoyaltyOverview: lo } = await ok(session['lviv@test.com'].token, 'LoyaltyOverview', {});
      const lm = resolveLoyaltyMode(lo, klosId, 'ready');
      check('lviv@test.com: only brand paused → NO_BRANDS_IN_CITY with the paused wallet listed', lm.kind === 'NO_BRANDS_IN_CITY' && lo.wallets.some((w) => w.paused && w.brand.id === klosId), JSON.stringify(lm));
      const { brand } = await ok(client, 'BrandSummary', { id: klosId });
      check('brand(id) is null for a paused brand (app falls back to the wallet)', brand === null);
      const { prizes } = await ok(client, 'BrandRewards', { brandId: klosId });
      if (prizes.length) {
        const r = await gql(client, D('RedeemPrize'), { prizeId: prizes[0].id, requestId: newRequestId() });
        check('claiming at a paused brand → BRAND_INACTIVE or REWARD_UNAVAILABLE (both explained by the sheet)', ['BRAND_INACTIVE', 'REWARD_UNAVAILABLE'].includes(codeOf(r)), codeOf(r));
      } else {
        check('a paused brand has no claimable catalog', true);
      }
    } finally {
      const back = await gql(admin.token, PAUSE, { brandId: klosId, input: { isActive: true } }, adminHeaders);
      check('Złoty Kłos restored', !back.errors, JSON.stringify(back.errors));
    }
  }
} catch (e) {
  if (e !== Symbol.for('done')) {
    failures.push(`aborted: ${e.stack ?? e}`);
    console.error('✗ aborted:', e);
  }
}

console.log(`\nsmoke: ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log(`  ✗ ${f}`);
process.exit(failures.length ? 1 : 0);
