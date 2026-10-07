#!/usr/bin/env node
/* global __dirname */
/**
 * Verifies the hand-written Code 128B encoder (utils/barcode/code128.ts)
 * against the BRANDS_SPEC §5.4 test vectors and against jsbarcode, which is a
 * devDependency used ONLY here as an oracle (never at runtime).
 *
 *   node scripts/verify-code128.js
 *
 * Needs Node >= 22.18 (built-in TypeScript type stripping).
 */
const assert = require('node:assert/strict');
const path = require('node:path');

// Spec test vectors: checksum value; 156 modules (176 with 10-module quiet zones).
const VECTORS = [
  {
    text: 'GL-ABCD2345',
    checksum: 29,
    bits:
      '110100100001101000100010001101110100110111001010001100010001011000100010001101011000100011001110010110010111001100100111011011100100111001100101100011101011',
  },
  { text: 'GL-ZZZZZZZZ', checksum: 42 },
  { text: 'GL-23456789', checksum: 57 },
];

// Every character the GL-/PR- alphabets can contain, plus a few more of set B.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EXTRA = [
  'PR-WXYZ2345',
  'GL-AAAAAAAA',
  'gl-abcd2345',
  ' !"#$%&\'()*+,-./0123456789:;<=>?@[\\]^_`{|}~',
  'A',
];

function randomCode(prefix, rnd) {
  let s = `${prefix}-`;
  for (let i = 0; i < 8; i += 1) s += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  return s;
}

// Deterministic PRNG (mulberry32) so failures are reproducible.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function oracle(text) {
  let mod;
  try {
    mod = require('jsbarcode/bin/barcodes/CODE128/CODE128B.js');
  } catch {
    return null;
  }
  const CODE128B = mod.default || mod;
  const encoded = new CODE128B(text, {}).encode();
  return encoded.data;
}

(async () => {
  const lib = await import(path.join(__dirname, '..', 'utils', 'barcode', 'code128.ts'));
  const { encodeCode128B, code128BChecksum, layoutCode128, barRuns, QUIET_ZONE_MODULES, isCode128BEncodable } = lib;
  let checks = 0;
  let failed = 0;
  const check = (name, fn) => {
    checks += 1;
    try {
      fn();
    } catch (e) {
      failed += 1;
      console.log(`FAIL  ${name}\n      ${String(e.message).split('\n').join('\n      ')}`);
    }
  };

  // 1. Spec vectors.
  for (const v of VECTORS) {
    check(`vector ${v.text}`, () => {
      const bits = encodeCode128B(v.text);
      assert.equal(code128BChecksum(v.text), v.checksum, 'checksum');
      assert.equal(bits.length, 156, 'module count');
      assert.equal(bits.length + 2 * QUIET_ZONE_MODULES, 176, 'with quiet zones');
      if (v.bits) assert.equal(bits, v.bits, 'module pattern');
    });
  }

  // 2. jsbarcode oracle.
  const probe = oracle('GL-ABCD2345');
  if (probe == null) {
    console.log('SKIP  jsbarcode not installed (npm i -D jsbarcode) — oracle checks skipped');
  } else {
    const rnd = mulberry32(20261007);
    const inputs = [...VECTORS.map((v) => v.text), ...EXTRA];
    for (let i = 0; i < 500; i += 1) inputs.push(randomCode(i % 2 ? 'GL' : 'PR', rnd));
    for (const text of inputs) {
      check(`oracle ${JSON.stringify(text)}`, () => assert.equal(encodeCode128B(text), oracle(text)));
    }
  }

  // 3. Input guard.
  check('rejects non set-B input', () => {
    assert.equal(isCode128BEncodable('GL-ĄBCD2345'), false);
    assert.equal(isCode128BEncodable(''), false);
    assert.throws(() => encodeCode128B('\n'));
  });

  // 4. Bars: runs cover exactly the '1' modules; symbol starts and ends with a bar.
  check('bar runs', () => {
    const bits = encodeCode128B('GL-ABCD2345');
    const runs = barRuns(bits);
    const rebuilt = Array.from({ length: bits.length }, () => '0');
    for (const [start, width] of runs) for (let i = start; i < start + width; i += 1) rebuilt[i] = '1';
    assert.equal(rebuilt.join(''), bits);
    assert.equal(bits[0], '1');
    assert.equal(bits.endsWith('11'), true, 'STOP ends with a 2-module bar');
  });

  // 5. Pixel snapping and the < 2 px fallback.
  check('layout snapping', () => {
    // 295 pt card at 3x: floor(885 / 176) = 5 px per module.
    const l3 = layoutCode128(156, 295, 3);
    assert.deepEqual(l3 && { px: l3.modulePx, width: l3.widthPt }, { px: 5, width: (176 * 5) / 3 });
    // 2x: floor(590 / 176) = 3 px.
    assert.equal(layoutCode128(156, 295, 2).modulePx, 3);
    // 1x: floor(295 / 176) = 1 px → too small → null (fall back to QR).
    assert.equal(layoutCode128(156, 295, 1), null);
    // Non-integer ratios still give whole device pixels.
    const l = layoutCode128(156, 330, 2.625);
    assert.equal(Number.isInteger(l.modulePx), true);
    assert.equal(Math.abs(l.widthPt * 2.625 - Math.round(l.widthPt * 2.625)) < 1e-9, true);
    assert.equal(l.widthPt <= 330, true);
  });

  console.log(`\n${checks - failed}/${checks} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
