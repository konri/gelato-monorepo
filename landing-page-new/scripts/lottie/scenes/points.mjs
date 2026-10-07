/**
 * 6 · points — "Points for every purchase — sometimes double" (6 s, poster 100).
 * Coins fly from a purchase (shopping bag) onto the customer's points card
 * and fill a progress bar. While the clock hand passes the highlighted
 * 10:00–14:00 window a "×2" badge is shown and coins arrive in pairs.
 */
import { C, anim, comp, el, group, layer, leaf, rc } from "../lib.mjs";
import { twinkle } from "../motion.mjs";
import { bag, check, clock, coin, croissant, phone, skeleton, sparkle, x2Badge } from "../props.mjs";

const OP = 180;
const START = [306, 290];
const END = [180, 182];
const ARC = { to: [-6, -112], ti: [54, -34] };

// Arrival frames; 80/84 and 100/104 are pairs (double points).
const FLIGHTS = {
  coin1: [30, 80, 140],
  coin2: [50, 100, 160],
  coin3: [84, 104],
};
const FLIGHT = 18;

const blob = layer("blob", [leaf("blob", el({ w: 372, h: 256 }), { fill: { c: C.mango, o: 14 } })], {
  p: [252, 182],
  s: anim([0, 100], [90, 104], [OP, 100]),
});

// --- points card on the phone (phone space; phone centre = 180,190)
// progress fill: [frame, fraction 0..1, ease]; pairs (80/84, 100/104) grow in one go
const FILL = [
  [0, 0], [30, 0, "out"], [38, 0.12, "hold"], [50, 0.12, "out"], [58, 0.24, "hold"],
  [80, 0.24, "out"], [92, 0.48, "hold"], [100, 0.48, "out"], [112, 0.72, "hold"],
  [140, 0.72, "out"], [148, 0.86, "hold"], [160, 0.86, "out"], [168, 1, "hold"], [179, 0],
];
const TRACK = { x: -34, y: 20, w: 60, h: 10 };
const fillFrames = (map) => anim(...FILL.map(([t, f, e]) => [t, map(f), e ?? "inOut"]));
const fillSize = fillFrames((f) => [Math.max(0.001, TRACK.w * f), TRACK.h]);
const fillPos = fillFrames((f) => [TRACK.x + (TRACK.w * f) / 2, TRACK.y]);

// cluster bump on landing
const bumps = [30, 50, 80, 100, 140, 160];
const bumpFrames = [[0, 100]];
bumps.forEach((t) => bumpFrames.push([t, 100, "out"], [t + 3, t === 80 || t === 100 ? 122 : 114, "inOut"], [t + 10, 100]));

const screen = [
  leaf("cardShadow", rc({ w: 86, h: 118, r: 12, y: -15 }), { fill: { c: C.espresso, o: 7 } }),
  leaf("card", rc({ w: 88, h: 120, r: 12, y: -18 }), { fill: C.white }),
  leaf("avatar", el({ w: 26, h: 26, y: -54 }), { fill: C.creamDeep }),
  croissant({ s: 42, y: -53 }),
  skeleton(44, { title: true, align: "center", y: -34 }),
  group(
    "cluster",
    [coin({ r: 9, x: -8, y: 3 }), coin({ r: 9, x: 8, y: 3 }), coin({ r: 9, y: -4 })],
    { p: [0, -8], s: anim(...bumpFrames) },
  ),
  leaf("track", rc({ w: TRACK.w, h: TRACK.h, r: 5, x: TRACK.x + TRACK.w / 2, y: TRACK.y }), { fill: { c: C.espresso, o: 14 } }),
  leaf("fill", rc({ size: fillSize, pos: fillPos, r: 5 }), {
    fill: C.mango,
    o: anim([0, 100], [170, 100, "in"], [178, 0, "hold"], [179, 100]),
  }),
  check({
    r: 9,
    x: 36,
    y: 20,
    drawn: anim([164, 0, "out"], [172, 100, "hold"], [179, 0]),
    s: anim([160, 0, "back"], [170, 100], [172, 100, "in"], [178, 0]),
  }),
  skeleton(60, { align: "center", y: 62 }),
  skeleton(40, { align: "center", y: 76 }),
];

const device = layer("phone", [phone({ screen })], { p: [180, 190] });

const wall = layer("clock", [
  clock({
    handR: anim([0, 180, "linear"], [OP, 540]),
    wedgeO: anim([0, 25], [58, 25, "inOut"], [66, 48, "hold"], [118, 48, "inOut"], [124, 25]),
  }),
], { p: [362, 150] });

const coinLayers = Object.entries(FLIGHTS).map(([name, arrivals]) => {
  const p = [];
  const s = [];
  const o = [[0, 100]];
  arrivals.forEach((t1) => {
    const t0 = t1 - FLIGHT;
    p.push([t0, START, "inOut", ARC], [t1, END, "hold"], [t1 + 1, START, "hold"]);
    s.push([t0, 0, "back"], [t0 + 6, 100, "inOut"], [t1 - 4, 100, "in"], [t1, 70, "hold"], [t1 + 1, 0, "hold"]);
    o.push([t1 - 4, 100, "in"], [t1, 0, "hold"], [t1 + 1, 100, "hold"]);
  });
  return layer(name, [coin({ r: 13 })], { p: anim(...p), s: anim(...s), o: anim(...o) });
});

// The purchase: a take-away bag that squashes as each coin pops out.
const squash = [[0, [100, 100]]];
[12, 32, 62, 82, 122, 142].forEach((t) => {
  const long = t === 62 || t === 82;
  squash.push([t, [100, 100], "inOut"], [t + 3, [108, 92], "inOut"], [t + (long ? 9 : 7), [100, 100]]);
});
const purchase = layer(
  "bag",
  [
    leaf("shadow", el({ w: 52, h: 8, y: 26 }), { fill: { c: C.espresso, o: 10 } }),
    group("squash", [bag()], { a: [0, 24], p: [0, 24], s: anim(...squash) }),
  ],
  { p: [306, 304], s: 125 },
);

const badge = layer("x2", [x2Badge()], {
  p: [404, 106],
  s: anim([58, 0, "back"], [70, 100, "hold"], [118, 100, "in"], [126, 0]),
  r: anim([58, -30, "out"], [70, 0, "inOut"], [82, -8, "inOut"], [94, 8, "inOut"], [106, -4, "inOut"], [116, 0, "hold"], [126, -30]),
});

const sparkles = layer("sparkles", [
  sparkle({ x: 434, y: 84, ...twinkle(62, { dur: 16, max: 150 }) }),
  sparkle({ x: 384, y: 80, ...twinkle(67, { dur: 16, max: 110 }) }),
  sparkle({ x: 428, y: 132, ...twinkle(72, { dur: 16, max: 90 }) }),
]);

export default comp({
  name: "points",
  seconds: 6,
  poster: 100,
  layers: [blob, device, wall, ...coinLayers, purchase, badge, sparkles],
});
