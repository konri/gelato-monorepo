#!/usr/bin/env node
/**
 * i18n parity (BRANDS_SPEC §5.8): en / pl / ua must have the same keys, every
 * plural key must carry the forms its language needs (en: one/other; pl and
 * ua: one/few/many/other), the same {{placeholders}} in every language, and
 * every literal `t('Namespace.key')` in the app must exist.
 *
 *   node scripts/check-i18n.mjs        (Node ≥ 22.18: imports the .ts resources)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (lng) => (await import(join(ROOT, 'translations/resources', `${lng}.ts`))).default;
const langs = { en: await load('en'), pl: await load('pl'), ua: await load('ua') };

const PLURAL_FORMS = { en: ['one', 'other'], pl: ['one', 'few', 'many', 'other'], ua: ['one', 'few', 'many', 'other'] };
const SUFFIX = /_(zero|one|two|few|many|other)$/;

const flat = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)]],
  );

const problems = [];
const info = {};
/** base key → { lng → { forms:Set, placeholders:Set } } */
const table = new Map();
for (const [lng, res] of Object.entries(langs)) {
  const entries = flat(res);
  info[lng] = entries.length;
  for (const [key, value] of entries) {
    const m = key.match(SUFFIX);
    const base = m ? key.slice(0, -m[0].length) : key;
    const row = table.get(base) ?? {};
    const cell = (row[lng] ??= { forms: new Set(), placeholders: new Set(), plain: false });
    if (m) cell.forms.add(m[1]);
    else cell.plain = true;
    for (const p of value.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) cell.placeholders.add(p[1]);
    table.set(base, row);
  }
}

let plurals = 0;
for (const [base, row] of table) {
  const missingIn = Object.keys(langs).filter((l) => !row[l]);
  if (missingIn.length) {
    problems.push(`missing in ${missingIn.join(', ')}: ${base}`);
    continue;
  }
  const isPlural = Object.values(row).some((c) => c.forms.size > 0);
  if (isPlural) {
    plurals++;
    for (const [lng, need] of Object.entries(PLURAL_FORMS)) {
      const lacks = need.filter((f) => !row[lng].forms.has(f));
      if (lacks.length) problems.push(`plural ${base} (${lng}) lacks _${lacks.join(', _')}`);
    }
  }
  const sets = Object.entries(row).map(([l, c]) => [l, [...c.placeholders].sort().join(',')]);
  // `count` may be implicit in a language's wording (e.g. "один бал"), so it is not compared.
  const strip = (s) => s.split(',').filter((p) => p && p !== 'count').join(',');
  if (new Set(sets.map(([, s]) => strip(s))).size > 1) {
    problems.push(`placeholders differ for ${base}: ${sets.map(([l, s]) => `${l}{${s}}`).join(' ')}`);
  }
}

// Literal keys used in code.
const SKIP = new Set(['node_modules', '.expo', 'dist', 'ios', 'android', 'scripts', 'translations', '.git']);
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) return SKIP.has(n) ? [] : walk(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
const namespaces = new Set(Object.keys(langs.en));
const used = new Map();
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*['"`]([A-Za-z][\w]*(?:\.[\w]+)+)['"`]/g)) {
    if (namespaces.has(m[1].split('.')[0])) used.set(m[1], relative(ROOT, file));
  }
}
const isBranch = (key) => [...table.keys()].some((k) => k.startsWith(key + '.'));
let missingUsed = 0;
for (const [key, file] of [...used].sort()) {
  if (!table.has(key) && !isBranch(key)) {
    missingUsed++;
    problems.push(`used but not defined: ${key} ← ${file}`);
  }
}

for (const p of problems) console.log('✗ ' + p);
console.log(
  `keys en ${info.en} / pl ${info.pl} / ua ${info.ua}; ${table.size} base keys, ${plurals} plural; ` +
    `${used.size} literal keys used in code (${missingUsed} undefined); ${problems.length} problem(s)`,
);
process.exit(problems.length ? 1 : 0);
