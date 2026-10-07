/**
 * A tiny, dependency-free DSL that emits Lottie (bodymovin 5.7) JSON for
 * lottie-web's light SVG player.
 *
 * Supported on purpose: shape layers (ty 4), null layers (ty 3), groups,
 * rect / ellipse / path geometry, fill, stroke (with dashes), trim paths,
 * group + layer transforms, parenting, eased / hold / spatial keyframes and
 * animated colours. Not supported on purpose: text, images, expressions,
 * effects, masks, mattes and 3D (see docs/LANDING_PITCH_BRIEF.md §4.1).
 *
 * Conventions
 * - Authoring is BACK-TO-FRONT everywhere (like SVG). Lottie paints the
 *   first item on top, so `group()`, `layer()` and `comp()` reverse lists.
 * - Every transform pivots on (0, 0) unless an anchor `a` is given: draw a
 *   part around the point it should scale / rotate about, then place it
 *   with `p`.
 * - `kf(t, v, ease)`: `ease` shapes the motion LEAVING this keyframe towards
 *   the next one (that is how Lottie stores it). The last keyframe's ease is
 *   ignored.
 */

export const FR = 30;
export const W = 480;
export const H = 360;

/** Palette — mirrors tailwind.config.ts, plus the food and logo colours. */
export const C = {
  berry: "#c026a3",
  berryLight: "#e05bc4",
  berryDark: "#8a1673",
  espresso: "#3a1526",
  espressoLight: "#5c2a3d",
  espressoDark: "#25060f",
  strawberry: "#ff6f91",
  pistachio: "#8bc34a",
  mango: "#ffb020",
  cream: "#fff8f0",
  creamSoft: "#fff1e6",
  creamDeep: "#ffe6d5",
  white: "#ffffff",
  wafer: "#e8a866",
  crust: "#d18f4e",
  waferLine: "#b9773a",
  cherry: "#e11d48",
  logoRed: "#ec2828",
  logoCream: "#fff7f0",
};

/** cubic-bezier presets [x1, y1, x2, y2]. */
export const ease = {
  inOut: [0.42, 0, 0.58, 1],
  out: [0.22, 1, 0.36, 1],
  in: [0.55, 0, 1, 0.45],
  back: [0.34, 1.56, 0.64, 1],
  linear: [0, 0, 1, 1],
  /** accelerate from rest into a linear stretch */
  accel: [0.42, 0, 1, 1],
  /** leave a linear stretch and settle */
  decel: [0, 0, 0.58, 1],
  /** gentle settle, for subtle sways */
  soft: [0.33, 0, 0.67, 1],
};

// ---------------------------------------------------------------------------
// Values and keyframes
// ---------------------------------------------------------------------------

const ANIM = Symbol.for("loodly.lottie.anim");

/** One keyframe. opts: { hold: true } or { to, ti } (spatial tangents, relative). */
export function kf(t, v, e = "inOut", opts = {}) {
  return { t, v, e, ...opts };
}

/** An animated value: anim(kf(...), [t, v, ease?, opts?], ...). */
export function anim(...frames) {
  const kfs = frames.map((f) =>
    Array.isArray(f) ? { t: f[0], v: f[1], e: f[2] ?? "inOut", ...(f[3] ?? {}) } : f,
  );
  if (kfs.length === 0) throw new Error("anim() needs at least one keyframe");
  for (let i = 1; i < kfs.length; i += 1) {
    if (!(kfs[i].t > kfs[i - 1].t)) {
      throw new Error(`keyframes must be strictly increasing: t=${kfs[i - 1].t} then t=${kfs[i].t}`);
    }
  }
  return { [ANIM]: true, kfs };
}

export const isAnim = (v) => Boolean(v && typeof v === "object" && v[ANIM]);

/** '#rrggbb' → [r, g, b, 1] in 0–1. */
export function hex01(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`bad colour ${hex}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

function vec(v, n, what) {
  if (!Array.isArray(v) || v.length < n || v.slice(0, n).some((x) => typeof x !== "number")) {
    throw new Error(`expected ${what}, got ${JSON.stringify(v)}`);
  }
  return v;
}

/** Encode one value as a keyframe `s` array for the given property kind. */
function enc(v, kind) {
  switch (kind) {
    case "num":
      if (typeof v !== "number") throw new Error(`expected number, got ${JSON.stringify(v)}`);
      return [v];
    case "v2":
      vec(v, 2, "[x, y]");
      return [v[0], v[1]];
    case "v3":
      vec(v, 2, "[x, y]");
      return [v[0], v[1], v[2] ?? 0];
    case "s2":
      return typeof v === "number" ? [v, v] : [vec(v, 2, "scale")[0], v[1]];
    case "s3":
      return typeof v === "number" ? [v, v, 100] : [vec(v, 2, "scale")[0], v[1], 100];
    case "col":
      return typeof v === "string" ? hex01(v) : [...vec(v, 3, "rgb"), v[3] ?? 1].slice(0, 4);
    default:
      throw new Error(`unknown property kind ${kind}`);
  }
}

function easeOf(e) {
  const curve = typeof e === "string" ? ease[e] : e;
  if (!Array.isArray(curve) || curve.length !== 4) throw new Error(`unknown ease ${JSON.stringify(e)}`);
  return curve;
}

/** Static or animated value → Lottie property object. */
export function prop(v, kind) {
  if (!isAnim(v)) {
    const s = enc(v, kind);
    return { a: 0, k: kind === "num" ? s[0] : s };
  }
  const list = v.kfs;
  return {
    a: 1,
    k: list.map((f, idx) => {
      const s = enc(f.v, kind);
      const out = { t: f.t, s };
      if (idx === list.length - 1) return out;
      if (f.hold || f.e === "hold") {
        out.h = 1;
        return out;
      }
      const [x1, y1, x2, y2] = easeOf(f.e);
      if (f.to || f.ti) {
        // spatial segment: scalar easing + bezier tangents (relative)
        out.o = { x: x1, y: y1 };
        out.i = { x: x2, y: y2 };
        const pad = (t) => [t[0] ?? 0, t[1] ?? 0, ...(s.length > 2 ? [t[2] ?? 0] : [])];
        out.to = pad(f.to ?? [0, 0]);
        out.ti = pad(f.ti ?? [0, 0]);
      } else {
        out.o = { x: [x1], y: [y1] };
        out.i = { x: [x2], y: [y2] };
      }
      return out;
    }),
  };
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Rectangle; `p` is its CENTRE. size / pos / round accept anim(). */
export function rc({ w, h, r = 0, x = 0, y = 0, size, pos, round } = {}) {
  return {
    ty: "rc",
    p: prop(pos ?? [x, y], "v2"),
    s: prop(size ?? [w, h], "v2"),
    r: prop(round ?? r, "num"),
  };
}

/** Ellipse; `p` is its centre. */
export function el({ w, h, x = 0, y = 0, size, pos } = {}) {
  return { ty: "el", p: prop(pos ?? [x, y], "v2"), s: prop(size ?? [w, h], "v2") };
}

export const circ = (r, x = 0, y = 0) => el({ w: r * 2, h: r * 2, x, y });

function contourToShape(c) {
  return { ty: "sh", ks: { a: 0, k: { c: c.closed, v: c.v, i: c.i, o: c.o } } };
}

/** SVG path data → one Lottie `sh` per sub-path (M L H V C S Q T A Z, abs + rel). */
export function sh(d) {
  return parsePath(d).map(contourToShape);
}

/** Straight polyline / polygon through points. */
export function poly(points, closed = false) {
  return contourToShape({
    closed,
    v: points.map((p) => [p[0], p[1]]),
    i: points.map(() => [0, 0]),
    o: points.map(() => [0, 0]),
  });
}

/** Smooth open curve through points (Catmull-Rom → bezier). tension 0..1. */
export function smooth(points, { closed = false, tension = 0.5 } = {}) {
  const n = points.length;
  const v = [];
  const ii = [];
  const oo = [];
  const k = tension / 3;
  for (let idx = 0; idx < n; idx += 1) {
    const p = points[idx];
    const prev = points[closed ? (idx - 1 + n) % n : Math.max(0, idx - 1)];
    const next = points[closed ? (idx + 1) % n : Math.min(n - 1, idx + 1)];
    const tx = (next[0] - prev[0]) * k;
    const ty = (next[1] - prev[1]) * k;
    const endpoint = !closed && (idx === 0 || idx === n - 1);
    v.push([p[0], p[1]]);
    ii.push(endpoint ? [0, 0] : [-tx, -ty]);
    oo.push(endpoint ? [0, 0] : [tx, ty]);
  }
  return contourToShape({ closed, v, i: ii, o: oo });
}

// ---- SVG path parser -------------------------------------------------------

function arcToCubics(x1, y1, rxIn, ryIn, angle, largeArc, sweep, x2, y2) {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [[x1, y1, x2, y2, x2, y2]];
  const phi = (angle * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const sign = Boolean(largeArc) === Boolean(sweep) ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * ((-ry * x1p) / rx);
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const theta1 = ang(1, 0, ux, uy);
  let dtheta = ang(ux, uy, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;
  else if (sweep && dtheta < 0) dtheta += 2 * Math.PI;
  const segs = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2) - 1e-9));
  const delta = dtheta / segs;
  const t = (4 / 3) * Math.tan(delta / 4);
  const map = (px, py) => [cos * rx * px - sin * ry * py + cx, sin * rx * px + cos * ry * py + cy];
  const out = [];
  let th = theta1;
  for (let s = 0; s < segs; s += 1) {
    const c1 = Math.cos(th);
    const s1 = Math.sin(th);
    const c2 = Math.cos(th + delta);
    const s2 = Math.sin(th + delta);
    const [ax, ay] = map(c1 - t * s1, s1 + t * c1);
    const [bx, by] = map(c2 + t * s2, s2 - t * c2);
    const [ex, ey] = s === segs - 1 ? [x2, y2] : map(c2, s2);
    out.push([ax, ay, bx, by, ex, ey]);
    th += delta;
  }
  return out;
}

export function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const contours = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let i = 0;
  let cmd = "";
  let prevCubic = null; // last cubic cp2 (for S)
  let prevQuad = null; // last quad cp (for T)
  const isCmd = (tok) => /^[a-zA-Z]$/.test(tok);
  const num = () => {
    const tok = tokens[i];
    if (tok === undefined || isCmd(tok)) throw new Error(`path: expected number in "${d}"`);
    i += 1;
    return parseFloat(tok);
  };
  const ensure = () => {
    if (!cur || cur.closed) {
      cur = { closed: false, v: [[x, y]], i: [[0, 0]], o: [[0, 0]] };
      contours.push(cur);
    }
  };
  const moveTo = (nx, ny) => {
    cur = { closed: false, v: [[nx, ny]], i: [[0, 0]], o: [[0, 0]] };
    contours.push(cur);
    x = sx = nx;
    y = sy = ny;
  };
  const cubic = (c1x, c1y, c2x, c2y, ex, ey) => {
    ensure();
    const n = cur.v.length - 1;
    cur.o[n] = [c1x - x, c1y - y];
    cur.v.push([ex, ey]);
    cur.i.push([c2x - ex, c2y - ey]);
    cur.o.push([0, 0]);
    x = ex;
    y = ey;
  };
  const lineTo = (ex, ey) => cubic(x, y, ex, ey, ex, ey);
  const close = () => {
    if (!cur) return;
    const n = cur.v.length - 1;
    const [fx, fy] = cur.v[0];
    if (n > 0 && Math.hypot(cur.v[n][0] - fx, cur.v[n][1] - fy) < 1e-6) {
      cur.i[0] = cur.i[n];
      cur.v.pop();
      cur.i.pop();
      cur.o.pop();
    }
    cur.closed = true;
    x = sx;
    y = sy;
  };

  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i];
      i += 1;
    } else if (!cmd) {
      throw new Error(`path must start with a command: "${d}"`);
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case "M": {
        moveTo(ox + num(), oy + num());
        cmd = rel ? "l" : "L"; // implicit lineto for following pairs
        prevCubic = prevQuad = null;
        break;
      }
      case "L":
        lineTo(ox + num(), oy + num());
        prevCubic = prevQuad = null;
        break;
      case "H":
        lineTo((rel ? x : 0) + num(), y);
        prevCubic = prevQuad = null;
        break;
      case "V":
        lineTo(x, (rel ? y : 0) + num());
        prevCubic = prevQuad = null;
        break;
      case "C": {
        const c1x = ox + num();
        const c1y = oy + num();
        const c2x = ox + num();
        const c2y = oy + num();
        const ex = ox + num();
        const ey = oy + num();
        cubic(c1x, c1y, c2x, c2y, ex, ey);
        prevCubic = [c2x, c2y];
        prevQuad = null;
        break;
      }
      case "S": {
        const c1 = prevCubic ? [2 * x - prevCubic[0], 2 * y - prevCubic[1]] : [x, y];
        const c2x = ox + num();
        const c2y = oy + num();
        const ex = ox + num();
        const ey = oy + num();
        cubic(c1[0], c1[1], c2x, c2y, ex, ey);
        prevCubic = [c2x, c2y];
        prevQuad = null;
        break;
      }
      case "Q":
      case "T": {
        let qx;
        let qy;
        if (cmd.toUpperCase() === "Q") {
          qx = ox + num();
          qy = oy + num();
        } else {
          [qx, qy] = prevQuad ? [2 * x - prevQuad[0], 2 * y - prevQuad[1]] : [x, y];
        }
        const ex = ox + num();
        const ey = oy + num();
        cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey);
        prevQuad = [qx, qy];
        prevCubic = null;
        break;
      }
      case "A": {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = num();
        const sweep = num();
        const ex = ox + num();
        const ey = oy + num();
        for (const seg of arcToCubics(x, y, rx, ry, rot, large, sweep, ex, ey)) cubic(...seg);
        prevCubic = prevQuad = null;
        break;
      }
      case "Z":
        close();
        prevCubic = prevQuad = null;
        break;
      default:
        throw new Error(`unsupported path command ${cmd} in "${d}"`);
    }
  }
  return contours;
}

// ---- angles & geometry helpers --------------------------------------------

/** Point at `deg` on a circle; 0° = 3 o'clock, clockwise (screen y-down). */
export function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Clock-dial angle (0 = 12 o'clock, clockwise) → polar() degrees. */
export const clockDeg = (deg) => deg - 90;

/** SVG `d` for an open circular arc from a0 to a1 (polar degrees, clockwise). */
export function arcD(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${x0} ${y0} A${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
}

/** SVG `d` for a pie slice. */
export function pieD(cx, cy, r, a0, a1) {
  return `M${cx} ${cy} L${polar(cx, cy, r, a0).join(" ")} ${arcD(cx, cy, r, a0, a1).replace(/^M[^A]+/, "")} Z`;
}

/** Apply a transform {p, a, s, r} (s in %, r in degrees) to a local point. */
export function xfPoint([x, y], { p = [0, 0], a = [0, 0], s = 100, r = 0 } = {}) {
  const [sx, sy] = typeof s === "number" ? [s / 100, s / 100] : [s[0] / 100, s[1] / 100];
  const lx = (x - a[0]) * sx;
  const ly = (y - a[1]) * sy;
  const rad = (r * Math.PI) / 180;
  return [p[0] + lx * Math.cos(rad) - ly * Math.sin(rad), p[1] + lx * Math.sin(rad) + ly * Math.cos(rad)];
}

/** Clip the infinite line through `p0` with direction `dir` to a convex polygon. */
export function clipLine(polygon, p0, dir) {
  let t0 = -Infinity;
  let t1 = Infinity;
  const n = polygon.length;
  // signed area tells us which side is "inside"
  let area = 0;
  for (let k = 0; k < n; k += 1) {
    const [ax, ay] = polygon[k];
    const [bx, by] = polygon[(k + 1) % n];
    area += ax * by - bx * ay;
  }
  const inside = area > 0 ? 1 : -1;
  for (let k = 0; k < n; k += 1) {
    const [ax, ay] = polygon[k];
    const [bx, by] = polygon[(k + 1) % n];
    const ex = bx - ax;
    const ey = by - ay;
    // inward normal
    const nx = -ey * inside;
    const ny = ex * inside;
    const denom = nx * dir[0] + ny * dir[1];
    const numer = nx * (p0[0] - ax) + ny * (p0[1] - ay);
    if (Math.abs(denom) < 1e-12) {
      if (numer < 0) return null;
      continue;
    }
    const t = -numer / denom;
    if (denom > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null;
  return [
    [p0[0] + dir[0] * t0, p0[1] + dir[1] * t0],
    [p0[0] + dir[0] * t1, p0[1] + dir[1] * t1],
  ];
}

// ---------------------------------------------------------------------------
// Paint, modifiers, transforms
// ---------------------------------------------------------------------------

export function fl(color, opacity = 100) {
  return { ty: "fl", c: prop(color, "col"), o: prop(opacity, "num") };
}

const CAPS = { butt: 1, round: 2, square: 3 };
const JOINS = { miter: 1, round: 2, bevel: 3 };

export function st(color, width, { o = 100, dash, cap = "round", join = "round" } = {}) {
  const out = {
    ty: "st",
    c: prop(color, "col"),
    o: prop(o, "num"),
    w: prop(width, "num"),
    lc: CAPS[cap],
    lj: JOINS[join],
  };
  if (join === "miter") out.ml = 4;
  if (dash) {
    out.d = [
      { n: "d", nm: "dash", v: prop(dash[0], "num") },
      { n: "g", nm: "gap", v: prop(dash[1], "num") },
      { n: "o", nm: "offset", v: prop(dash[2] ?? 0, "num") },
    ];
  }
  return out;
}

export function tm({ s = 0, e = 100, o = 0 } = {}) {
  return { ty: "tm", s: prop(s, "num"), e: prop(e, "num"), o: prop(o, "num"), m: 1 };
}

/**
 * Group transform (2D). s may be a number (uniform %). Static default p / a /
 * s / r are omitted (optional in the Lottie spec; lottie-web defaults them).
 * `o` is always written: lottie-web's SVG renderer reads it unconditionally
 * (SVGTransformData → op.effectsSequence) and fails without it.
 */
export function tr({ p = [0, 0], a = [0, 0], s = 100, r = 0, o = 100 } = {}) {
  const out = { ty: "tr" };
  const same = (v, d) => !isAnim(v) && JSON.stringify(v) === JSON.stringify(d);
  if (!same(p, [0, 0])) out.p = prop(p, "v2");
  if (!same(a, [0, 0])) out.a = prop(a, "v2");
  if (!same(s, 100) && !same(s, [100, 100])) out.s = prop(s, "s2");
  if (!same(r, 0)) out.r = prop(r, "num");
  out.o = prop(o, "num");
  return out;
}

function paintFill(f) {
  if (typeof f === "string" || isAnim(f)) return fl(f);
  return fl(f.c, f.o ?? 100);
}

function paintStroke(s) {
  if (typeof s === "string") return st(s, 2);
  return st(s.c, s.w ?? 2, s);
}

/**
 * Leaf group: geometry + paint + transform.
 *   leaf("cup", rc({w: 20, h: 30}), { fill: C.white, stroke: {c, w}, trim: {e}, p, s, r, o, a })
 * Paint order (Lottie: first = top): geometry, trim, stroke, fill, transform —
 * so the stroke sits on top of the fill.
 */
export function leaf(name, geoms, { fill, stroke, trim, p, a, s, r, o } = {}) {
  const it = [geoms].flat(Infinity).filter(Boolean);
  if (it.length === 0) throw new Error(`leaf ${name} has no geometry`);
  if (trim) it.push(tm(trim));
  if (stroke) it.push(paintStroke(stroke));
  if (fill) it.push(paintFill(fill));
  if (!fill && !stroke) throw new Error(`leaf ${name} has no paint`);
  it.push(tr({ p, a, s, r, o }));
  return { ty: "gr", nm: name, it };
}

/** Composite group; children listed BACK-TO-FRONT. */
export function group(name, children, xf = {}) {
  const it = [children].flat(Infinity).filter(Boolean).reverse();
  return { ty: "gr", nm: name, it: [...it, tr(xf)] };
}

// ---------------------------------------------------------------------------
// Layers and composition
// ---------------------------------------------------------------------------

function layerKs({ p = [0, 0], a = [0, 0], s = 100, r = 0, o = 100 }) {
  return { o: prop(o, "num"), r: prop(r, "num"), p: prop(p, "v3"), a: prop(a, "v3"), s: prop(s, "s3") };
}

/** Shape layer; children listed BACK-TO-FRONT. `parent` is another layer's name. */
export function layer(name, children, { parent, ip, op, ...xf } = {}) {
  return {
    ddd: 0,
    ty: 4,
    nm: name,
    sr: 1,
    ks: layerKs(xf),
    ao: 0,
    shapes: [children].flat(Infinity).filter(Boolean).reverse(),
    ip,
    op,
    st: 0,
    bm: 0,
    _parent: parent,
  };
}

/** Null layer (no drawing) for parenting. */
export function nullLayer(name, { parent, ip, op, ...xf } = {}) {
  return { ddd: 0, ty: 3, nm: name, sr: 1, ks: layerKs(xf), ao: 0, ip, op, st: 0, bm: 0, _parent: parent };
}

/** Whole animation. `layers` BACK-TO-FRONT; `poster` = frame for reduced motion. */
export function comp({ name, seconds, poster, layers }) {
  const op = Math.round(seconds * FR);
  const ordered = layers.filter(Boolean).reverse();
  const names = new Map();
  ordered.forEach((L, idx) => {
    if (names.has(L.nm)) throw new Error(`${name}: duplicate layer name ${L.nm}`);
    L.ind = idx + 1;
    names.set(L.nm, L.ind);
  });
  const finished = ordered.map((L) => {
    const { _parent, ...rest } = L;
    const out = { ddd: 0, ind: L.ind, ty: L.ty, nm: L.nm, sr: 1, ks: L.ks, ao: 0 };
    if (_parent !== undefined) {
      if (!names.has(_parent)) throw new Error(`${name}: layer ${L.nm} has unknown parent ${_parent}`);
      out.parent = names.get(_parent);
    }
    if (rest.ty === 4) out.shapes = rest.shapes;
    out.ip = rest.ip ?? 0;
    out.op = rest.op ?? op;
    out.st = 0;
    out.bm = 0;
    return out;
  });
  return {
    v: "5.7.4",
    fr: FR,
    ip: 0,
    op,
    w: W,
    h: H,
    nm: name,
    ddd: 0,
    assets: [],
    markers: [{ tm: poster, cm: "poster", dr: 0 }],
    layers: finished,
  };
}

// ---------------------------------------------------------------------------
// Motion helpers (all return anim() values that start and end at rest, so
// the loop has no jump).
// ---------------------------------------------------------------------------

/** Scale 0 → max with overshoot at tIn; back to 0 at tOut (if given). */
export function popScale(tIn, { dur = 12, tOut, outDur = 10, max = 100, from = 0 } = {}) {
  const frames = [
    [tIn, from, "back"],
    [tIn + dur, max],
  ];
  if (tOut !== undefined) frames.push([tOut, max, "in"], [tOut + outDur, from]);
  return anim(...frames);
}

/** Opacity 0 → max at tIn; back to 0 at tOut (if given). */
export function fade(tIn, { dur = 10, tOut, outDur = 10, max = 100, easeIn = "out", easeOut = "in" } = {}) {
  const frames = [
    [tIn, 0, easeIn],
    [tIn + dur, max],
  ];
  if (tOut !== undefined) frames.push([tOut, max, easeOut], [tOut + outDur, 0]);
  return anim(...frames);
}

/** Quick press: 100 → depth → 100. */
export function press(t0, { dur = 8, depth = 92, base = 100 } = {}) {
  return anim([t0, base, "inOut"], [t0 + dur / 2, depth, "back"], [t0 + dur, base]);
}

/** Trim end 0 → 100 at tIn (draw), reset to 0 at tReset (hold, while hidden). */
export function draw(tIn, { dur = 12, tReset, e = "inOut" } = {}) {
  const frames = [
    [tIn, 0, e],
    [tIn + dur, 100, tReset !== undefined ? "hold" : "inOut"],
  ];
  if (tReset !== undefined) frames.push([tReset, 0]);
  return anim(...frames);
}

/** Back-and-forth wiggle (rotation) starting at t0: 0, +a1, -a2, ..., 0. */
export function wiggle(t0, amps, step = 4, e = "inOut") {
  const frames = [[t0, 0, e]];
  amps.forEach((amp, idx) => frames.push([t0 + step * (idx + 1), amp, e]));
  frames.push([t0 + step * (amps.length + 1), 0]);
  return anim(...frames);
}
