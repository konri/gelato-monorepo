#!/usr/bin/env node
/**
 * i18n checks for the landing (`npm run check:i18n`, alias `check:locales`).
 *
 * Errors (exit 1):
 *  1. Parity: every namespace (`common.json`, `business.json`) has exactly the
 *     same flattened key set in pl, en and ua, with the same value types.
 *  2. Placeholders: `{{name}}` tokens match across locales for every key.
 *  3. Shadowing: `common.json` must not have a top-level `business` key
 *     (`I18nNamespace name="business"` serves `business.*` from business.json
 *     on /for-business, which would hide it there).
 *  4. Usage: every literal `t("a.b.c")` key in app code resolves to a string
 *     in every locale (plural keys `_one/_few/_many` count), and every
 *     template key `t(`a.b.${x}`)` has an existing object at its static
 *     prefix. Files owned by the account/checkout/auth task are reported as
 *     warnings only, because this task must not touch them.
 *
 * Warnings: empty strings, and values identical to PL in en/ua (possible
 * untranslated copy), limited to the business namespace and new landing keys.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["pl", "en", "ua"];
const NAMESPACES = ["common", "business"];
const PROTECTED = [
  "app/account/",
  "app/components/account/",
  "app/checkout/",
  "app/components/checkout/",
  "app/auth/",
  "app/components/auth/",
  "app/lib/account-api.ts",
];

const errors = [];
const warnings = [];

function load(locale, ns) {
  const file = join(ROOT, "public/locales", locale, `${ns}.json`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`${locale}/${ns}.json: cannot read or parse (${e.message})`);
    return {};
  }
}

function kind(v) {
  if (Array.isArray(v)) return "array";
  if (v === null) return "null";
  return typeof v;
}

/** Flatten to Map<path, value> with leaf values only (strings, numbers, arrays). */
function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out);
    else out.set(path, v);
  }
  return out;
}

const placeholders = (s) =>
  typeof s === "string" ? [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(",") : "";

// ---------------------------------------------------------------- parity
const dicts = {}; // dicts[locale] = { ...common, business }
const counts = {};
for (const ns of NAMESPACES) {
  const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l, ns))]));
  const union = new Set(LOCALES.flatMap((l) => [...flat[l].keys()]));
  counts[ns] = { union: union.size, ...Object.fromEntries(LOCALES.map((l) => [l, flat[l].size])) };

  for (const key of [...union].sort()) {
    const present = LOCALES.filter((l) => flat[l].has(key));
    const missing = LOCALES.filter((l) => !flat[l].has(key));
    if (missing.length) {
      errors.push(`${ns}: "${key}" missing in ${missing.join(", ")} (present in ${present.join(", ")})`);
      continue;
    }
    const kinds = new Set(LOCALES.map((l) => kind(flat[l].get(key))));
    if (kinds.size > 1) {
      errors.push(`${ns}: "${key}" has different types: ${LOCALES.map((l) => `${l}=${kind(flat[l].get(key))}`).join(", ")}`);
      continue;
    }
    const ph = new Set(LOCALES.map((l) => placeholders(flat[l].get(key))));
    if (ph.size > 1) {
      errors.push(`${ns}: "${key}" placeholders differ: ${LOCALES.map((l) => `${l}={${placeholders(flat[l].get(key))}}`).join(" ")}`);
    }
    for (const l of LOCALES) {
      const v = flat[l].get(key);
      if (typeof v === "string" && v.trim() === "") warnings.push(`${ns}: "${key}" is empty in ${l}`);
    }
    if (ns === "business") {
      const pl = flat.pl.get(key);
      for (const l of ["en", "ua"]) {
        const v = flat[l].get(key);
        if (typeof v === "string" && v === pl && /[a-ząćęłńóśźż]{4,}/i.test(v) && !/^(Loodly|BLIK)/.test(v)) {
          warnings.push(`${ns}: "${key}" in ${l} is identical to pl ("${v.slice(0, 40)}")`);
        }
      }
    }
  }

  for (const l of LOCALES) {
    dicts[l] ??= {};
    const data = load(l, ns);
    if (ns === "common") {
      if (Object.prototype.hasOwnProperty.call(data, "business")) {
        errors.push(`${l}/common.json has a top-level "business" key; it is shadowed by business.json`);
      }
      Object.assign(dicts[l], data);
    } else {
      dicts[l][ns] = data;
    }
  }
}

// ---------------------------------------------------------------- usage
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

const get = (obj, path) =>
  path.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), obj);

function resolves(locale, key) {
  if (typeof get(dicts[locale], key) === "string") return true;
  return ["one", "few", "many"].every((c) => typeof get(dicts[locale], `${key}_${c}`) === "string");
}

let literalUses = 0;
let templateUses = 0;
const files = walk(join(ROOT, "app"));
for (const file of files) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, "utf8");
  const isProtected = PROTECTED.some((p) => rel.startsWith(p));
  const report = (msg) => (isProtected ? warnings : errors).push(`${rel}: ${msg}${isProtected ? " (protected file)" : ""}`);

  // t("key") / t('key') / translate("key", …) — literal keys.
  for (const m of src.matchAll(/\b(?:t|translate)\(\s*(["'])([a-z][\w-]*(?:\.[\w-]+)+)\1/g)) {
    literalUses++;
    const key = m[2];
    const bad = LOCALES.filter((l) => !resolves(l, key));
    if (bad.length) report(`t("${key}") does not resolve in ${bad.join(", ")}`);
  }
  // t(`prefix.${x}…`) — check the static prefix is an object in every locale.
  // `a.b.${x}` → object `a.b` must exist; `a.b.q${n}` → object `a.b` must have a key starting with "q".
  for (const m of src.matchAll(/\b(?:t|translate)\(\s*`([a-z][\w.-]*?)\$\{/g)) {
    templateUses++;
    const raw = m[1];
    const dot = raw.lastIndexOf(".");
    const parent = raw.endsWith(".") ? raw.slice(0, -1) : raw.slice(0, dot);
    const partial = raw.endsWith(".") ? "" : raw.slice(dot + 1);
    const bad = LOCALES.filter((l) => {
      const v = get(dicts[l], parent);
      if (!v || typeof v !== "object") return true;
      return partial ? !Object.keys(v).some((k) => k.startsWith(partial)) : false;
    });
    if (bad.length) report(`t(\`${raw}\${…}\`) has no matching keys in ${bad.join(", ")}`);
  }
}

// ---------------------------------------------------------------- report
for (const ns of NAMESPACES) {
  const c = counts[ns];
  console.log(`${ns}.json  keys: pl ${c.pl}, en ${c.en}, ua ${c.ua} (union ${c.union})`);
}
console.log(`usage: ${literalUses} literal t() keys, ${templateUses} template keys in ${files.length} files`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("\n✓ i18n OK");
