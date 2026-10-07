#!/usr/bin/env node
/**
 * Validates every GraphQL document of the spot app against the backend schema
 * (BRANDS_SPEC §4.10, `npm run check:graphql`).
 *
 * Schema path: first CLI argument, else $LOODLY_SCHEMA, else ../loodly-be/schema.gql.
 *
 * Documents are found with the TypeScript parser (no bundler needed):
 *   - every gql`…` / graphql`…` template, and
 *   - every untagged string or template that is a GraphQL operation or fragment
 *     (e.g. the raw refresh-token mutation and the realtime subscriptions).
 * `${NAME}` interpolations (shared fragments) are resolved the way the app sends
 * them: from a constant of the same file, else from the module it is imported
 * from (`@/…`, `@repo/api-client` and relative paths). Fragment-only documents
 * are checked as part of the operations that use them, and on their own
 * (without the "unused fragment" rule).
 *
 * Exit code: 0 when every document is valid, 1 otherwise, 2 for a missing schema.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { buildSchema, parse, validate, specifiedRules, NoUnusedFragmentsRule, Kind } = require('graphql');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = resolve(process.argv[2] ?? process.env.LOODLY_SCHEMA ?? resolve(root, '../loodly-be/schema.gql'));

if (!existsSync(schemaPath)) {
  console.error(`Schema not found: ${schemaPath}\nPass the path: npm run check:graphql -- <path/to/schema.gql>`);
  process.exit(2);
}

const schema = buildSchema(readFileSync(schemaPath, 'utf8'));

const SKIP_DIRS = new Set(['node_modules', 'ios', 'android', 'dist', 'build', 'web-build', 'scripts']);
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (EXTENSIONS.some((e) => entry.name.endsWith(e)) && !entry.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

/** Resolves an import specifier to a file of the app (or null for packages). */
function resolveImport(fromFile, spec) {
  let base;
  if (spec === '@repo/api-client') base = join(root, 'shared/api-client');
  else if (spec.startsWith('@/')) base = join(root, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
  else return null;
  for (const candidate of [base, ...EXTENSIONS.map((e) => base + e), ...EXTENSIONS.map((e) => join(base, 'index' + e))]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Per file: constants (name → initializer), imports (local name → {file, name}), document candidates. */
const modules = new Map();

function loadModule(file) {
  if (modules.has(file)) return modules.get(file);
  const text = readFileSync(file, 'utf8');
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const mod = { file, sf, consts: new Map(), imports: new Map(), reexports: [], candidates: [] };
  modules.set(file, mod);

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = resolveImport(file, node.moduleSpecifier.text);
      const named = node.importClause?.namedBindings;
      if (target && named && ts.isNamedImports(named)) {
        for (const el of named.elements) {
          mod.imports.set(el.name.text, { file: target, name: (el.propertyName ?? el.name).text });
        }
      }
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = resolveImport(file, node.moduleSpecifier.text);
      if (target) mod.reexports.push(target);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (!mod.consts.has(node.name.text)) mod.consts.set(node.name.text, node.initializer);
    }
    if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && /^(gql|graphql)$/.test(node.tag.text)) {
      mod.candidates.push({ node: node.template, tagged: true });
      return; // its template is not a separate candidate
    }
    if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node) || ts.isStringLiteral(node)) {
      if (!ts.isTaggedTemplateExpression(node.parent) && !ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) {
        const head = ts.isTemplateExpression(node) ? node.head.text : node.text;
        if (/^\s*(#[^\n]*\n\s*)*((query|mutation|subscription)\b[^]*\{|fragment\s+\w+\s+on\s+\w+)/.test(head)) {
          mod.candidates.push({ node, tagged: false });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return mod;
}

/** The constant `name` as seen from `mod` (same file, an import, or a re-export). */
function lookup(mod, name, seen = new Set()) {
  const key = `${mod.file}#${name}`;
  if (seen.has(key)) return null;
  seen.add(key);
  if (mod.consts.has(name)) return { mod, node: mod.consts.get(name) };
  const imp = mod.imports.get(name);
  if (imp) return lookup(loadModule(imp.file), imp.name, seen);
  for (const target of mod.reexports) {
    const hit = lookup(loadModule(target), name, seen);
    if (hit) return hit;
  }
  return null;
}

/** The text the app sends for a literal, with `${…}` interpolations resolved. */
function textOf(mod, node, stack = []) {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node))) node = node.expression;
  if (!node) throw new Error('empty expression');
  if (ts.isTaggedTemplateExpression(node)) return textOf(mod, node.template, stack);
  if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      out += textOf(mod, span.expression, stack) + span.literal.text;
    }
    return out;
  }
  if (ts.isIdentifier(node)) {
    const hit = lookup(mod, node.text);
    if (!hit) throw new Error(`cannot resolve \${${node.text}}`);
    const key = `${hit.mod.file}#${node.text}`;
    if (stack.includes(key)) throw new Error(`circular interpolation of ${node.text}`);
    return textOf(hit.mod, hit.node, [...stack, key]);
  }
  throw new Error(`unsupported interpolation: ${node.getText()}`);
}

/** graphql-tag drops repeated fragment definitions; do the same before validating. */
function dedupeFragments(doc) {
  const seen = new Set();
  return {
    ...doc,
    definitions: doc.definitions.filter((d) => {
      if (d.kind !== Kind.FRAGMENT_DEFINITION) return true;
      if (seen.has(d.name.value)) return false;
      seen.add(d.name.value);
      return true;
    }),
  };
}

const files = walk(root).sort();
for (const f of files) loadModule(f);

const fragmentRules = specifiedRules.filter((r) => r !== NoUnusedFragmentsRule);
const operationNames = new Map();
let checked = 0;
let failed = 0;
const warnings = [];

for (const file of files) {
  const mod = modules.get(file);
  for (const { node } of mod.candidates) {
    const { line } = mod.sf.getLineAndCharacterOfPosition(node.getStart());
    const where = `${relative(root, file)}:${line + 1}`;
    const messages = [];
    let label = '';
    try {
      const text = textOf(mod, node);
      const doc = dedupeFragments(parse(text));
      const ops = doc.definitions.filter((d) => d.kind === Kind.OPERATION_DEFINITION);
      label = ops.map((o) => o.name?.value ?? '(anonymous)').join(', ') || doc.definitions.map((d) => `fragment ${d.name?.value}`).join(', ');
      const rules = ops.length > 0 ? specifiedRules : fragmentRules;
      for (const e of validate(schema, doc, rules)) messages.push(e.message);
      for (const op of ops) {
        if (!op.name) {
          messages.push('Anonymous operation (give it a name).');
          continue;
        }
        const prev = operationNames.get(op.name.value);
        if (prev && prev.text !== text) warnings.push(`operation name ${op.name.value} is used by ${prev.where} and ${where}`);
        else if (!prev) operationNames.set(op.name.value, { where, text });
      }
    } catch (e) {
      messages.push(e instanceof Error ? e.message : String(e));
    }
    checked++;
    if (messages.length > 0) {
      failed++;
      console.error(`✗ ${where} ${label}`);
      for (const m of messages) console.error(`    ${m}`);
    }
  }
}

for (const w of warnings) console.warn(`! ${w}`);
console.log(`${checked - failed}/${checked} GraphQL documents valid against ${schemaPath}`);
process.exit(failed > 0 ? 1 : 0);
