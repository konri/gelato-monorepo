/**
 * The app's GraphQL documents, as the app sends them (shared by
 * scripts/check-graphql.mjs and scripts/smoke-brands.mjs).
 *
 * Finds `gql` documents and plain-string operations (the WS subscription) in
 * every .ts/.tsx file, resolves `${FRAGMENT}` / `${FIELDS}` interpolations
 * across files the way Apollo's `gql` concatenates them, and drops repeated
 * fragment definitions like `gql` does.
 *
 * A document is LIVE when its top-level declaration is reachable from the
 * expo-router routes (`app/**`) through references between top-level symbols
 * (imports and re-exports followed); merchant-era documents that no screen
 * reaches are dead.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const ts = require('typescript');
const { parse, print, Kind } = require('graphql');

/**
 * @returns {{ rel: string, owner: string | null, ops: string[], live: boolean, text: string | null, error: string | null }[]}
 */
export function loadAppDocuments() {
  // ── Files ────────────────────────────────────────────────────────────────────
  const SKIP_DIRS = new Set(['node_modules', '.expo', 'dist', 'ios', 'android', 'web-build', '.git', 'scripts']);
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return SKIP_DIRS.has(name) ? [] : walk(p);
      return /\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts') ? [p] : [];
    });
  const files = walk(ROOT);
  const fileSet = new Set(files);

  const EXTS = ['.ts', '.tsx', '.ios.ts', '.ios.tsx', '.android.ts', '.android.tsx', '.native.ts', '.native.tsx'];
  function resolveModule(spec, fromFile) {
    let base;
    if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2));
    else if (spec === '@repo/api-client') base = join(ROOT, 'shared/api-client');
    else if (spec.startsWith('@repo/api-client/')) base = join(ROOT, 'shared/api-client', spec.slice(17));
    else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
    else return null; // package
    const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => join(base, 'index' + e))];
    return candidates.filter((c) => fileSet.has(c));
  }

  // ── Parse ────────────────────────────────────────────────────────────────────
  /** @type {Map<string, {sf: any, imports: Map<string,{files:string[],name:string}>, reexports: {files:string[], names: Map<string,string>|null}[], consts: Map<string, any>, symbols?: Map<string, any>, docs: any[]}>} */
  const mods = new Map();

  const isGqlTag = (node) => ts.isIdentifier(node.tag) && node.tag.text === 'gql';
  const OP_RE = /^\s*(query|mutation|subscription)\b[^{]*\{/;

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const mod = { sf, imports: new Map(), reexports: [], consts: new Map(), docs: [] };
    mods.set(file, mod);

    for (const st of sf.statements) {
      if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
        const targets = resolveModule(st.moduleSpecifier.text, file) ?? [];
        const clause = st.importClause;
        if (clause && !clause.isTypeOnly) {
          if (clause.name) mod.imports.set(clause.name.text, { files: targets, name: 'default' });
          const nb = clause.namedBindings;
          if (nb && ts.isNamedImports(nb)) {
            for (const el of nb.elements) {
              if (!el.isTypeOnly) mod.imports.set(el.name.text, { files: targets, name: (el.propertyName ?? el.name).text });
            }
          } else if (nb && ts.isNamespaceImport(nb)) {
            mod.imports.set(nb.name.text, { files: targets, name: '*' });
          }
        }
      } else if (ts.isExportDeclaration(st) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
        const targets = resolveModule(st.moduleSpecifier.text, file) ?? [];
        let names = null;
        if (st.exportClause && ts.isNamedExports(st.exportClause)) {
          names = new Map(st.exportClause.elements.map((el) => [el.name.text, (el.propertyName ?? el.name).text]));
        }
        mod.reexports.push({ files: targets, names });
      } else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && d.initializer) mod.consts.set(d.name.text, d.initializer);
        }
      }
    }

    // Documents: `gql` templates and plain-string operations.
    const visit = (node) => {
      if (ts.isTaggedTemplateExpression(node) && isGqlTag(node)) {
        mod.docs.push({ node: node.template, tagged: true, owner: ownerName(node) });
      } else if (
        (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node) || ts.isStringLiteral(node)) &&
        !(node.parent && ts.isTaggedTemplateExpression(node.parent))
      ) {
        const head = ts.isTemplateExpression(node) ? node.head.text : node.text;
        if (OP_RE.test(head)) mod.docs.push({ node, tagged: false, owner: ownerName(node) });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  /** The top-level declaration that holds a node (its symbol for the liveness check). */
  function ownerName(node) {
    let n = node;
    while (n.parent && !ts.isSourceFile(n.parent)) n = n.parent;
    return topLevelNames(n)[0] ?? null;
  }

  function topLevelNames(st) {
    if (ts.isVariableStatement(st)) {
      return st.declarationList.declarations.filter((d) => ts.isIdentifier(d.name)).map((d) => d.name.text);
    }
    if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) return [st.name.text];
    if (ts.isExportAssignment(st)) return ['default'];
    return [];
  }

  // ── Template evaluation ──────────────────────────────────────────────────────
  function lookupExport(file, name, seen = new Set()) {
    const key = file + '#' + name;
    if (seen.has(key)) return null;
    seen.add(key);
    const mod = mods.get(file);
    if (!mod) return null;
    if (mod.consts.has(name)) return { file, node: mod.consts.get(name) };
    if (mod.imports.has(name)) {
      const imp = mod.imports.get(name);
      for (const f of imp.files) {
        const hit = lookupExport(f, imp.name, seen);
        if (hit) return hit;
      }
    }
    for (const re of mod.reexports) {
      if (re.names && !re.names.has(name)) continue;
      const inner = re.names ? re.names.get(name) : name;
      for (const f of re.files) {
        const hit = lookupExport(f, inner, seen);
        if (hit) return hit;
      }
    }
    return null;
  }

  function evalExpr(node, file, stack) {
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) return evalExpr(node.expression, file, stack);
    if (ts.isTaggedTemplateExpression(node) && isGqlTag(node)) return evalTemplate(node.template, file, stack);
    if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) return evalTemplate(node, file, stack);
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isIdentifier(node)) {
      const hit = lookupExport(file, node.text);
      if (!hit) throw new Error(`cannot resolve \${${node.text}} in ${relative(ROOT, file)}`);
      const key = hit.file + '#' + node.text;
      if (stack.includes(key)) throw new Error(`cyclic interpolation ${node.text}`);
      return evalExpr(hit.node, hit.file, [...stack, key]);
    }
    throw new Error(`unsupported interpolation "${node.getText()}" in ${relative(ROOT, file)}`);
  }

  function evalTemplate(tpl, file, stack = []) {
    if (ts.isNoSubstitutionTemplateLiteral(tpl)) return tpl.text;
    let out = tpl.head.text;
    for (const span of tpl.templateSpans) out += evalExpr(span.expression, file, stack) + '\n' + span.literal.text;
    return out;
  }

  /** Apollo's `gql` drops repeated fragment definitions; do the same. */
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

  // ── Liveness (symbol level) ──────────────────────────────────────────────────
  /** (file, exported name) → the defining (file, name), through imports and re-exports. */
  function defining(file, name, seen = new Set()) {
    const key = file + '#' + name;
    if (seen.has(key)) return null;
    seen.add(key);
    const mod = mods.get(file);
    if (!mod) return null;
    if (mod.symbols.has(name)) return key;
    if (mod.imports.has(name)) {
      const imp = mod.imports.get(name);
      for (const f of imp.files) {
        const hit = imp.name === '*' ? null : defining(f, imp.name, seen);
        if (hit) return hit;
      }
    }
    for (const re of mod.reexports) {
      if (re.names && !re.names.has(name)) continue;
      const inner = re.names ? re.names.get(name) : name;
      for (const f of re.files) {
        const hit = defining(f, inner, seen);
        if (hit) return hit;
      }
    }
    return null;
  }

  for (const [, mod] of mods) {
    mod.symbols = new Map();
    for (const st of mod.sf.statements) {
      const names = topLevelNames(st);
      for (const n of names) mod.symbols.set(n, st);
      // `export default Foo` / `export default function Foo` also define 'default'.
      if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
        mod.symbols.set('default', st);
      }
    }
  }

  function referencedKeys(file, node) {
    const mod = mods.get(file);
    const out = new Set();
    const visit = (n) => {
      if (ts.isIdentifier(n)) {
        const name = n.text;
        if (mod.imports.get(name)?.name === '*') {
          for (const f of mod.imports.get(name).files) for (const k of mods.get(f)?.symbols.keys() ?? []) {
            const hit = defining(f, k);
            if (hit) out.add(hit);
          }
        } else if (mod.symbols.has(name) || mod.imports.has(name)) {
          const hit = defining(file, name);
          if (hit) out.add(hit);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return out;
  }

  // Roots: everything in the expo-router routes (app/**) and every top-level
  // statement with side effects (not a declaration) in any file.
  const liveKeys = new Set();
  const queue = [];
  for (const [file, mod] of mods) {
    const isRoute = relative(ROOT, file).startsWith('app/');
    for (const st of mod.sf.statements) {
      const isDecl = topLevelNames(st).length > 0 || ts.isImportDeclaration(st) || ts.isExportDeclaration(st) ||
        ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st) || ts.isModuleDeclaration(st);
      if (isRoute || !isDecl) for (const k of referencedKeys(file, st)) queue.push(k);
      if (isRoute) for (const n of topLevelNames(st)) queue.push(file + '#' + n);
    }
  }
  while (queue.length) {
    const key = queue.pop();
    if (liveKeys.has(key)) continue;
    liveKeys.add(key);
    const i = key.lastIndexOf('#');
    const file = key.slice(0, i);
    const st = mods.get(file)?.symbols.get(key.slice(i + 1));
    if (st) for (const k of referencedKeys(file, st)) if (!liveKeys.has(k)) queue.push(k);
  }

  const isLive = (file, owner) => (owner ? liveKeys.has(file + '#' + owner) : true);


  const docs = [];
  for (const [file, mod] of mods) {
    for (const { node, owner } of mod.docs) {
      const rel = relative(ROOT, file);
      let text = null;
      let error = null;
      let ops = [];
      try {
        const doc = dedupeFragments(parse(evalTemplate(node, file)));
        ops = doc.definitions
          .filter((d) => d.kind === Kind.OPERATION_DEFINITION)
          .map((o) => o.name?.value ?? '(anonymous)');
        if (ops.length === 0) continue; // fragment-only: checked where it is used
        text = print(doc);
      } catch (e) {
        error = String(e.message ?? e);
      }
      docs.push({ rel, owner, ops, live: isLive(file, owner), text, error });
    }
  }
  return docs;
}

/** The printed document of a live operation, by operation name. */
export function documentFor(docs, operationName) {
  const hits = docs.filter((d) => d.live && d.ops.includes(operationName) && d.text);
  if (hits.length === 0) throw new Error(`No live document for operation ${operationName}`);
  if (new Set(hits.map((h) => h.text)).size > 1) throw new Error(`Several live documents named ${operationName}`);
  return hits[0].text;
}
