#!/usr/bin/env node
/* global __dirname */
/**
 * "Logout, then a second user" (BRANDS_SPEC §5.10, review #1): no data of
 * user A may reach user B's session on the same device.
 *
 *   node scripts/test-session-isolation.js
 *
 * Unit part (this script, Node >= 22.18 for TypeScript type stripping): the
 * guard every live points update passes before the BrandProvider patches a
 * wallet or the points toast fires (`isLiveUpdateFor`), and the userId the
 * socket forwards through `emitPointsUpdated`.
 *
 * Manual part (device or simulator, two seed personas, e.g. client@test.com
 * and single@test.com from loodly-be prisma/seed.ts):
 *   1. Log in as A. Open My card (code A visible). Settings → Log out.
 *   2. On /welcome press Android back (or swipe back on iOS): the app must
 *      leave / stay on /welcome. My card of A must NOT appear.
 *   3. From the spot app, award points to A. On this device: no toast, no
 *      push (removeFCMToken ran on logout; the points socket is closed).
 *   4. Log in as B. My card shows B's code and B's wallets only. Award points
 *      to A again: still nothing on B's screen. Award points to B: toast and
 *      count-up on B's card.
 *   5. Repeat 1–4 with a session EXPIRY instead of a logout (revoke A's
 *      refresh token on the server): /welcome offers "Show my card" with A's
 *      code (by design), and after B logs in nothing of A remains.
 */
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const events = await import(path.join(__dirname, '..', 'shared', 'api-client', 'src', 'pointsEvents.ts'));
  const { isLiveUpdateFor, onPointsUpdated, emitPointsUpdated } = events;

  const update = (userId, extra = {}) => ({
    userId,
    availablePoints: 50,
    totalPoints: 50,
    change: 50,
    brandId: 'roma',
    brandName: 'Gelato Roma',
    source: 'STAFF_TEMPLATE',
    ...extra,
  });

  // A tiny model of the BrandProvider's handling: who is logged in, and what
  // reached the screen (wallet patch + toast).
  const session = { userId: null, applied: [] };
  const unsubscribe = onPointsUpdated((u) => {
    if (isLiveUpdateFor(u, session.userId)) session.applied.push(`${u.userId}:${u.change}`);
  });

  let failed = 0;
  const step = (name, fn) => {
    try {
      fn();
      console.log(`ok    ${name}`);
    } catch (e) {
      failed += 1;
      console.log(`FAIL  ${name}\n      ${e.message.split('\n').join('\n      ')}`);
    }
  };

  step('before the user is known, nothing is applied', () => {
    emitPointsUpdated(update('A'));
    assert.deepEqual(session.applied, []);
  });

  step('user A logged in: A\'s update is applied and keeps its userId', () => {
    session.userId = 'A';
    emitPointsUpdated(update('A'));
    assert.deepEqual(session.applied, ['A:50']);
  });

  step('logout (provider reset): a late update of A is dropped', () => {
    session.userId = null;
    session.applied = [];
    emitPointsUpdated(update('A', { change: 7 }));
    assert.deepEqual(session.applied, []);
  });

  step('user B logged in: A\'s stale socket cannot reach B', () => {
    session.userId = 'B';
    emitPointsUpdated(update('A', { change: 9 }));
    assert.deepEqual(session.applied, []);
  });

  step('user B: an update without a userId is dropped', () => {
    emitPointsUpdated(update(undefined, { change: 3 }));
    emitPointsUpdated(update(null, { change: 4 }));
    assert.deepEqual(session.applied, []);
  });

  step('user B: B\'s own update is applied', () => {
    emitPointsUpdated(update('B', { change: 20 }));
    assert.deepEqual(session.applied, ['B:20']);
  });

  step('isLiveUpdateFor truth table', () => {
    assert.equal(isLiveUpdateFor({ userId: 'A' }, 'A'), true);
    assert.equal(isLiveUpdateFor({ userId: 'A' }, 'B'), false);
    assert.equal(isLiveUpdateFor({ userId: 'A' }, null), false);
    assert.equal(isLiveUpdateFor({ userId: 'A' }, undefined), false);
    assert.equal(isLiveUpdateFor({}, 'A'), false);
    assert.equal(isLiveUpdateFor({ userId: '' }, ''), false);
  });

  unsubscribe();
  const total = 7;
  console.log(`\n${total - failed}/${total} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
