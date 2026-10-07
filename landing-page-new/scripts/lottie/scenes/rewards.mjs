/**
 * 7 · rewards — "Happy customers who come back" (5 s, poster 78).
 * An older customer drops points into a gift box on the counter; the box
 * wobbles, the lid pops off and a mug with the business's (croissant) logo
 * rises out — "merch with your logo", as the scene copy says. Both customers
 * smile, the younger one hops and hearts float up.
 */
import { C, anim, circ, comp, el, group, layer, leaf, rc } from "../lib.mjs";
import { twinkle } from "../motion.mjs";
import { coin, croissant, giftBase, giftLid, heart, person, sparkle } from "../props.mjs";

const OP = 150;
const GIFT = [240, 296]; // bottom-centre of the box, on the counter
const GIFT_S = 135;

const blob = layer("blob", [leaf("blob", el({ w: 380, h: 250 }), { fill: { c: C.berry, o: 9 } })], {
  p: [240, 176],
  s: anim([0, 100], [75, 104], [OP, 100]),
});

const smile = {
  s: anim([0, 30], [58, 30, "out"], [70, 0, "hold"], [120, 0, "inOut"], [132, 30]),
  e: anim([0, 70], [58, 70, "out"], [70, 100, "hold"], [120, 100, "inOut"], [132, 70]),
};

const older = layer(
  "older",
  [person({ shirt: C.pistachio, skin: C.creamDeep, hair: C.white, glasses: true, smile })],
  { p: [96, 232], s: 125 },
);
const younger = layer(
  "younger",
  [person({ shirt: C.mango, skin: C.wafer, hair: C.espressoLight, smile })],
  {
    p: anim([0, [386, 232]], [64, [386, 232], "out"], [68, [386, 222], "in"], [72, [386, 232], "out"], [75, [386, 228], "in"], [78, [386, 232]]),
    s: 125,
  },
);

const counter = layer("counter", [
  leaf("front", rc({ w: 436, h: 52, r: 18, x: 240, y: 322 }), { fill: C.creamDeep }),
  leaf("top", rc({ w: 436, h: 10, r: 5, x: 240, y: 298 }), { fill: C.wafer }),
  leaf("shadow", el({ w: 120, h: 10, x: 240, y: 297 }), { fill: { c: C.espresso, o: 12 } }),
]);

// The reward: a white mug with the business's logo (same croissant as the brand scene).
const mugArt = group("mug", [
  leaf("handle", circ(12, 30, -2), { stroke: { c: C.berry, w: 8 } }),
  leaf("body", rc({ w: 56, h: 60, r: 10 }), { fill: C.white, stroke: { c: C.espresso, o: 10, w: 2 } }),
  leaf("rim", rc({ w: 56, h: 9, r: 4.5, y: -25.5 }), { fill: C.berry }),
  leaf("base", rc({ w: 50, h: 7, r: 3.5, y: 25 }), { fill: C.creamDeep }),
  croissant({ s: 64, y: 4 }),
]);
const mug = layer("mug", [mugArt], {
  p: anim(
    [44, [240, 268], "back"],
    [64, [240, 166], "inOut"],
    [78, [240, 161], "inOut"],
    [92, [240, 166], "inOut"],
    [106, [240, 161], "inOut"],
    [116, [240, 166], "in"],
    [130, [240, 268]],
  ),
  s: anim([44, 40, "back"], [64, 100, "hold"], [116, 100, "in"], [130, 40]),
  o: anim([44, 0, "out"], [48, 100], [124, 100, "in"], [130, 0]),
});

const box = layer("giftBase", [giftBase()], {
  p: GIFT,
  s: GIFT_S,
  r: anim([18, 0, "inOut"], [23, -5, "inOut"], [28, 5, "inOut"], [33, -3, "inOut"], [37, 0]),
});

// Lid is parented to the box (inherits wobble and scale); positions in box
// space. It hops off and lands on the counter, leaning on the box's left side
// (clear of the older customer's shoulder at canvas x ≈ 132).
const LID_REST = [0, -54];
const LID_OPEN = [-40, -10.5];
const lid = layer("giftLid", [giftLid()], {
  parent: "giftBase",
  p: anim(
    [38, LID_REST, "inOut", { to: [-8, -46], ti: [6, -58] }],
    [52, LID_OPEN, "hold"],
    [122, LID_OPEN, "inOut", { to: [6, -58], ti: [-8, -46] }],
    [136, LID_REST],
  ),
  r: anim([38, 0, "inOut"], [46, -34, "out"], [52, 0, "inOut"], [55, -4, "inOut"], [58, 0, "hold"], [122, 0, "inOut"], [129, -34, "inOut"], [136, 0]),
});

// Points going in: three coins from the older customer into the box.
const COIN_FROM = [128, 226];
const COIN_TO = [240, 232];
const coins = [2, 6, 10].map((t0, k) => {
  const t1 = t0 + 12;
  return layer(`coin${k}`, [coin({ r: 11 })], {
    p: anim([t0, COIN_FROM, "inOut", { to: [26, -70], ti: [-24, -56] }], [t1, COIN_TO, "hold"], [t1 + 1, COIN_FROM]),
    s: anim([t0, 0, "back"], [t0 + 4, 100, "inOut"], [t1 - 3, 100, "in"], [t1, 50, "hold"], [t1 + 1, 0]),
    o: anim([0, 100], [t1 - 3, 100, "in"], [t1, 0, "hold"], [t1 + 1, 100]),
  });
});

const sparkles = layer("sparkles", [
  sparkle({ x: 190, y: 150, ...twinkle(52, { dur: 16, max: 150 }) }),
  sparkle({ x: 296, y: 136, ...twinkle(56, { dur: 16, max: 130 }) }),
  sparkle({ x: 250, y: 112, ...twinkle(60, { dur: 16, max: 100 }) }),
]);

const hearts = layer(
  "hearts",
  Array.from({ length: 6 }, (_, i) => {
    const t = 68 + 7 * i;
    const fromOlder = i % 2 === 0;
    const x = fromOlder ? 120 + (i % 3) * 6 : 362 - (i % 3) * 6;
    const y = 192;
    const drift = fromOlder ? 10 : -10;
    return heart({
      name: `heart${i}`,
      p: anim([t, [x, y], "out"], [t + 24, [x + drift, y - 64], "hold"], [t + 25, [x, y]]),
      s: anim([t, 40, "back"], [t + 8, 100 + (i % 2) * 20, "hold"], [t + 25, 40]),
      o: anim([t, 0, "out"], [t + 6, 100], [t + 16, 100, "in"], [t + 24, 0]),
    });
  }),
);

export default comp({
  name: "rewards",
  seconds: 5,
  poster: 78,
  layers: [blob, older, younger, counter, mug, box, lid, ...coins, sparkles, hearts],
});
