/**
 * Reusable props for the Loodly story scenes (brief §4.2). Every prop returns
 * a group drawn around its own pivot (noted per prop) and accepts the usual
 * transform options: { x, y } or p, s (%), r (deg), o (%), a — static or anim().
 */
import { C, anim, arcD, circ, clipLine, clockDeg, el, group, isAnim, leaf, pieD, poly, polar, rc, sh } from "./lib.mjs";

/** Transform options → group transform. */
export const xf = ({ x = 0, y = 0, p, a, s, r, o } = {}) => ({ p: p ?? [x, y], a, s, r, o });

/**
 * Stroke width that still renders at ≥ 2 px when the prop is drawn at `k` %
 * of its size (brief §4.1: no stroke under 2 px at 1×). Props take `k` (the
 * effective on-screen scale, layer scale included); it defaults to their own
 * static `s`.
 */
export const px = (base, k = 100) => Math.max(base, 200 / k);
const kOf = (t) => t.k ?? (typeof t.s === "number" ? t.s : 100);

// ---------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------

/** Text stand-in. Left-aligned by default: scale grows from the left edge at (x, y). */
export function skeleton(w, { title = false, c = C.espresso, op, align = "left", h, name = "skeleton", ...t } = {}) {
  const hh = h ?? (title ? 10 : 8);
  const cx = align === "left" ? w / 2 : 0;
  return leaf(name, rc({ w, h: hh, r: hh / 2, x: cx }), {
    fill: { c, o: op ?? (title ? 22 : 14) },
    ...xf(t),
  });
}

/** Button-like pill with a white label bar. Pivot: centre. */
export function pill(w, h, { c = C.berry, label = true, labelW, name = "pill", ...t } = {}) {
  return group(
    name,
    [
      leaf("bg", rc({ w, h, r: h / 2 }), { fill: c }),
      label &&
        leaf("label", rc({ w: labelW ?? w * 0.5, h: Math.max(4, Math.round(h * 0.28)), r: 2 }), {
          fill: { c: C.white, o: 75 },
        }),
    ],
    xf(t),
  );
}

/** Points coin. Pivot: centre. */
export function coin({ r = 14, name = "coin", ...t } = {}) {
  return group(
    name,
    [
      leaf("edge", circ(r, 0, r * 0.16), { fill: C.crust }),
      leaf("face", circ(r), { fill: C.mango }),
      r >= 10
        ? leaf("ring", circ((r * 9) / 14), { stroke: { c: C.cream, w: Math.max(2, (r * 2.5) / 14) } })
        : leaf("dot", circ(r * 0.36), { fill: C.cream }),
      leaf("shine", el({ w: r * 0.46, h: r * 0.3, x: -r * 0.38, y: -r * 0.46 }), { fill: { c: C.white, o: 50 } }),
    ],
    xf(t),
  );
}

/** Map pin. Pivot: the tip. */
export function pin({ name = "pin", shadow = true, ...t } = {}) {
  return group(
    name,
    [
      shadow && leaf("shadow", el({ w: 16, h: 5, y: 1 }), { fill: { c: C.espresso, o: 12 } }),
      leaf("drop", sh("M0 0 C-3 -5 -12 -11 -12 -20 A12 12 0 0 1 12 -20 C12 -11 3 -5 0 0 Z"), { fill: C.berry }),
      leaf("dot", circ(5, 0, -20), { fill: C.cream }),
    ],
    xf(t),
  );
}

/** Success badge with a drawable tick (`drawn` = trim end, static or anim). Pivot: centre. */
export function check({ r = 20, drawn = 100, bg = C.pistachio, fg = C.white, name = "check", ...t } = {}) {
  return group(
    name,
    [
      leaf("disc", circ(r), { fill: bg }),
      leaf(
        "tick",
        poly([
          [-0.45 * r, 0.02 * r],
          [-0.1 * r, 0.36 * r],
          [0.48 * r, -0.32 * r],
        ]),
        { stroke: { c: fg, w: Math.max(2, 0.22 * r) }, trim: { e: drawn } },
      ),
    ],
    xf(t),
  );
}

/** Stand-alone tick (no disc). Pivot: centre of a 2r box. */
export function tick({ r = 8, drawn = 100, c = C.white, w = 3, name = "tick", ...t } = {}) {
  return leaf(
    name,
    poly([
      [-0.75 * r, 0],
      [-0.2 * r, 0.55 * r],
      [0.8 * r, -0.55 * r],
    ]),
    { stroke: { c, w }, trim: { e: drawn }, ...xf(t) },
  );
}

/** Expanding ring for taps / pulses at the given start frames. Pivot: centre. */
export function ripple(times, { r = 14, dur = 14, c = C.berry, w = 3, from = 40, to = 160, peak = 80, name = "ripple", x = 0, y = 0 } = {}) {
  const ts = [times].flat();
  const sFrames = [];
  const oFrames = [];
  ts.forEach((t0, k) => {
    sFrames.push([t0, from, "out"], [t0 + dur, to, "hold"]);
    oFrames.push([t0 - 1, 0, "hold"], [t0, peak, "out"], [t0 + dur, 0, k === ts.length - 1 ? "inOut" : "hold"]);
  });
  sFrames.push([ts[ts.length - 1] + dur + 1, from]);
  return leaf(name, circ(r), {
    stroke: { c, w },
    p: [x, y],
    s: anim(...sFrames),
    o: anim(...oFrames),
  });
}

/** Three concentric "sound" arcs opening to the right; rotate to aim. arcO: per-arc opacity. Pivot: arc centre. */
export function soundArcs({ arcO = [100, 100, 100], c = C.berry, name = "arcs", ...t } = {}) {
  return group(
    name,
    [8, 15, 22].map((rr, k) => leaf(`arc${k}`, sh(arcD(0, 0, rr, -40, 40)), { stroke: { c, w: px(3, kOf(t)) }, o: arcO[k] })),
    xf(t),
  );
}

export const SPARKLE_D = "M0 -7 C1 -2 2 -1 7 0 C2 1 1 2 0 7 C-1 2 -2 1 -7 0 C-2 -1 -1 -2 0 -7 Z";
export const HEART_D =
  "M0 7 C-6 2.5 -9 -0.5 -9 -4 C-9 -7 -6.8 -9 -4.5 -9 C-2.6 -9 -1 -8 0 -6.2 C1 -8 2.6 -9 4.5 -9 C6.8 -9 9 -7 9 -4 C9 -0.5 6 2.5 0 7 Z";

export const sparkle = ({ c = C.mango, name = "sparkle", ...t } = {}) => leaf(name, sh(SPARKLE_D), { fill: c, ...xf(t) });
export const heart = ({ c = C.strawberry, name = "heart", ...t } = {}) => leaf(name, sh(HEART_D), { fill: c, ...xf(t) });

/** Bell. Pivot: the hanger at the top (so it swings). */
export function bell({ name = "bell", ...t } = {}) {
  return group(
    name,
    [
      leaf("hanger", circ(3, 0, 3), { stroke: { c: C.mango, w: px(2.5, kOf(t)) } }),
      leaf("clapper", circ(3.5, 0, 28), { fill: C.espressoLight }),
      leaf(
        "body",
        sh("M-13 25 L13 25 C11 23 10 20 10 15 C10 8.5 6 6 0 6 C-6 6 -10 8.5 -10 15 C-10 20 -11 23 -13 25 Z"),
        { fill: C.mango, stroke: { c: C.mango, w: px(2, kOf(t)) } },
      ),
      leaf("rim", rc({ w: 29, h: 4.5, r: 2.25, y: 25 }), { fill: C.mango }),
      leaf("shine", el({ w: 3.5, h: 9, x: -5, y: 14 }), { fill: { c: C.white, o: 45 } }),
    ],
    xf(t),
  );
}

/** Barcode (16 bars). Pivot: centre. */
const BAR_W = [2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3];
export function barcode({ h = 46, gap = 2, c = C.espresso, name = "barcode", ...t } = {}) {
  const total = BAR_W.reduce((a, b) => a + b, 0) + gap * (BAR_W.length - 1);
  let x = -total / 2;
  const bars = BAR_W.map((w) => {
    const bar = rc({ w, h, x: x + w / 2 });
    x += w + gap;
    return bar;
  });
  return leaf(name, bars, { fill: c, ...xf(t) });
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

/** Phone 112×208. Pivot: centre. `screen` children are drawn in phone space. */
export function phone({ screen = [], name = "phone", ...t } = {}) {
  return group(
    name,
    [
      leaf("body", rc({ w: 112, h: 208, r: 20 }), { fill: C.espresso }),
      leaf("screen", rc({ w: 100, h: 196, r: 14 }), { fill: C.cream }),
      screen,
      leaf("speaker", rc({ w: 26, h: 5, r: 2.5, y: -90 }), { fill: C.espressoLight }),
    ],
    xf(t),
  );
}

/**
 * Tablet 250×176 with a uniform 12 px bezel (screen 226×152), propped on a
 * slim kickstand behind it — a tablet, not a monitor (no neck, no base).
 * Pivot: centre of the body.
 */
export function tablet({ screen = [], stand = true, name = "tablet", ...t } = {}) {
  return group(
    name,
    [
      stand && leaf("shadow", el({ w: 200, h: 10, y: 100 }), { fill: { c: C.espresso, o: 8 } }),
      stand && leaf("leg", poly([[70, 60], [88, 60], [112, 104], [96, 104]], true), { fill: C.espressoLight }),
      leaf("body", rc({ w: 250, h: 176, r: 22 }), { fill: C.espresso }),
      leaf("screen", rc({ w: 226, h: 152, r: 12 }), { fill: C.cream }),
      leaf("camera", circ(2.5, 0, -82), { fill: C.espressoLight }),
      screen,
    ],
    xf(t),
  );
}

/** Laptop: lid 264×170 centred at (0,-10), base at y 81. Pivot: (0,0). */
export function laptop({ screen = [], name = "laptop", ...t } = {}) {
  return group(
    name,
    [
      leaf("lid", rc({ w: 264, h: 170, r: 12, y: -10 }), { fill: C.espresso }),
      leaf("screen", rc({ w: 248, h: 154, r: 6, y: -10 }), { fill: C.cream }),
      leaf("camera", circ(2, 0, -91), { fill: C.espressoLight }),
      screen,
      leaf("base", rc({ w: 312, h: 12, r: 6, y: 81 }), { fill: C.espressoLight }),
      leaf("groove", rc({ w: 52, h: 4, r: 2, y: 77 }), { fill: C.espresso }),
    ],
    xf(t),
  );
}

/** Hand-held barcode scanner; the scan window (nose) points to -x. Pivot: centre of the head. */
export function scannerGun({ name = "scanner", led = C.espresso, ...t } = {}) {
  return group(
    name,
    [
      leaf("grip", rc({ w: 24, h: 58, r: 10 }), { fill: C.espresso, p: [17, 32], r: -18 }),
      leaf("trigger", rc({ w: 8, h: 15, r: 4 }), { fill: C.espressoDark, p: [3, 25], r: -18 }),
      leaf("head", rc({ w: 74, h: 34, r: 12 }), { fill: C.espressoLight }),
      leaf("nose", rc({ w: 10, h: 28, r: 4, x: -36 }), { fill: C.strawberry }),
      leaf("shine", rc({ w: 30, h: 5, r: 2.5, x: 6, y: -9 }), { fill: { c: C.white, o: 22 } }),
      leaf("led", circ(3.5, 24, 3), { fill: led }),
    ],
    xf(t),
  );
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

/** Shop front 84×62 with a striped, scalloped awning. Pivot: bottom-centre. */
export function storefront({ door = C.espressoLight, awningR, windows = { c: C.strawberry, o: 28 }, name = "store", ...t } = {}) {
  const bands = 9;
  const bw = 96 / bands;
  const stripes = [];
  const scallopsBerry = [];
  const scallopsCream = [];
  for (let k = 0; k < bands; k += 1) {
    const cx = -48 + bw * (k + 0.5);
    if (k % 2 === 1) stripes.push(rc({ w: bw, h: 20, x: cx, y: -62 }));
    (k % 2 === 1 ? scallopsCream : scallopsBerry).push(circ(bw / 2, cx, -52));
  }
  return group(
    name,
    [
      leaf("body", rc({ w: 84, h: 62, r: 6, y: -31 }), { fill: C.white }),
      leaf("windows", [rc({ w: 22, h: 16, r: 3, x: -26, y: -27 }), rc({ w: 22, h: 16, r: 3, x: 26, y: -27 })], {
        fill: windows,
      }),
      leaf("door", rc({ w: 18, h: 30, r: 3, y: -15 }), { fill: door }),
      group(
        "awning",
        [
          leaf("awningBase", rc({ w: 96, h: 20, r: 6, y: -62 }), { fill: C.berry }),
          leaf("stripes", stripes, { fill: C.cream }),
          leaf("scallopsB", scallopsBerry, { fill: C.berry }),
          leaf("scallopsC", scallopsCream, { fill: C.cream }),
        ],
        { a: [0, -72], p: [0, -72], r: awningR ?? 0 },
      ),
    ],
    xf(t),
  );
}

/** House. Pivot: bottom-centre. */
export function house({ door = C.espressoLight, name = "house", ...t } = {}) {
  return group(
    name,
    [
      leaf("chimney", rc({ w: 10, h: 18, r: 2, x: 19, y: -62 }), { fill: C.espressoLight }),
      leaf("body", rc({ w: 64, h: 50, r: 4, y: -25 }), { fill: C.white }),
      leaf("roof", poly([[-36, -46], [0, -74], [36, -46]], true), { fill: C.berry, stroke: { c: C.berry, w: 5 } }),
      leaf("window", rc({ w: 16, h: 14, r: 3, x: 15, y: -27 }), { fill: { c: C.strawberry, o: 28 } }),
      leaf("door", rc({ w: 14, h: 22, r: 3, x: -11, y: -11 }), { fill: door }),
    ],
    xf(t),
  );
}

/** Office block. Pivot: bottom-centre. */
export function office({ name = "office", ...t } = {}) {
  const wins = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) wins.push(rc({ w: 12, h: 10, r: 2, x: col ? 10 : -10, y: -56 + row * 18 }));
  }
  return group(
    name,
    [
      leaf("body", rc({ w: 54, h: 70, r: 5, y: -35 }), { fill: C.espressoLight }),
      leaf("windows", wins, { fill: C.cream }),
    ],
    xf(t),
  );
}

/** Tree. Pivot: bottom-centre. */
export function tree({ name = "tree", ...t } = {}) {
  return group(
    name,
    [
      leaf("trunk", rc({ w: 8, h: 24, r: 3, y: -12 }), { fill: C.espressoLight }),
      leaf("crown", circ(22, 0, -40), { fill: C.pistachio }),
      leaf("shine", circ(6, -8, -48), { fill: { c: C.white, o: 30 } }),
    ],
    xf(t),
  );
}

/** Map ground in canvas coordinates (no transform). roads/minor/parks are SVG `d` strings. */
export function cityMap({ cx = 240, cy = 180, w = 410, h = 270, roads = [], minor = [], parks = [], roadW = 14, name = "map" } = {}) {
  return group(name, [
    leaf("ground", rc({ w, h, r: 22, x: cx, y: cy }), { fill: C.creamDeep }),
    parks.length > 0 && leaf("parks", parks.map((d) => sh(d)), { fill: { c: C.pistachio, o: 35 } }),
    minor.length > 0 && leaf("minor", minor.map((d) => sh(d)), { stroke: { c: C.white, w: 6, o: 75 } }),
    roads.length > 0 && leaf("roads", roads.map((d) => sh(d)), { stroke: { c: C.white, w: roadW } }),
  ]);
}

// ---------------------------------------------------------------------------
// Things
// ---------------------------------------------------------------------------

/** Envelope 96×64; the flap hinges on the top edge (flapS = scale, e.g. [100,-100] = open). Pivot: centre. */
export function envelope({ flapS = 100, name = "envelope", ...t } = {}) {
  return group(
    name,
    [
      leaf("body", rc({ w: 96, h: 64, r: 8 }), { fill: C.white, stroke: { c: C.espresso, o: 14, w: 2 } }),
      leaf("fold", sh("M-42 27 L0 3 L42 27"), { stroke: { c: C.espresso, o: 12, w: 2 } }),
      group(
        "flap",
        [
          leaf("flapShape", poly([[-42, -30], [0, 5], [42, -30]], true), { fill: C.mango, stroke: { c: C.mango, w: 4 } }),
          leaf("seal", circ(8.5, 0, -3), { fill: C.berry }),
          leaf("sealMark", circ(3, 0, -3), { fill: { c: C.white, o: 70 } }),
        ],
        { a: [0, -31], p: [0, -31], s: flapS },
      ),
    ],
    xf(t),
  );
}

/** Wall clock; the berry wedge marks 10:00–14:00. handR = hand rotation (deg from 12). Pivot: centre. */
export function clock({ r = 40, handR = 0, wedgeO = 25, name = "clock", ...t } = {}) {
  const ticks = [0, 90, 180, 270].map((a) => {
    const [x0, y0] = polar(0, 0, r - 11, a);
    const [x1, y1] = polar(0, 0, r - 6, a);
    return poly([[x0, y0], [x1, y1]]);
  });
  return group(
    name,
    [
      leaf("shadow", circ(r + 2, 0, 4), { fill: { c: C.espresso, o: 8 } }),
      leaf("face", circ(r), { fill: C.white, stroke: { c: C.espresso, w: 4 } }),
      leaf("wedge", sh(pieD(0, 0, r - 4, clockDeg(-60), clockDeg(60))), { fill: { c: C.berry, o: wedgeO } }),
      leaf("ticks", ticks, { stroke: { c: C.espresso, w: 3 } }),
      leaf("hand", rc({ w: 5, h: 32, r: 2.5, y: -12 }), { fill: C.espresso, r: handR }),
      leaf("hub", circ(4.5), { fill: C.berry }),
    ],
    xf(t),
  );
}

/** "×2" promotion badge. Pivot: centre. */
export function x2Badge({ name = "x2", ...t } = {}) {
  return group(
    name,
    [
      leaf("disc", circ(18), { fill: C.berry }),
      leaf(
        "glyph",
        [
          poly([[-11.5, -4.5], [-4.5, 2.5]]),
          poly([[-11.5, 2.5], [-4.5, -4.5]]),
          sh("M1.5 -3.5 C1.5 -7.5 9.5 -7.5 9.5 -3 C9.5 0 5.5 2.5 1.5 6 L10 6"),
        ],
        { stroke: { c: C.white, w: 3.5 } },
      ),
    ],
    xf(t),
  );
}

/** Gift box base 64×46. Pivot: bottom-centre. */
export function giftBase({ name = "giftBase", ...t } = {}) {
  return group(
    name,
    [
      leaf("box", rc({ w: 64, h: 46, r: 4, y: -23 }), { fill: C.berry }),
      leaf("shade", rc({ w: 64, h: 6, y: -43 }), { fill: { c: C.berryDark, o: 45 } }),
      leaf("ribbon", rc({ w: 10, h: 46, y: -23 }), { fill: C.cream }),
    ],
    xf(t),
  );
}

/** Gift box lid 72×16 with a bow. Pivot: centre of the lid. */
export function giftLid({ name = "giftLid", ...t } = {}) {
  return group(
    name,
    [
      leaf("bowL", sh("M0 -8 C-5 -21 -19 -21 -15 -12 C-12 -7 -6 -8 0 -8 Z"), { stroke: { c: C.cream, w: 4 } }),
      leaf("bowR", sh("M0 -8 C5 -21 19 -21 15 -12 C12 -7 6 -8 0 -8 Z"), { stroke: { c: C.cream, w: 4 } }),
      leaf("lid", rc({ w: 72, h: 16, r: 4 }), { fill: C.berryDark }),
      leaf("ribbon", rc({ w: 10, h: 16 }), { fill: C.cream }),
      leaf("knot", circ(4, 0, -8), { fill: C.cream }),
    ],
    xf(t),
  );
}

/** Take-away bag 34×40. Pivot: centre. */
export function bag({ name = "bag", ...t } = {}) {
  return group(
    name,
    [
      leaf("handle", sh("M-8 -12 C-8 -25 8 -25 8 -12"), { stroke: { c: C.crust, w: px(3, kOf(t)) } }),
      leaf("body", rc({ w: 34, h: 40, r: 4, y: 4 }), { fill: C.wafer }),
      leaf("fold", rc({ w: 34, h: 5, y: -13.5 }), { fill: { c: C.crust, o: 55 } }),
      leaf("sticker", circ(5.5, 0, 6), { fill: C.cream }),
    ],
    xf(t),
  );
}

/** Delivery courier on a scooter. wheelR: wheel rotation, bob: rider tilt. Pivot: ground between the wheels. */
export function courier({ wheelR = 0, bob = 0, name = "courier", ...t } = {}) {
  const k = kOf(t);
  const wheel = (nm, x) =>
    group(
      nm,
      [
        leaf("tyre", circ(10), { stroke: { c: C.espresso, w: px(4, k) } }),
        leaf("spokes", [poly([[-6, 0], [6, 0]]), poly([[0, -6], [0, 6]])], { stroke: { c: C.espressoLight, w: px(2, k) } }),
      ],
      { p: [x, -12], r: wheelR },
    );
  return group(
    name,
    [
      leaf("shadow", el({ w: 70, h: 7, y: 1 }), { fill: { c: C.espresso, o: 10 } }),
      wheel("wheelB", -21),
      wheel("wheelF", 23),
      group(
        "rider",
        [
          leaf("box", rc({ w: 28, h: 24, r: 4, x: -20, y: -31 }), { fill: C.mango }),
          leaf("boxDot", circ(4.5, -20, -31), { fill: C.cream }),
          leaf("deck", rc({ w: 50, h: 7, r: 3.5, y: -16 }), { fill: C.berryDark }),
          leaf("column", poly([[19, -16], [12, -50]]), { stroke: { c: C.espressoLight, w: 4 } }),
          leaf("bar", poly([[7, -50], [16, -50]]), { stroke: { c: C.espressoLight, w: 4 } }),
          leaf("leg", poly([[0, -28], [5, -18]]), { stroke: { c: C.espresso, w: 5 } }),
          leaf("torso", rc({ w: 14, h: 26, r: 7 }), { fill: C.berry, p: [0, -38], r: 14 }),
          leaf("arm", poly([[3, -44], [10, -49]]), { stroke: { c: C.berry, w: 4 } }),
          leaf("head", circ(7, 4, -58), { fill: C.wafer }),
          leaf("helmet", sh("M-3.8 -57 A7.8 7.8 0 0 1 11.8 -57 Z"), { fill: C.mango, stroke: { c: C.mango, w: px(2, k) } }),
        ],
        { a: [0, -16], p: [0, -16], r: bob },
      ),
    ],
    xf(t),
  );
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/** Round face; `smile` = trim end (draw the smile) or { s, e } trim. Pivot: centre. */
export function face({ r = 22, skin = C.creamDeep, hair, glasses = false, smile = 100, name = "face", ...t } = {}) {
  return group(
    name,
    [
      leaf("head", circ(r), { fill: skin }),
      hair &&
        leaf("hair", sh("M-23 -2 C-24 -16 -13 -25 0 -25 C13 -25 24 -16 23 -2 C19 -9 12 -13 4 -12 C-4 -11 -10 -15 -15 -10 C-18 -7 -21 -5 -23 -2 Z"), {
          fill: hair,
        }),
      leaf("cheeks", [circ(3.5, -13, 5), circ(3.5, 13, 5)], { fill: { c: C.strawberry, o: 40 } }),
      leaf("eyes", [el({ w: 4, h: 6, x: -7, y: -3 }), el({ w: 4, h: 6, x: 7, y: -3 })], { fill: C.espresso }),
      glasses && leaf("glasses", [circ(6, -7, -3), circ(6, 7, -3), poly([[-1, -4], [1, -4]])], { stroke: { c: C.espresso, w: 2 } }),
      leaf("smile", sh("M-7 6 C-4 11.5 4 11.5 7 6"), {
        stroke: { c: C.espresso, w: 3 },
        trim: typeof smile === "object" && !isAnim(smile) ? smile : { e: smile },
      }),
    ],
    xf(t),
  );
}

/** Head and shoulders. Pivot: centre of the face. */
export function person({ shirt, skin, hair, glasses = false, smile = 100, name = "person", ...t } = {}) {
  return group(
    name,
    [
      leaf("shoulders", rc({ w: 58, h: 34, r: 17, y: 35 }), { fill: shirt }),
      face({ skin, hair, glasses, smile }),
    ],
    xf(t),
  );
}

// ---------------------------------------------------------------------------
// Food icons (≈ 40–48 px). Generic shapes — never a real brand.
// ---------------------------------------------------------------------------

/** Take-away coffee cup. Pivot: centre of the cup body. */
export function coffeeCup({ steam = true, name = "coffee", ...t } = {}) {
  const k = kOf(t);
  const hw = (y) => 12 - (3 * (y + 10)) / 28;
  return group(
    name,
    [
      steam &&
        leaf("steam", [sh("M-4 -21 C-7 -25 -1 -27 -4 -32"), sh("M4 -21 C1 -25 7 -27 4 -32")], {
          stroke: { c: C.espresso, o: 22, w: px(2.5, k) },
        }),
      leaf("body", poly([[-12, -10], [12, -10], [9, 18], [-9, 18]], true), { fill: C.white, stroke: { c: C.espresso, o: 16, w: px(2, k) } }),
      leaf("base", poly([[-hw(13), 13], [hw(13), 13], [9, 18], [-9, 18]], true), { fill: C.creamDeep }),
      leaf("sleeve", poly([[-hw(-1) - 0.6, -1], [hw(-1) + 0.6, -1], [hw(9) + 0.6, 9], [-hw(9) - 0.6, 9]], true), { fill: C.berry }),
      leaf("lid", rc({ w: 29, h: 6, r: 3, y: -12 }), { fill: C.espressoLight }),
      leaf("lidTop", rc({ w: 20, h: 5, r: 2.5, y: -16 }), { fill: C.espressoLight }),
    ],
    xf(t),
  );
}

/**
 * Croissant: five overlapping segments. Pivot: centre. Below ~50 % on screen
 * the crust outlines would be hairlines, so segments alternate colour instead.
 */
export function croissant({ name = "croissant", ...t } = {}) {
  const k = kOf(t);
  const tiny = k < 50;
  const seg = (nm, w, h, x, y, r, alt) =>
    group(
      nm,
      [
        leaf("seg", el({ w, h }), tiny ? { fill: alt ? C.crust : C.wafer } : { fill: C.wafer, stroke: { c: C.crust, w: px(2, k) } }),
        leaf("hl", el({ w: w * 0.38, h: h * 0.2, y: -h * 0.26 }), { fill: { c: C.creamDeep, o: 60 } }),
      ],
      { p: [x, y], r },
    );
  return group(
    name,
    [
      seg("endL", 10, 14, -18, 5, -52, false),
      seg("endR", 10, 14, 18, 5, 52, false),
      seg("midL", 13, 18, -10.5, -0.5, -26, true),
      seg("midR", 13, 18, 10.5, -0.5, 26, true),
      seg("centre", 15, 21, 0, -2.5, 0, false),
    ],
    xf(t),
  );
}

/** Single scoop on a waffle cone. Pivot: centre. */
export function coneIcon({ scoop = C.strawberry, name = "cone", ...t } = {}) {
  const k = kOf(t);
  return group(
    name,
    [
      leaf("cone", poly([[-10, -2], [10, -2], [0, 22]], true), { fill: C.wafer, stroke: { c: C.wafer, w: 3 } }),
      leaf("lattice", [poly([[-5.5, 1], [2.5, 13]]), poly([[5.5, 1], [-2.5, 13]])], { stroke: { c: C.waferLine, w: px(2, k), o: 60 } }),
      leaf("scoop", circ(11.5, 0, -8), { fill: scoop }),
      leaf("drip", sh("M-11 -5 C-11 1 -8 4 -6.5 0.5 C-5 3.5 -2.5 2.5 -2.5 -1 Z"), { fill: scoop }),
      leaf("shine", circ(3, -4.5, -12.5), { fill: { c: C.white, o: 45 } }),
      leaf("cherry", circ(3.6, 1, -20.5), { fill: C.cherry }),
    ],
    xf(t),
  );
}

/** Slice of layered cake (side view, tip to the left). Pivot: centre. */
export function cakeSlice({ name = "cake", ...t } = {}) {
  const k = kOf(t);
  return group(
    name,
    [
      leaf("back", poly([[14, 14], [19, 10], [19, -10], [14, -6]], true), { fill: C.berryLight }),
      leaf("side", poly([[-18, 14], [14, 14], [14, -6], [-18, 4]], true), { fill: C.strawberry }),
      leaf("cream", poly([[-18, 8.5], [14, 3], [14, 7.5], [-18, 11.5]], true), { fill: C.cream }),
      leaf("jam", poly([[-17, 8], [13, 2.5]]), { stroke: { c: C.berry, w: px(2, k) } }),
      leaf("top", poly([[-18, 4], [14, -6], [19, -10], [-15, 1.5]], true), { fill: C.cream, stroke: { c: C.cream, w: px(2, k) } }),
      leaf("stem", sh("M14 -15 C14 -19 17 -21 19.5 -21"), { stroke: { c: C.pistachio, w: px(2, k) } }),
      leaf("cherry", circ(4.2, 13.5, -11.5), { fill: C.cherry }),
    ],
    xf(t),
  );
}

// ---------------------------------------------------------------------------
// Loodly mark (public/loodly-mark.svg, ported 1:1; the clip-path lattice is
// rebuilt as clipped line segments because mattes are not allowed).
// ---------------------------------------------------------------------------

const MARK_SCOOPS = [
  [34.69, 38.31, 8.9],
  [65.31, 38.31, 8.9],
  [44.48, 30.3, 8.19],
  [55.52, 30.3, 8.19],
  [50, 23.18, 7.66],
  [40.92, 43.83, 9.44],
  [59.08, 43.83, 9.44],
  [50, 36.53, 9.79],
];
const CONE_INSET = [
  [31.88, 47.7],
  [68.12, 47.7],
  [50, 89.76],
];

/** Loodly mark. scale 1 = 100 units (the cone + scoops are ≈ 52×80). Pivot: (50,55) of the source SVG. */
export function mark({ scale = 0.5, lattice = true, name = "mark", ...t } = {}) {
  const tiny = scale < 0.35;
  // keep outlines visible on screen (≥ ~1 px) at small sizes
  const sw = Math.max(1.6, 1 / scale);
  const lw = Math.max(1.5, 1 / scale);
  const parts = [
    leaf("cone", poly([[30.18, 46], [69.82, 46], [50, 92]], true), { fill: C.mango }),
    leaf("coneInset", poly(CONE_INSET, true), { fill: C.logoCream }),
  ];
  if (lattice) {
    const lines = [];
    const step = tiny ? 14.8 : 7.4;
    const add = (p0, dir) => {
      const seg = clipLine(CONE_INSET, p0, dir);
      if (seg && Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) > 2.5) lines.push(poly(seg));
    };
    for (let c = -26.2; c <= 40.5; c += step) add([0, c], [1, 1]);
    for (let d = 73.8; d <= 140.5; d += step) add([0, d], [1, -1]);
    if (lines.length) parts.push(leaf("lattice", lines, { stroke: { c: C.mango, w: lw, cap: "butt" } }));
  }
  if (tiny) {
    // silhouette: a red outline around the scoop cloud (internal lines dropped)
    parts.push(leaf("scoopsOutline", MARK_SCOOPS.map(([cx, cy, rr]) => circ(rr, cx, cy)), { stroke: { c: C.logoBerry, w: sw * 2 } }));
    parts.push(leaf("scoopsFill", MARK_SCOOPS.map(([cx, cy, rr]) => circ(rr, cx, cy)), { fill: C.logoCream }));
  } else {
    MARK_SCOOPS.forEach(([cx, cy, rr], k) =>
      parts.push(leaf(`scoop${k}`, circ(rr, cx, cy), { fill: C.logoCream, stroke: { c: C.logoBerry, w: sw } })),
    );
  }
  parts.push(leaf("rings", [el({ w: 24.4, h: 26, x: 38.6, y: 52 }), el({ w: 24.4, h: 26, x: 61.4, y: 52 })], { fill: C.logoBerry }));
  parts.push(leaf("ringHoles", [el({ w: 14.4, h: 16, x: 38.6, y: 52 }), el({ w: 14.4, h: 16, x: 61.4, y: 52 })], { fill: C.logoCream }));
  const { s, ...rest } = t;
  return group(name, parts, { ...xf(rest), a: [50, 55], s: s ?? scale * 100 });
}
