#!/usr/bin/env node
/**
 * Structural validator for the generated Lottie files (brief §4.1, §6.4).
 *
 *   node scripts/lottie/validate.mjs            # validate public/lottie/*.json
 *   import { validateAnimation } from "./validate.mjs"
 *
 * Checks: required top-level keys, 480×360 @ 30 fps, poster marker, layer
 * indices / parents / ip-op, allowed layer and shape types only (no text,
 * images, precomps, masks, mattes, effects, expressions, 3D), group structure
 * (one `tr`, last), path vertex arrays, keyframe order and range, easing
 * handles, finite numbers, colours in 0–1, minimum stroke width, seamless
 * loop (every animated value ends where it starts), flash rate, layer budget
 * and file size.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");
export const OUT_DIR = join(ROOT, "public/lottie");
export const SCENES_TS = join(ROOT, "app/components/lottie/scenes.ts");

export const LIMITS = { maxLayers: 30, maxBytes: 60 * 1024, targetBytes: 30 * 1024, minStroke: 2 };

const ALLOWED_SHAPES = new Set(["gr", "rc", "el", "sh", "fl", "st", "tm", "tr"]);
const ALLOWED_LAYERS = new Set([3, 4]);

/** SCENE_NAMES as declared in app/components/lottie/scenes.ts. */
export function readSceneNames() {
  const src = readFileSync(SCENES_TS, "utf8");
  const m = /SCENE_NAMES\s*=\s*\[([^\]]*)\]/m.exec(src);
  if (!m) throw new Error(`SCENE_NAMES not found in ${SCENES_TS}`);
  return [...m[1].matchAll(/["']([A-Za-z0-9_-]+)["']/g)].map((x) => x[1]);
}

function isProp(v) {
  return v && typeof v === "object" && "k" in v && ("a" in v || "x" in v);
}

function sameValue(a, b, mod) {
  if (a.length !== b.length) return false;
  return a.every((x, i) => {
    const d = Math.abs(x - b[i]);
    if (mod) {
      const m = d % mod;
      return Math.min(m, mod - m) < 1e-6;
    }
    return d < 1e-6;
  });
}

/** Value of a property at frame t (linear between keyframes; holds respected). */
export function valueAt(p, t) {
  if (!p || !("k" in p)) return null;
  if (p.a !== 1) return Array.isArray(p.k) ? p.k : [p.k];
  const k = p.k;
  if (t <= k[0].t) return k[0].s;
  for (let i = 0; i < k.length - 1; i += 1) {
    const a = k[i];
    const b = k[i + 1];
    if (t < b.t) {
      if (a.h === 1) return a.s;
      const u = (t - a.t) / (b.t - a.t);
      return a.s.map((v, j) => v + (b.s[j] - v) * u);
    }
  }
  return k[k.length - 1].s;
}
const scaleAt = (t, frame) => {
  const s = valueAt(t?.s, frame);
  return s ? Math.min(Math.abs(s[0]), Math.abs(s[1] ?? s[0])) / 100 : 1;
};
const opacityAt = (t, frame) => {
  const o = valueAt(t?.o, frame);
  return o ? o[0] / 100 : 1;
};

export function validateAnimation(data, { name, bytes } = {}) {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

  // --- finite numbers everywhere
  (function walk(v, path) {
    if (typeof v === "number" && !Number.isFinite(v)) err(path, "non-finite number");
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  })(data, "root");

  // --- top level
  for (const key of ["v", "fr", "ip", "op", "w", "h", "nm", "layers", "assets", "markers"]) {
    if (!(key in data)) err("root", `missing "${key}"`);
  }
  if (typeof data.v !== "string" || !/^5\.(?:[7-9]|\d{2,})\./.test(data.v)) err("root", `version ${data.v} < 5.7`);
  if (data.fr !== 30) err("root", `fr must be 30 (got ${data.fr})`);
  if (data.w !== 480 || data.h !== 360) err("root", `canvas must be 480×360 (got ${data.w}×${data.h})`);
  if (data.ip !== 0) err("root", "ip must be 0");
  const op = data.op;
  if (!Number.isInteger(op) || op <= 0) err("root", `bad op ${op}`);
  if (op % 30 !== 0) err("root", `op ${op} is not a whole number of seconds`);
  if (name && data.nm !== name) err("root", `nm "${data.nm}" ≠ file name "${name}"`);
  if (data.ddd) err("root", "3D (ddd) is not allowed");
  if (Array.isArray(data.assets) && data.assets.length) err("root", "assets must be empty (no images / precomps)");
  if ("fonts" in data || "chars" in data) err("root", "fonts / chars are not allowed");

  const poster = (data.markers ?? []).find((m) => m.cm === "poster");
  if (!poster) err("root", 'missing "poster" marker');
  else if (!(poster.tm >= 0 && poster.tm < op)) err("root", `poster ${poster.tm} outside [0, ${op})`);

  // --- layers
  const layers = Array.isArray(data.layers) ? data.layers : [];
  if (layers.length === 0) err("root", "no layers");
  if (layers.length > LIMITS.maxLayers) err("root", `${layers.length} layers > ${LIMITS.maxLayers}`);
  const inds = new Map();
  for (const L of layers) {
    const where = `layer "${L.nm}"`;
    if (!Number.isInteger(L.ind)) err(where, "missing ind");
    else if (inds.has(L.ind)) err(where, `duplicate ind ${L.ind}`);
    else inds.set(L.ind, L);
    if (!ALLOWED_LAYERS.has(L.ty)) err(where, `layer type ${L.ty} not allowed`);
    if (L.ddd) err(where, "3D layer");
    for (const k of ["masksProperties", "hasMask", "tt", "td", "ef", "tp"]) {
      if (L[k]) err(where, `"${k}" (mask / matte / effect) not allowed`);
    }
    if (!(L.ip >= 0) || !(L.op > L.ip)) err(where, `bad ip/op ${L.ip}/${L.op}`);
    if (!L.ks) err(where, "missing ks");
    else for (const k of ["o", "r", "p", "a", "s"]) if (!L.ks[k]) err(where, `ks.${k} missing`);
    if (L.ty === 4 && !Array.isArray(L.shapes)) err(where, "shape layer without shapes");
  }
  for (const L of layers) {
    if (L.parent === undefined) continue;
    if (!inds.has(L.parent)) err(`layer "${L.nm}"`, `parent ${L.parent} does not exist`);
    const seen = new Set();
    let cur = L;
    while (cur && cur.parent !== undefined) {
      if (seen.has(cur.ind)) {
        err(`layer "${L.nm}"`, "parent cycle");
        break;
      }
      seen.add(cur.ind);
      cur = inds.get(cur.parent);
    }
  }

  // --- properties
  function checkProp(p, where, { kind = "any", mod } = {}) {
    if (!isProp(p)) {
      err(where, "not a property object");
      return;
    }
    if ("x" in p && typeof p.x === "string") err(where, "expressions are not allowed");
    if (p.a === 0) {
      if (kind === "color") checkColor(p.k, where);
      return;
    }
    if (p.a !== 1 || !Array.isArray(p.k) || p.k.length === 0) {
      err(where, "animated property needs a keyframe array");
      return;
    }
    const kfs = p.k;
    let dim = null;
    kfs.forEach((k, idx) => {
      const at = `${where} kf#${idx}@${k.t}`;
      if (typeof k.t !== "number") err(at, "keyframe without t");
      if (k.t < 0 || k.t > op) err(at, `t outside [0, ${op}]`);
      if (idx > 0 && !(k.t > kfs[idx - 1].t)) err(at, "keyframes not strictly increasing");
      if (!Array.isArray(k.s)) err(at, "s must be an array");
      else {
        if (dim === null) dim = k.s.length;
        else if (k.s.length !== dim) err(at, "dimension changes between keyframes");
        if (kind === "color") checkColor(k.s, at);
      }
      const last = idx === kfs.length - 1;
      if (last) {
        const extra = Object.keys(k).filter((x) => x !== "t" && x !== "s");
        if (extra.length) err(at, `last keyframe must only have t and s (has ${extra.join(", ")})`);
        return;
      }
      if (k.h === 1) return;
      if (!k.o || !k.i) {
        err(at, "missing easing handles o / i");
        return;
      }
      for (const hx of [k.o.x, k.i.x].flat()) {
        if (!(hx >= 0 && hx <= 1)) err(at, `easing x ${hx} outside [0, 1]`);
      }
      if ((k.to && !k.ti) || (!k.to && k.ti)) err(at, "spatial keyframe needs both to and ti");
    });
    // seamless loop: the value at frame op equals the value at frame 0
    const first = kfs[0].s;
    const lastS = kfs[kfs.length - 1].s;
    if (Array.isArray(first) && Array.isArray(lastS) && !sameValue(first, lastS, mod)) {
      err(where, `loop jump: starts at ${JSON.stringify(first)} but ends at ${JSON.stringify(lastS)}`);
    }
    return kfs;
  }

  function checkColor(c, where) {
    if (!Array.isArray(c) || c.length < 3 || c.length > 4 || c.some((x) => !(x >= 0 && x <= 1))) {
      err(where, `bad colour ${JSON.stringify(c)}`);
    }
  }

  function checkOpacityFlash(p, where) {
    if (!p || p.a !== 1) return;
    // a "flash" = a big opacity swing (≥ 50) within ≤ 10 frames; at most 6
    // swings (3 flashes) in any 30-frame window.
    const swings = [];
    for (let i = 1; i < p.k.length; i += 1) {
      const a = p.k[i - 1];
      const b = p.k[i];
      if (Math.abs(b.s[0] - a.s[0]) >= 50 && b.t - a.t <= 10) swings.push(b.t);
    }
    for (let i = 0; i < swings.length; i += 1) {
      const inWindow = swings.filter((t) => t >= swings[i] && t < swings[i] + 30).length;
      if (inWindow > 6) {
        err(where, "flashes more than 3 times per second");
        break;
      }
    }
  }

  function checkTransform(t, where, layerLevel) {
    const keys = layerLevel ? ["o", "r", "p", "a", "s"] : ["p", "a", "s", "r", "o"];
    for (const k of keys) {
      if (!t[k]) {
        if (layerLevel) err(where, `transform.${k} missing`);
        continue;
      }
      checkProp(t[k], `${where}.${k}`, { mod: k === "r" ? 360 : undefined });
    }
    if (t.o) checkOpacityFlash(t.o, `${where}.o`);
  }

  // ctx = on-screen scale and opacity at the poster frame (the resting frame),
  // used to check the rendered stroke width.
  function checkShapes(items, where, ancestors, ctx) {
    if (!Array.isArray(items)) {
      err(where, "shapes must be an array");
      return;
    }
    items.forEach((it, idx) => {
      const at = `${where} > ${it.nm ?? it.ty}#${idx}`;
      if (!ALLOWED_SHAPES.has(it.ty)) {
        err(at, `shape type "${it.ty}" not allowed`);
        return;
      }
      switch (it.ty) {
        case "gr": {
          const it2 = it.it;
          if (!Array.isArray(it2) || it2.length === 0) {
            err(at, "empty group");
            return;
          }
          const trs = it2.filter((x) => x.ty === "tr");
          if (trs.length !== 1 || it2[it2.length - 1].ty !== "tr") err(at, "group needs exactly one tr, last");
          const geometry = it2.some((x) => x.ty === "gr" || x.ty === "rc" || x.ty === "el" || x.ty === "sh");
          if (!geometry) err(at, "group without geometry");
          const own = it2[it2.length - 1]?.ty === "tr" ? it2[it2.length - 1] : null;
          checkShapes(it2, at, [...ancestors, it.nm ?? ""], {
            scale: ctx.scale * scaleAt(own, posterFrame),
            opacity: ctx.opacity * opacityAt(own, posterFrame),
          });
          break;
        }
        case "tr":
          // lottie-web's SVG renderer dereferences the group opacity unconditionally
          if (!it.o) err(at, "group transform needs o (lottie-web requirement)");
          checkTransform(it, at, false);
          break;
        case "rc":
          checkProp(it.p, `${at}.p`);
          checkProp(it.s, `${at}.s`);
          checkProp(it.r, `${at}.r`);
          break;
        case "el":
          checkProp(it.p, `${at}.p`);
          checkProp(it.s, `${at}.s`);
          break;
        case "sh": {
          const k = it.ks?.k;
          if (it.ks?.a !== 0 || !k) {
            err(at, "paths must be static (no morphs)");
            break;
          }
          const n = k.v?.length;
          if (!n || k.i?.length !== n || k.o?.length !== n) err(at, "path v / i / o length mismatch");
          if (typeof k.c !== "boolean") err(at, "path c must be boolean");
          break;
        }
        case "fl":
          checkProp(it.c, `${at}.c`, { kind: "color" });
          checkProp(it.o, `${at}.o`);
          checkOpacityFlash(it.o, `${at}.o`);
          break;
        case "st": {
          checkProp(it.c, `${at}.c`, { kind: "color" });
          checkProp(it.o, `${at}.o`);
          checkProp(it.w, `${at}.w`);
          // No stroke under 2 px on screen (brief §4.1), measured at the
          // poster frame through every group / layer / parent scale. The
          // Loodly mark is exempt (logo proportions are kept 1:1).
          const inMark = ancestors.some((a) => /^mark/i.test(a));
          const strokeO = (valueAt(it.o, posterFrame)?.[0] ?? 100) / 100;
          const visible = ctx.scale > 0.01 && ctx.opacity * strokeO > 0.01;
          if (it.w?.a === 0 && !inMark) {
            const rendered = it.w.k * ctx.scale;
            if (it.w.k < LIMITS.minStroke) err(at, `stroke ${it.w.k}px < ${LIMITS.minStroke}px`);
            else if (visible && rendered < LIMITS.minStroke - 0.05) {
              err(at, `stroke renders at ${rendered.toFixed(2)}px (< ${LIMITS.minStroke}px) at the poster frame`);
            }
          }
          if (it.d) for (const d of it.d) checkProp(d.v, `${at}.dash.${d.n}`);
          break;
        }
        case "tm":
          checkProp(it.s, `${at}.s`);
          checkProp(it.e, `${at}.e`);
          checkProp(it.o, `${at}.o`, { mod: 360 });
          break;
        default:
          break;
      }
    });
  }

  const posterFrame = poster?.tm ?? 0;
  const layerScale = (L, depth = 0) => {
    if (!L || depth > 32) return 1;
    const own = scaleAt(L.ks, posterFrame);
    return L.parent !== undefined ? own * layerScale(inds.get(L.parent), depth + 1) : own;
  };
  for (const L of layers) {
    const where = `layer "${L.nm}"`;
    if (L.ks) checkTransform(L.ks, `${where}.ks`, true);
    if (L.ty === 4) checkShapes(L.shapes, where, [], { scale: layerScale(L), opacity: opacityAt(L.ks, posterFrame) });
  }

  if (bytes !== undefined) {
    if (bytes > LIMITS.maxBytes) err("file", `${(bytes / 1024).toFixed(1)} KB > ${LIMITS.maxBytes / 1024} KB`);
    else if (bytes > LIMITS.targetBytes) warn("file", `${(bytes / 1024).toFixed(1)} KB > ${LIMITS.targetBytes / 1024} KB target`);
  }
  return { errors, warnings };
}

/** Validate every public/lottie/*.json against SCENE_NAMES. */
export function validateDirectory(dir = OUT_DIR) {
  const names = readSceneNames();
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const report = [];
  let failed = false;
  for (const f of files) {
    if (!names.includes(f.replace(/\.json$/, ""))) {
      report.push(`✗ ${f}: not in SCENE_NAMES`);
      failed = true;
    }
  }
  for (const name of names) {
    const file = join(dir, `${name}.json`);
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      report.push(`✗ ${name}.json: missing`);
      failed = true;
      continue;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      report.push(`✗ ${name}.json: invalid JSON (${e.message})`);
      failed = true;
      continue;
    }
    const { errors, warnings } = validateAnimation(data, { name, bytes: statSync(file).size });
    const kb = (statSync(file).size / 1024).toFixed(1);
    report.push(`${errors.length ? "✗" : "✓"} ${name}.json  ${kb} KB  ${data.layers?.length ?? 0} layers  ${(data.op / data.fr).toFixed(0)} s  poster ${data.markers?.[0]?.tm}`);
    for (const e of errors) report.push(`    error: ${e}`);
    for (const w of warnings) report.push(`    warn:  ${w}`);
    if (errors.length) failed = true;
  }
  return { failed, report };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { failed, report } = validateDirectory();
  console.log(report.join("\n"));
  process.exit(failed ? 1 : 0);
}
