#!/usr/bin/env node
/**
 * Headless render check: draws each scene with the real lottie_light player in
 * a local Chrome / Chromium and writes a contact sheet (PNG) of frames, plus a
 * report of runtime errors and empty renders.
 *
 *   npm run lottie:render                                # all scenes, 12 frames each
 *   npm run lottie:render -- scan points --frames 0,40,80 --cell 480 --out /tmp/x
 *
 * Needs Chrome: set CHROME_PATH, or it looks in the usual places. Without a
 * browser it prints a notice and exits 0 (validate.mjs still runs before every
 * `npm run build`, via the `prebuild` script).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { OUT_DIR, ROOT, readSceneNames } from "./validate.mjs";

const args = process.argv.slice(2);
const opt = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const flagValues = new Set(["--frames", "--cell", "--out", "--cols"].flatMap((f) => (args.includes(f) ? [args[args.indexOf(f) + 1]] : [])));
const names = args.filter((a) => !a.startsWith("--") && !flagValues.has(a));
const scenes = names.length ? names : readSceneNames();
const cellW = Number(opt("--cell", "240"));
const cellH = Math.round((cellW * 3) / 4);
const cols = Number(opt("--cols", "4"));
const outDir = opt("--out", mkdtempSync(join(tmpdir(), "loodly-lottie-")));
mkdirSync(outDir, { recursive: true });

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  for (const bin of ["google-chrome", "chromium", "chromium-browser"]) {
    const r = spawnSync("which", [bin], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

const chrome = findChrome();
if (!chrome) {
  console.log("render-check: no Chrome/Chromium found (set CHROME_PATH) — skipped.");
  process.exit(0);
}

/** Headless Chrome tends to linger after it is done; stop it once `done(stdout)` holds. */
function runChrome(argv, done, timeoutMs = 45000) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(chrome, argv, { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearInterval(poll);
      clearTimeout(timer);
      child.kill("SIGKILL");
      if (error) reject(error);
      else resolvePromise(out);
    };
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    child.on("exit", () => setTimeout(() => (done(out) ? finish() : finish(new Error("chrome exited early"))), 50));
    const poll = setInterval(() => done(out) && setTimeout(() => finish(), 150), 100);
    const timer = setTimeout(() => finish(new Error("timeout")), timeoutMs);
  });
}

const player = readFileSync(join(ROOT, "node_modules/lottie-web/build/player/lottie_light.min.js"), "utf8");

function page(name, json, frames) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff8f0;font:12px/1.2 system-ui,sans-serif;color:#3a1526}
  .grid{display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:0}
  .cell{position:relative;width:${cellW}px;height:${cellH + 18}px}
  .anim{width:${cellW}px;height:${cellH}px;background:#fff1e6;outline:1px solid #ffe6d5}
  .lab{height:18px;padding:2px 6px}.poster .lab{color:#c026a3;font-weight:700}
  </style></head><body><div class="grid" id="g"></div><pre id="report" style="display:none"></pre>
  <script>${player}</script>
  <script>
  const errors = [];
  window.addEventListener("error", (e) => errors.push(String(e.message)));
  const json = ${JSON.stringify(json)};
  const frames = ${JSON.stringify(frames)};
  const g = document.getElementById("g");
  let loaded = 0, painted = 0;
  try {
    frames.forEach(([f, poster]) => {
      const cell = document.createElement("div"); cell.className = "cell" + (poster ? " poster" : "");
      const box = document.createElement("div"); box.className = "anim";
      const lab = document.createElement("div"); lab.className = "lab"; lab.textContent = (poster ? "poster " : "") + "f" + f;
      cell.append(box, lab); g.append(cell);
      const a = lottie.loadAnimation({ container: box, renderer: "svg", loop: false, autoplay: false, animationData: JSON.parse(json) });
      // lottie-web swallows renderer exceptions and re-emits them as an "error" event
      a.addEventListener("error", (e) => errors.push("lottie: " + String((e && (e.nativeError && e.nativeError.stack || e.nativeError)) || (e && e.type) || e)));
      const go = () => { loaded++; if (poster) a.goToAndStop("poster"); else a.goToAndStop(f, true);
        const n = [...box.querySelectorAll("path")].filter((p) => (p.getAttribute("d") || "").length > 4).length;
        if (n > 0) painted++; };
      if (a.isLoaded) go(); else a.addEventListener("DOMLoaded", go);
    });
  } catch (e) { errors.push(String(e && e.stack || e)); }
  setTimeout(() => { document.getElementById("report").textContent = JSON.stringify({ loaded, painted, total: frames.length, errors }); }, 300);
  </script></body></html>`;
}

let failed = false;
for (const name of scenes) {
  const file = join(OUT_DIR, `${name}.json`);
  if (!existsSync(file)) {
    console.log(`✗ ${name}: ${file} missing (run npm run lottie:build)`);
    failed = true;
    continue;
  }
  const json = readFileSync(file, "utf8");
  const data = JSON.parse(json);
  const poster = data.markers.find((m) => m.cm === "poster")?.tm ?? 0;
  let frames;
  if (opt("--frames")) frames = opt("--frames").split(",").map((f) => (f === "poster" ? [poster, true] : [Number(f), false]));
  else {
    const n = 11;
    frames = Array.from({ length: n }, (_, k) => [Math.round((k * data.op) / n), false]);
    frames.push([poster, true]);
  }
  const html = join(outDir, `${name}.html`);
  writeFileSync(html, page(name, json, frames));
  const rows = Math.ceil(frames.length / cols);
  const png = join(outDir, `${name}.png`);
  rmSync(png, { force: true });
  const common = (tag) => ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${join(outDir, `.chrome-${tag}`)}`, "--virtual-time-budget=4000", "--force-device-scale-factor=1"];
  try {
    await runChrome([...common("shot"), `--window-size=${cols * cellW},${rows * (cellH + 18)}`, `--screenshot=${png}`, pathToFileURL(html).href],
      () => existsSync(png) && statSync(png).size > 0);
    const dom = await runChrome([...common("dom"), "--dump-dom", pathToFileURL(html).href], (out) => out.includes("</html>"));
    const m = /<pre id="report"[^>]*>([^<]*)<\/pre>/.exec(dom);
    const report = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")) : null;
    if (!report) {
      console.log(`✗ ${name}: no report from the page`);
      failed = true;
    } else if (report.errors.length || report.loaded !== report.total || report.painted !== report.total) {
      console.log(`✗ ${name}: loaded ${report.loaded}/${report.total}, painted ${report.painted}/${report.total}, errors: ${report.errors.join(" | ")}`);
      failed = true;
    } else {
      console.log(`✓ ${name}: ${report.total} frames rendered → ${png}`);
    }
  } catch (e) {
    console.log(`✗ ${name}: chrome failed (${e.message})`);
    failed = true;
  }
}
console.log(`contact sheets in ${outDir}`);
process.exit(failed ? 1 : 0);
