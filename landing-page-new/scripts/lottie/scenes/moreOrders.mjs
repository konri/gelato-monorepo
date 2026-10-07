/**
 * 8 · moreOrders — "Orders even when customers aren't at your door" (5 s, poster 100).
 * Orders fly in from a home, an office and a park (each with a phone) to the
 * shop's door; order tickets stack up, the bell rings, the windows light up
 * and the awning sways.
 */
import { C, anim, circ, comp, el, group, layer, leaf, rc, wiggle } from "../lib.mjs";
import { bag, bell, house, office, skeleton, soundArcs, storefront, tree } from "../props.mjs";

const OP = 150;
const STORE = [240, 312];
const STORE_S = 160;
const DOOR = [240, 282];

const blob = layer("blob", [leaf("blob", el({ w: 400, h: 240 }), { fill: { c: C.mango, o: 13 } })], {
  p: [240, 170],
  s: anim([0, 100], [75, 104], [OP, 100]),
});

const street = layer("street", [
  leaf("pavement", rc({ w: 440, h: 26, r: 13, x: 240, y: 324 }), { fill: C.creamDeep }),
  leaf("shadow", el({ w: 190, h: 12, x: 240, y: 313 }), { fill: { c: C.espresso, o: 10 } }),
]);

const store = layer(
  "store",
  [
    storefront({
      awningR: anim([90, 0, "soft"], [101, 1.5, "soft"], [112, -1.5, "soft"], [123, 1, "soft"], [135, 0]),
      windows: {
        c: anim([0, C.strawberry], [50, C.strawberry, "inOut"], [58, C.mango, "hold"], [136, C.mango, "inOut"], [146, C.strawberry]),
        o: anim([0, 28], [50, 28, "inOut"], [58, 60, "hold"], [136, 60, "inOut"], [146, 28]),
      },
    }),
  ],
  {
    p: STORE,
    s: anim([0, [STORE_S, STORE_S], "inOut"], [5, [166, 152], "inOut"], [10, [157, 165], "inOut"], [15, [STORE_S, STORE_S]]),
  },
);

const ding = layer(
  "bell",
  [
    soundArcs({
      name: "dingR",
      x: 26,
      y: 16,
      s: 60,
      arcO: [0, 1, 2].map((k) => anim([73 + 2 * k, 0, "hold"], [74 + 2 * k, 100, "out"], [86 + 2 * k, 0])),
    }),
    soundArcs({
      name: "dingL",
      x: -26,
      y: 16,
      s: 60,
      r: 180,
      arcO: [0, 1, 2].map((k) => anim([73 + 2 * k, 0, "hold"], [74 + 2 * k, 100, "out"], [86 + 2 * k, 0])),
    }),
    bell({ s: 80, r: wiggle(72, [15, -15, 10, -8], 3) }),
  ],
  { p: [240, 236] },
);

/** Small phone next to each source. Pivot: centre. */
const miniPhone = (x, y) =>
  group("miniPhone", [
    leaf("body", rc({ w: 22, h: 38, r: 5 }), { fill: C.espresso }),
    leaf("screen", rc({ w: 17, h: 31, r: 3 }), { fill: C.cream }),
    leaf("dot", circ(3.5, 0, 2), { fill: C.berry }),
  ], { p: [x, y], r: -8 });

const SOURCES = [
  { id: "home", pop: 14, art: house({ s: 85 }), at: [84, 136], phone: [128, 116] },
  { id: "work", pop: 19, art: office({ s: 85 }), at: [236, 120], phone: [280, 100] },
  { id: "park", pop: 24, art: tree({ s: 92 }), at: [398, 136], phone: [354, 116] },
];

const sources = layer(
  "sources",
  SOURCES.map((src) =>
    group(src.id, [group("art", [src.art], { p: src.at }), miniPhone(...src.phone)], {
      a: src.at,
      p: src.at,
      s: anim([src.pop, 0, "back"], [src.pop + 12, 100, "hold"], [OP, 0]),
    }),
  ),
  { o: anim([0, 100], [135, 100, "in"], [147, 0, "hold"], [OP, 100]) },
);

const BUBBLES = [
  { id: "A", from: [128, 100], t0: 30, to: [34, -46], ti: [-46, -70] },
  { id: "B", from: [280, 84], t0: 40, to: [30, 10], ti: [34, -70] },
  { id: "C", from: [354, 100], t0: 50, to: [-20, -40], ti: [56, -60] },
];
const bubbles = BUBBLES.map((b) => {
  const t1 = b.t0 + 20;
  return layer(
    `order${b.id}`,
    [
      leaf("bubble", rc({ w: 34, h: 26, r: 8 }), { fill: C.white, stroke: { c: C.berry, w: 2 } }),
      bag({ s: 40, y: 1 }),
    ],
    {
      p: anim([b.t0, b.from, "inOut", { to: b.to, ti: b.ti }], [t1, DOOR, "hold"], [OP, b.from]),
      s: anim([b.t0, 0, "back"], [b.t0 + 6, 100, "inOut"], [t1 - 4, 100, "in"], [t1, 60, "hold"], [OP, 0]),
      o: anim([0, 100], [t1 - 4, 100, "in"], [t1, 0, "hold"], [OP, 100]),
    },
  );
});

const TICKETS = [
  { at: [366, 300], r: -8, t: 48 },
  { at: [377, 294], r: 6, t: 58 },
  { at: [369, 287], r: -2, t: 68 },
];
const tickets = layer(
  "tickets",
  TICKETS.map((tk, k) => {
    const [x, y] = tk.at;
    return group(
      `ticket${k}`,
      [
        leaf("paper", rc({ w: 30, h: 38, r: 4 }), { fill: C.white, stroke: { c: C.espresso, o: 12, w: 2 } }),
        leaf("band", rc({ w: 30, h: 7, r: 3.5, y: -15.5 }), { fill: C.berry }),
        skeleton(18, { x: -9, y: -3, h: 5 }),
        skeleton(12, { x: -9, y: 6, h: 5 }),
      ],
      {
        p: anim([tk.t, [x, y - 40], "in"], [tk.t + 6, [x, y], "out"], [tk.t + 9, [x, y - 4], "in"], [tk.t + 12, [x, y], "hold"], [OP, [x, y - 40]]),
        r: tk.r,
        o: anim([tk.t, 0, "out"], [tk.t + 4, 100, "hold"], [OP, 0]),
      },
    );
  }),
  { o: anim([0, 100], [135, 100, "in"], [147, 0, "hold"], [OP, 100]) },
);

export default comp({
  name: "moreOrders",
  seconds: 5,
  poster: 100,
  layers: [blob, street, sources, store, ding, tickets, ...bubbles],
});
