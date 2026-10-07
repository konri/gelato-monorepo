/**
 * Validates every GraphQL document exported by src/graphql/*.ts against the
 * backend schema (BRANDS_SPEC §3.4, `npm run check:graphql`), and checks that
 * operation names are unique (refetchQueries refers to them by name).
 *
 * Schema path: first CLI argument, else $LOODLY_SCHEMA, else ../loodly-be/schema.gql.
 * The modules are loaded through Vite (same resolution as the app), so
 * fragments interpolated into documents are checked as the app sends them.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSchema, validate, type DocumentNode } from 'graphql';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = resolve(process.argv[2] ?? process.env.LOODLY_SCHEMA ?? resolve(root, '../loodly-be/schema.gql'));

if (!existsSync(schemaPath)) {
  console.error(`Schema not found: ${schemaPath}\nPass the path: npm run check:graphql -- <path/to/schema.gql>`);
  process.exit(2);
}

const schema = buildSchema(readFileSync(schemaPath, 'utf8'));

function isDocument(value: unknown): value is DocumentNode {
  return !!value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'Document';
}

function hasOperation(doc: DocumentNode): boolean {
  return doc.definitions.some((d) => d.kind === 'OperationDefinition');
}

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  // Only SSR module loading is needed: no dependency scan / pre-bundling.
  optimizeDeps: { noDiscovery: true, include: [] },
});

let checked = 0;
let failed = 0;
/** Operation names must be unique: refetchQueries refers to queries by name. */
const operationNames = new Map<string, string>();
try {
  const files = readdirSync(resolve(root, 'src/graphql')).filter((f) => f.endsWith('.ts')).sort();
  for (const file of files) {
    const mod = (await server.ssrLoadModule(`/src/graphql/${file}`)) as Record<string, unknown>;
    for (const [name, value] of Object.entries(mod)) {
      // Fragment-only documents are checked where they are used.
      if (!isDocument(value) || !hasOperation(value)) continue;
      checked++;
      const messages = validate(schema, value).map((e) => e.message);
      for (const def of value.definitions) {
        if (def.kind !== 'OperationDefinition') continue;
        const opName = def.name?.value;
        if (!opName) {
          messages.push('Anonymous operation (give it a name).');
          continue;
        }
        const seen = operationNames.get(opName);
        if (seen) messages.push(`Operation name "${opName}" is also used by ${seen}.`);
        else operationNames.set(opName, `${file} ${name}`);
      }
      if (messages.length > 0) {
        failed++;
        console.error(`✗ ${file} ${name}`);
        for (const m of messages) console.error(`    ${m}`);
      }
    }
  }
} finally {
  await server.close();
}

console.log(`${checked - failed}/${checked} documents valid against ${schemaPath}`);
process.exit(failed > 0 ? 1 : 0);
