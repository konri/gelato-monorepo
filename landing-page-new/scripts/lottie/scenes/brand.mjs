/**
 * 2 · brand — "Show customers who you are" (5 s, poster 118).
 * In the brand console: a cover banner unrolls, the logo pops in, the brand
 * name and description lines type in, three city tags drop in, Save is
 * pressed and a check confirms.
 */
import { C, anim, circ, comp, el, layer, leaf, rc, group } from "../lib.mjs";
import { growX, twinkle } from "../motion.mjs";
import { check, croissant, laptop, pill, ripple, skeleton, sparkle } from "../props.mjs";

const OP = 150;
/** Visible until t0, faded out by t0 + 12, back to 100 at the loop point (everything is reset by then). */
const fadeOut = (t0 = 130) => anim([0, 100], [t0, 100, "in"], [t0 + 12, 0, "hold"], [OP, 100]);

const blob = layer("blob", [leaf("blob", el({ w: 336, h: 250 }), { fill: { c: C.mango, o: 16 } })], {
  p: [240, 176],
  s: anim([0, 100], [75, 104], [OP, 100]),
});

const device = layer("laptop", [laptop()], { p: [240, 180] });

// Console chrome: the left navigation is always there.
const sidebar = layer(
  "sidebar",
  [
    leaf("panel", rc({ w: 46, h: 154, r: 6 }), { fill: C.berryDark }),
    leaf("logoDot", circ(7, 0, -60), { fill: { c: C.cream, o: 90 } }),
    leaf("navActive", rc({ w: 34, h: 14, r: 7, y: -34 }), { fill: { c: C.white, o: 16 } }),
    leaf("nav", [-34, -16, 2, 20].map((y) => rc({ w: 22, h: 6, r: 3, y })), { fill: { c: C.white, o: 45 } }),
  ],
  { p: [139, 170] },
);

const banner = layer(
  "banner",
  [
    leaf("cover", rc({ w: 178, h: 46, r: 8, y: 23 }), { fill: { c: C.strawberry, o: 45 } }),
    leaf("deco", [circ(15, 62, 16), circ(9, 38, 30), circ(6, 80, 36)], { fill: { c: C.white, o: 32 } }),
  ],
  {
    p: [263, 99],
    s: anim([10, [100, 0], "out"], [26, [100, 100], "hold"], [OP, [100, 0]]),
    o: fadeOut(),
  },
);

const logo = layer(
  "logo",
  [
    leaf("ring", circ(20), { fill: C.white, stroke: { c: C.berry, w: 3 } }),
    group("icon", [croissant({ s: 60, y: 1 })], { r: anim([22, -25, "out"], [40, 0, "hold"], [OP, -25]) }),
  ],
  {
    p: [196, 146],
    s: anim([22, 0, "out"], [33, 110, "inOut"], [40, 100, "hold"], [OP, 0]),
    o: fadeOut(),
  },
);

const text = layer(
  "text",
  [
    skeleton(80, { title: true, x: 226, y: 156, s: growX(34, { dur: 12, reset: OP }), name: "brandName" }),
    skeleton(150, { x: 178, y: 182, s: growX(40, { dur: 12, reset: OP }), name: "line1" }),
    skeleton(130, { x: 178, y: 196, s: growX(48, { dur: 12, reset: OP }), name: "line2" }),
    skeleton(90, { x: 178, y: 210, s: growX(56, { dur: 12, reset: OP }), name: "line3" }),
  ],
  { o: fadeOut() },
);

const cities = layer(
  "cities",
  [196, 244, 292].map((x, k) =>
    group(
      `city${k}`,
      [
        leaf("bg", rc({ w: 44, h: 16, r: 8 }), { fill: C.creamDeep }),
        leaf("label", rc({ w: 18, h: 5, r: 2.5, x: 5 }), { fill: { c: C.espresso, o: 32 } }),
        leaf("dot", circ(3.5, -13, 0), {
          fill: C.berry,
          p: anim([70 + 8 * k, [0, -6], "out"], [80 + 8 * k, [0, 0], "hold"], [OP, [0, -6]]),
        }),
      ],
      { p: [x, 230], s: anim([70 + 8 * k, 0, "back"], [82 + 8 * k, 100, "hold"], [OP, 0]) },
    ),
  ),
  { o: fadeOut() },
);

const save = layer("save", [pill(36, 18, { labelW: 16 })], {
  p: [340, 230],
  s: anim([88, 0, "back"], [96, 100, "inOut"], [100, 88, "back"], [106, 100, "hold"], [OP, 0]),
  o: fadeOut(),
});

const tap = layer("tap", [ripple([99], { x: 340, y: 230, r: 12, dur: 14 })]);

const done = layer(
  "check",
  [check({ r: 15, drawn: anim([108, 0, "out"], [118, 100, "hold"], [OP, 0]) })],
  { p: [344, 112], s: anim([104, 0, "back"], [116, 100], [130, 100, "in"], [140, 0]) },
);

const sparkles = layer("sparkles", [
  sparkle({ x: 368, y: 96, ...twinkle(110, { dur: 16, max: 150 }) }),
  sparkle({ x: 322, y: 92, ...twinkle(114, { dur: 16, max: 100 }) }),
]);

export default comp({
  name: "brand",
  seconds: 5,
  poster: 118,
  layers: [blob, device, sidebar, banner, text, logo, cities, save, tap, done, sparkles],
});
