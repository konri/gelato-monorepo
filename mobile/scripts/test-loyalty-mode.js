#!/usr/bin/env node
/* global __dirname */
/**
 * Unit tests for utils/loyaltyMode.ts (BRANDS_SPEC §5.3 decision table).
 *
 *   node scripts/test-loyalty-mode.js
 *
 * Needs Node >= 22.18 (built-in TypeScript type stripping); the module under
 * test has type-only imports, so nothing else is loaded.
 */
const assert = require('node:assert/strict');
const path = require('node:path');

// Fixed clock: recency (90 days) is computed against it.
const NOW = Date.parse('2026-10-07T12:00:00Z');
const daysAgo = (d) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

const wallet = (id, points = 0, extra = {}) => ({
  brand: { id },
  paused: false,
  availablePoints: points,
  readyToPickUpCount: 0,
  ...extra,
});

const overview = (wallets, extra = {}) => ({
  cityId: 'waw',
  defaultBrandId: null,
  showRewardsPicker: false,
  wallets,
  ...extra,
});

const cases = [
  // [name, overview, selected, status, expected]
  ['no data, loading', null, null, 'loading', { kind: 'LOADING' }],
  ['no data, idle', null, null, 'idle', { kind: 'LOADING' }],
  ['no data, error', null, null, 'error', { kind: 'ERROR' }],
  ['data wins over error status', overview([wallet('a', 10)]), null, 'error', { kind: 'SINGLE', brandId: 'a' }],

  ['E=0, no city', overview([], { cityId: null }), null, 'ready', { kind: 'NO_CITY' }],
  ['E=0, city without brands', overview([]), null, 'ready', { kind: 'NO_BRANDS_IN_CITY', cityId: 'waw' }],

  // E = 0 is decided by the user's CITY (lead decision, review #11).
  [
    'E=0, the city has one brand (the server default): one to discover',
    overview([wallet('a', 0, { inMyCity: true })], { defaultBrandId: 'a' }),
    null,
    'ready',
    { kind: 'ONE_TO_DISCOVER', brandId: 'a' },
  ],
  [
    'E=0, the city has one brand and no default brand: still that brand',
    overview([wallet('a', 0, { inMyCity: true })]),
    null,
    'ready',
    { kind: 'ONE_TO_DISCOVER', brandId: 'a' },
  ],
  [
    'E=0, the city has one brand, visited there recently: one to discover',
    overview([wallet('a', 0, { inMyCity: true, hasWallet: true, lastActivityAt: daysAgo(3) })], { defaultBrandId: 'a' }),
    null,
    'ready',
    { kind: 'ONE_TO_DISCOVER', brandId: 'a' },
  ],
  [
    'E=0, the city has one brand, but the recent default brand is elsewhere: many (Your places + city)',
    overview(
      [
        wallet('far', 0, { hasWallet: true, lastActivityAt: daysAgo(5) }),
        wallet('a', 0, { inMyCity: true }),
      ],
      { defaultBrandId: 'far' },
    ),
    null,
    'ready',
    { kind: 'MANY_TO_DISCOVER', cityId: 'waw' },
  ],
  [
    'E=0, the city has one brand (default) and another brand was visited 10 days ago: many',
    overview(
      [
        wallet('a', 0, { inMyCity: true, hasWallet: true, lastActivityAt: daysAgo(1) }),
        wallet('far', 0, { hasWallet: true, lastActivityAt: daysAgo(10) }),
      ],
      { defaultBrandId: 'a' },
    ),
    null,
    'ready',
    { kind: 'MANY_TO_DISCOVER', cityId: 'waw' },
  ],
  [
    'E=0, the city has one brand; a brand elsewhere visited 200 days ago is not recent: one',
    overview(
      [wallet('a', 0, { inMyCity: true }), wallet('old', 0, { hasWallet: true, lastActivityAt: daysAgo(200) })],
      { defaultBrandId: 'a' },
    ),
    null,
    'ready',
    { kind: 'ONE_TO_DISCOVER', brandId: 'a' },
  ],
  [
    'E=0, the city has one brand; a paused recent brand elsewhere does not count: one',
    overview(
      [wallet('a', 0, { inMyCity: true }), wallet('p', 0, { paused: true, hasWallet: true, lastActivityAt: daysAgo(2) })],
      { defaultBrandId: 'a' },
    ),
    null,
    'ready',
    { kind: 'ONE_TO_DISCOVER', brandId: 'a' },
  ],
  [
    'E=0, no brand in the city but a recent brand elsewhere: many, not one to discover',
    overview([wallet('far', 0, { hasWallet: true, lastActivityAt: daysAgo(20) })], { defaultBrandId: 'far' }),
    null,
    'ready',
    { kind: 'MANY_TO_DISCOVER', cityId: 'waw' },
  ],
  [
    'E=0, no city but a recent brand: many without a city (Your places only)',
    overview([wallet('far', 0, { hasWallet: true, lastActivityAt: daysAgo(20) })], { defaultBrandId: 'far', cityId: null }),
    null,
    'ready',
    { kind: 'MANY_TO_DISCOVER', cityId: null },
  ],
  [
    'E=0, no city: inMyCity flags are ignored',
    overview([wallet('a', 0, { inMyCity: true }), wallet('b', 0, { inMyCity: true })], { cityId: null }),
    null,
    'ready',
    { kind: 'NO_CITY' },
  ],
  [
    'E=0, two brands in the city',
    overview([wallet('a', 0, { inMyCity: true }), wallet('b', 0, { inMyCity: true })], {
      defaultBrandId: 'a',
      showRewardsPicker: true,
    }),
    null,
    'ready',
    { kind: 'MANY_TO_DISCOVER', cityId: 'waw' },
  ],
  [
    'E=0, two brands in the city, one of them paused: one',
    overview([wallet('a', 0, { inMyCity: true }), wallet('b', 0, { inMyCity: true, paused: true })], {
      defaultBrandId: 'a',
    }),
    null,
    'ready',
    { kind: 'ONE_TO_DISCOVER', brandId: 'a' },
  ],
  [
    'E=0, paused wallet with points does not count',
    overview([wallet('a', 500, { paused: true })]),
    null,
    'ready',
    { kind: 'NO_BRANDS_IN_CITY', cityId: 'waw' },
  ],

  ['E=1 by points', overview([wallet('a', 10), wallet('b', 0)]), null, 'ready', { kind: 'SINGLE', brandId: 'a' }],
  [
    'E=1 by a reward to pick up (0 points)',
    overview([wallet('a', 0, { readyToPickUpCount: 1 }), wallet('b', 0)]),
    null,
    'ready',
    { kind: 'SINGLE', brandId: 'a' },
  ],
  [
    'E=1 ignores the persisted selection of another brand',
    overview([wallet('a', 10), wallet('b', 0)]),
    'b',
    'ready',
    { kind: 'SINGLE', brandId: 'a' },
  ],
  [
    'E=1 with a paused second wallet',
    overview([wallet('a', 10), wallet('b', 99, { paused: true })]),
    'b',
    'ready',
    { kind: 'SINGLE', brandId: 'a' },
  ],

  [
    'E=2, valid persisted selection',
    overview([wallet('a', 10), wallet('b', 5)], { defaultBrandId: 'a' }),
    'b',
    'ready',
    { kind: 'MULTI', brandId: 'b' },
  ],
  [
    'E=2, a 0-point brand from the list can stay selected',
    overview([wallet('a', 10), wallet('b', 5), wallet('c', 0)], { defaultBrandId: 'a' }),
    'c',
    'ready',
    { kind: 'MULTI', brandId: 'c' },
  ],
  [
    'E=2, stale selection falls back to defaultBrandId',
    overview([wallet('a', 10), wallet('b', 5)], { defaultBrandId: 'b' }),
    'gone',
    'ready',
    { kind: 'MULTI', brandId: 'b' },
  ],
  [
    'E=2, paused selection falls back to defaultBrandId',
    overview([wallet('a', 10), wallet('b', 5), wallet('p', 50, { paused: true })], { defaultBrandId: 'a' }),
    'p',
    'ready',
    { kind: 'MULTI', brandId: 'a' },
  ],
  [
    'E=2, no selection and no default: first engaged in server order',
    overview([wallet('x', 0), wallet('a', 10), wallet('b', 5)]),
    null,
    'ready',
    { kind: 'MULTI', brandId: 'a' },
  ],
  [
    'E=3 while loading keeps the last data',
    overview([wallet('a', 1), wallet('b', 1), wallet('c', 1)], { defaultBrandId: 'c' }),
    null,
    'loading',
    { kind: 'MULTI', brandId: 'c' },
  ],
];

(async () => {
  const mod = await import(path.join(__dirname, '..', 'utils', 'loyaltyMode.ts'));
  const { resolveLoyaltyMode, isEngaged, modeBrandId, yourPlaces } = mod;
  let failed = 0;
  for (const [name, o, selected, status, expected] of cases) {
    try {
      assert.deepEqual(resolveLoyaltyMode(o, selected, status, NOW), expected);
      console.log(`ok    ${name}`);
    } catch (e) {
      failed += 1;
      console.log(`FAIL  ${name}\n      ${e.message.split('\n').join('\n      ')}`);
    }
  }

  // Helpers.
  try {
    assert.equal(isEngaged(wallet('a', 0)), false);
    assert.equal(isEngaged(wallet('a', 1)), true);
    assert.equal(isEngaged(wallet('a', 0, { readyToPickUpCount: 2 })), true);
    assert.equal(isEngaged(wallet('a', 5, { paused: true })), false);
    assert.equal(modeBrandId({ kind: 'MULTI', brandId: 'x' }), 'x');
    assert.equal(modeBrandId({ kind: 'ONE_TO_DISCOVER', brandId: 'y' }), 'y');
    assert.equal(modeBrandId({ kind: 'MANY_TO_DISCOVER', cityId: 'waw' }), null);
    console.log('ok    helpers');
  } catch (e) {
    failed += 1;
    console.log(`FAIL  helpers\n      ${e.message}`);
  }

  // "Your places" of the discovery list: the recent default brand first, then
  // the user's other active wallets in server order; paused ones never.
  try {
    const o = overview(
      [
        wallet('mine-in-city', 0, { inMyCity: true, hasWallet: true }),
        wallet('city-new', 0, { inMyCity: true }),
        wallet('paused', 0, { paused: true, hasWallet: true, lastActivityAt: daysAgo(1) }),
        wallet('far', 0, { hasWallet: true, lastActivityAt: daysAgo(4) }),
      ],
      { defaultBrandId: 'far' },
    );
    assert.deepEqual(
      yourPlaces(o, NOW).map((w) => w.brand.id),
      ['far', 'mine-in-city'],
    );
    console.log('ok    yourPlaces');
  } catch (e) {
    failed += 1;
    console.log(`FAIL  yourPlaces\n      ${e.message}`);
  }

  const total = cases.length + 2;
  console.log(`\n${total - failed}/${total} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
