#!/usr/bin/env node
/**
 * Generates public/lottie/<scene>.json from scripts/lottie/scenes/<scene>.mjs.
 *
 *   npm run lottie:build              # all scenes
 *   npm run lottie:build -- scan      # only some scenes
 *
 * Every scene is validated before it is written (see validate.mjs); the build
 * exits 1 on any error, on a file over 60 KB, or when the scene list drifts
 * from SCENE_NAMES in app/components/lottie/scenes.ts.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { OUT_DIR, readSceneNames, validateAnimation } from "./validate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCENE_DIR = join(HERE, "scenes");

// Coordinates keep 2 decimals; values below 1 (colours, easing handles,
// small tangents) keep 3 so colours stay exact to the 8-bit level.
function round(_key, value) {
  if (typeof value !== "number" || Number.isInteger(value)) return value;
  const f = Math.abs(value) < 1 ? 1000 : 100;
  const r = Math.round(value * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

async function main() {
  const sceneNames = readSceneNames();
  const authored = readdirSync(SCENE_DIR)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => f.replace(/\.mjs$/, ""));

  let failed = false;
  const missing = sceneNames.filter((n) => !authored.includes(n));
  const extra = authored.filter((n) => !sceneNames.includes(n));
  if (missing.length) {
    console.error(`✗ no scene module for: ${missing.join(", ")}`);
    failed = true;
  }
  if (extra.length) {
    console.error(`✗ scene modules not in SCENE_NAMES: ${extra.join(", ")}`);
    failed = true;
  }
  const strays = existsSync(OUT_DIR)
    ? readdirSync(OUT_DIR).filter((f) => f.endsWith(".json") && !sceneNames.includes(f.replace(/\.json$/, "")))
    : [];
  if (strays.length) {
    console.error(`✗ stray files in public/lottie: ${strays.join(", ")}`);
    failed = true;
  }

  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = only.length ? sceneNames.filter((n) => only.includes(n)) : sceneNames;
  mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  for (const name of targets) {
    if (!authored.includes(name)) continue;
    let data;
    try {
      const mod = await import(pathToFileURL(join(SCENE_DIR, `${name}.mjs`)).href);
      data = mod.default;
    } catch (e) {
      console.error(`✗ ${name}: ${e.stack ?? e.message}`);
      failed = true;
      continue;
    }
    const json = JSON.stringify(data, round);
    const bytes = Buffer.byteLength(json);
    const { errors, warnings } = validateAnimation(JSON.parse(json), { name, bytes });
    const line = `${name}.json`.padEnd(20) +
      `${(bytes / 1024).toFixed(1).padStart(5)} KB  ${String(data.layers.length).padStart(2)} layers  ` +
      `${data.op / data.fr} s  poster ${data.markers[0].tm}`;
    if (errors.length) {
      failed = true;
      console.error(`✗ ${line}`);
      for (const e of errors) console.error(`    error: ${e}`);
    } else {
      writeFileSync(join(OUT_DIR, `${name}.json`), json);
      total += bytes;
      console.log(`✓ ${line}`);
    }
    for (const w of warnings) console.warn(`    warn:  ${w}`);
  }
  console.log(`  total ${(total / 1024).toFixed(1)} KB`);
  process.exit(failed ? 1 : 0);
}

main();
