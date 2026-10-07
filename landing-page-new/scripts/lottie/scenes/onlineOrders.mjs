/**
 * 9 · onlineOrders — "Online orders, straight to your tablet" (5 s, poster 128).
 * The customer taps "order"; the ticket flies to the Loodly Spot tablet, a
 * new row drops in and the bell rings. Staff accept it (green), and the
 * status steps new → preparing → ready light up on the tablet and on the
 * customer's phone.
 */
import { C, anim, circ, comp, el, group, layer, leaf, poly, rc, wiggle } from "../lib.mjs";
import { bag, bell, croissant, phone, pill, ripple, skeleton, soundArcs, tablet, tick } from "../props.mjs";

const OP = 150;
const PHONE = { p: [100, 210], s: 80 };
const ROW = [320, 158];
const STATUS = [C.berry, C.mango, C.pistachio];
const STATUS_T = [98, 108, 118];

const blob = layer("blob", [leaf("blob", el({ w: 400, h: 256 }), { fill: { c: C.berry, o: 9 } })], {
  p: [244, 184],
  s: anim([0, 100], [75, 104], [OP, 100]),
});

// --- customer phone (phone space)
const phoneStatus = STATUS.map((c, k) =>
  leaf(`status${k}`, circ(4), {
    p: [-14 + 14 * k, 78],
    fill: {
      c: anim([0, C.espresso], [STATUS_T[k] + 1, C.espresso, "hold"], [STATUS_T[k] + 2, c, "hold"], [140, C.espresso]),
      o: anim([0, 22], [STATUS_T[k] + 1, 22, "hold"], [STATUS_T[k] + 2, 100, "hold"], [140, 22]),
    },
    s: anim([0, 100], [STATUS_T[k] + 2, 100, "out"], [STATUS_T[k] + 5, 150, "inOut"], [STATUS_T[k] + 11, 100]),
  }),
);
const customer = layer(
  "phone",
  [
    phone({
      screen: [
        skeleton(50, { title: true, align: "center", y: -70 }),
        leaf("product", rc({ w: 80, h: 70, r: 10, y: -28 }), { fill: C.white }),
        croissant({ s: 88, k: 70, y: -38 }),
        skeleton(44, { align: "center", y: -10 }),
        skeleton(62, { align: "center", y: 16 }),
        skeleton(40, { align: "center", y: 29 }),
        pill(76, 22, { y: 52, labelW: 34, s: anim([10, 100, "inOut"], [14, 90, "back"], [20, 100]) }),
        phoneStatus,
      ],
    }),
  ],
  PHONE,
);
const tap = layer("tap", [ripple([12], { x: 100, y: 252, r: 16 })]);

// --- tablet with Loodly Spot (canvas space)
const oldRow = (y, statusColor, name) =>
  group(name, [
    leaf("row", rc({ w: 200, h: 30, r: 8, x: 320, y }), { fill: C.white, stroke: { c: C.espresso, o: 10, w: 2 } }),
    leaf("icon", rc({ w: 18, h: 18, r: 5, x: 236, y }), { fill: C.creamDeep }),
    skeleton(64, { title: true, x: 252, y: y - 5, h: 7 }),
    skeleton(40, { x: 252, y: y + 6, h: 6 }),
    leaf("status", circ(5, 404, y), { fill: statusColor }),
  ]);
const device = layer("tablet", [
  tablet({ p: [320, 190] }),
  leaf("headerDot", circ(4, 217, 123), { fill: C.berry }),
  skeleton(50, { title: true, x: 227, y: 123 }),
  oldRow(194, C.mango, "row1"),
  oldRow(230, C.pistachio, "row2"),
]);

const ring = layer(
  "bell",
  [
    soundArcs({
      x: -12,
      y: 14,
      s: 70,
      r: 180,
      arcO: [0, 1, 2].map((k) => anim([53 + 3 * k, 0, "hold"], [54 + 3 * k, 100, "out"], [66 + 3 * k, 0])),
    }),
    bell({ s: 72, r: wiggle(52, [16, -16, 12, -12], 5) }),
  ],
  { p: [418, 114] },
);

// --- the new order row
const statusDots = STATUS.map((c, k) =>
  leaf(`dot${k}`, circ(5), {
    fill: c,
    p: [2 + 22 * k, 0],
    s: anim([STATUS_T[k], 0, "back"], [STATUS_T[k] + 8, 100, "hold"], [OP, 0]),
  }),
);
const statusLines = [0, 1].map((k) =>
  leaf(`line${k}`, poly([[8 + 22 * k, 0], [18 + 22 * k, 0]]), {
    stroke: { c: STATUS[k + 1], w: 2.5 },
    trim: { e: anim([STATUS_T[k] + 3, 0, "inOut"], [STATUS_T[k + 1], 100, "hold"], [OP, 0]) },
  }),
);
const newRow = layer(
  "newRow",
  [
    leaf("row", rc({ w: 200, h: 30, r: 8 }), {
      fill: C.white,
      stroke: {
        c: anim([0, C.berry], [92, C.berry, "inOut"], [98, C.pistachio, "hold"], [OP, C.berry]),
        w: 2.5,
      },
    }),
    bag({ s: 40, x: -84, y: 1 }),
    skeleton(46, { title: true, x: -68, y: -5, h: 7 }),
    skeleton(30, { x: -68, y: 6, h: 6 }),
    statusLines,
    statusDots,
    group(
      "accept",
      [
        leaf("bg", rc({ w: 38, h: 20, r: 10 }), { fill: C.pistachio }),
        tick({ r: 6, w: 3, drawn: anim([88, 0, "out"], [96, 100, "hold"], [OP, 0]) }),
      ],
      { p: [76, 0], s: anim([82, 0, "back"], [94, 100, "hold"], [OP, 0]) },
    ),
  ],
  {
    p: ROW,
    s: anim([46, 40, "back"], [58, 100, "hold"], [OP, 40]),
    o: anim([46, 0, "out"], [50, 100], [134, 100, "in"], [144, 0]),
  },
);
const accepted = layer("acceptTap", [ripple([90], { x: 396, y: 158, r: 14, c: C.pistachio })]);

const ticket = layer(
  "ticket",
  [
    leaf("card", rc({ w: 66, h: 40, r: 8 }), { fill: C.white, stroke: { c: C.berry, w: 2 } }),
    bag({ s: 46, x: -18, y: 1 }),
    skeleton(24, { title: true, x: -4, y: -6, h: 6 }),
    skeleton(16, { x: -4, y: 6, h: 5 }),
  ],
  {
    p: anim([18, [100, 200], "inOut", { to: [30, -160], ti: [-30, -120] }], [48, ROW, "hold"], [OP, [100, 200]]),
    r: anim([18, -10, "inOut"], [48, 0, "hold"], [OP, -10]),
    s: anim([18, 0, "back"], [26, 100, "inOut"], [44, 100, "in"], [52, 70, "hold"], [OP, 0]),
    o: anim([0, 100], [44, 100, "in"], [52, 0, "hold"], [OP, 100]),
  },
);

export default comp({
  name: "onlineOrders",
  seconds: 5,
  poster: 128,
  layers: [blob, device, ring, newRow, accepted, customer, tap, ticket],
});
