#!/usr/bin/env node
/**
 * Validates every live GraphQL document of the app against the backend schema
 * (BRANDS_SPEC §5.10). Document discovery and liveness: scripts/graphql-docs.mjs.
 *
 *   node scripts/check-graphql.mjs [path/to/schema.gql] [--verbose]
 *
 * Schema path: first argument, else $LOODLY_SCHEMA, else ../loodly-be/schema.gql.
 * Exit 1 when a live document does not validate; dead (merchant-era) documents
 * are listed but do not fail the check.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { loadAppDocuments, ROOT } from './graphql-docs.mjs';

const require = createRequire(join(ROOT, 'package.json'));
const { buildSchema, parse, validate } = require('graphql');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const schemaArg = args.find((a) => !a.startsWith('--'));
const schemaPath = resolve(
  schemaArg ?? process.env.LOODLY_SCHEMA ?? resolve(ROOT, '../loodly-be/schema.gql'),
);
if (!existsSync(schemaPath)) {
  console.error(`Schema not found: ${schemaPath}\nUsage: node scripts/check-graphql.mjs <path/to/schema.gql>`);
  process.exit(2);
}
const schema = buildSchema(readFileSync(schemaPath, 'utf8'));

/** Live operations that were already broken before the brands work (not counted as failures). */
const KNOWN_BROKEN = {
  SendContactMessage: 'pre-existing: the backend has never had sendContactMessage (Settings → contact form)',
};

const results = loadAppDocuments().map((d) => ({
  ...d,
  ops: d.ops.join(',') || d.owner || '?',
  errors: d.error ? [d.error] : validate(schema, parse(d.text)).map((e) => e.message),
}));

const known = results.filter((r) => r.live && r.errors.length && KNOWN_BROKEN[r.ops]);
const liveBad = results.filter((r) => r.live && r.errors.length && !KNOWN_BROKEN[r.ops]);
const liveOk = results.filter((r) => r.live && !r.errors.length);
const deadBad = results.filter((r) => !r.live && r.errors.length);
const deadOk = results.filter((r) => !r.live && !r.errors.length);

const line = (r) => `${r.rel} ${r.ops}${r.owner && r.owner !== r.ops ? ` (${r.owner})` : ''}`;
for (const r of liveBad) {
  console.error(`✗ LIVE ${line(r)}`);
  for (const e of r.errors) console.error(`    ${e}`);
}
if (verbose) {
  for (const r of liveOk) console.log(`✓ LIVE ${line(r)}`);
  for (const r of deadOk) console.log(`· dead ${line(r)} (valid)`);
}
for (const r of known) console.log(`! LIVE ${line(r)}: ${r.errors[0]} (known: ${KNOWN_BROKEN[r.ops]})`);
if (deadBad.length) {
  console.log(`Dead documents (no screen reaches them; not counted as failures): ${deadBad.length}`);
  for (const r of deadBad) console.log(`  · ${line(r)}: ${r.errors[0]}`);
}
console.log(
  `${liveOk.length}/${liveOk.length + liveBad.length} live documents valid against ${schemaPath}` +
    (known.length ? ` (+${known.length} known pre-existing breakage)` : '') +
    ` (${deadOk.length + deadBad.length} dead: ${deadOk.length} valid, ${deadBad.length} invalid)`,
);
process.exit(liveBad.length > 0 ? 1 : 0);
