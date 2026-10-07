/**
 * 5 · scan — "Scan the customer's card" (4 s, poster 80).
 * A customer's phone with the Loodly card (barcode) slides up to the hand
 * scanner waiting on the counter; the beam sweeps, it beeps, a green chip confirms and a points
 * coin pops up.
 */
import { C, anim, comp, el, group, layer, leaf, poly, rc, xfPoint } from "../lib.mjs";
import { barcode, coin, phone, scannerGun, skeleton, soundArcs, tick } from "../props.mjs";

const OP = 120;
const PHONE = { p: [150, 205], r: -8, s: 90 };
const SCANNER = { p: [360, 170], r: 12 };
const CARD_Y = -22; // barcode card centre, phone space
const BAR_H = 40;

const blob = layer("blob", [leaf("blob", el({ w: 370, h: 250 }), { fill: { c: C.strawberry, o: 14 } })], {
  p: [244, 190],
  s: anim([0, 100], [60, 104], [OP, 100]),
});

const cardStroke = {
  c: anim([0, C.espresso], [62, C.espresso, "inOut"], [66, C.pistachio, "hold"], [98, C.pistachio, "inOut"], [106, C.espresso]),
  o: anim([0, 12], [62, 12, "inOut"], [66, 100, "hold"], [98, 100, "inOut"], [106, 12]),
  w: 3,
};

const qrGlyph = [-1, 1].flatMap((dy) => [-1, 1].map((dx) => rc({ w: 4.5, h: 4.5, r: 1, x: -17 + dx * 3, y: dy * 3 })));
const barGlyph = [-4.5, -1.5, 1.5, 4.5].map((x, k) => rc({ w: k % 2 ? 2 : 1.4, h: 9, x: 17 + x }));

const screen = [
  leaf("header", rc({ w: 64, h: 14, r: 7, y: -70 }), { fill: C.berry }),
  leaf("headerLabel", rc({ w: 30, h: 4, r: 2, y: -70 }), { fill: { c: C.white, o: 75 } }),
  leaf("card", rc({ w: 82, h: 58, r: 9, y: CARD_Y }), { fill: C.white, stroke: cardStroke }),
  barcode({ h: BAR_H, y: CARD_Y }),
  leaf("scanLine", rc({ w: 88, h: 3, r: 1.5 }), {
    fill: C.strawberry,
    p: anim([36, [0, CARD_Y - 20], "inOut"], [48, [0, CARD_Y + 20], "inOut"], [60, [0, CARD_Y - 20]]),
    o: anim([34, 0, "out"], [37, 100], [58, 100, "in"], [61, 0]),
  }),
  skeleton(56, { title: true, align: "center", y: 22 }),
  skeleton(40, { align: "center", y: 36 }),
  group(
    "codeSwitch",
    [
      leaf("track", rc({ w: 72, h: 18, r: 9 }), { fill: C.white, stroke: { c: C.espresso, o: 12, w: 2.3 } }),
      leaf("activeHalf", rc({ w: 34, h: 14, r: 7, x: 17 }), { fill: C.berry }),
      leaf("qr", qrGlyph, { fill: { c: C.espresso, o: 40 } }),
      leaf("bars", barGlyph, { fill: C.white }),
    ],
    { p: [0, 66] },
  ),
];

const customerPhone = layer("phone", [phone({ screen })], {
  p: anim([10, [70, 205], "out"], [26, PHONE.p, "hold"], [96, PHONE.p, "in"], [112, [70, 205]]),
  r: anim([10, -24, "out"], [26, PHONE.r, "hold"], [96, PHONE.r, "in"], [112, -24]),
  s: PHONE.s,
  o: anim([10, 0, "out"], [18, 100], [100, 100, "in"], [112, 0]),
});

// Beam: from the scanner's window to the barcode, both at rest.
const nose = xfPoint([-41, 0], SCANNER);
const top = xfPoint([-30, CARD_Y - BAR_H / 2 - 2], PHONE);
const bottom = xfPoint([-30, CARD_Y + BAR_H / 2 + 2], PHONE);
const beam = layer("beam", [leaf("fan", poly([nose, top, bottom], true), { fill: { c: C.strawberry, o: 45 } })], {
  o: anim([32, 0, "out"], [38, 60], [62, 60, "in"], [64, 0]),
});

// The scanner is counter hardware: it stays on stage for the whole loop (so
// the frame is never empty); only the customer's phone comes and goes.
const scanner = layer(
  "scanner",
  [scannerGun({ led: anim([0, C.espresso], [62, C.espresso, "hold"], [64, C.pistachio, "hold"], [96, C.espresso]) })],
  SCANNER,
);

const beep = layer(
  "beep",
  [
    soundArcs({
      arcO: [0, 1, 2].map((k) => anim([59 + 3 * k, 0, "hold"], [60 + 3 * k, 100, "out"], [72 + 3 * k, 0])),
    }),
  ],
  { p: [338, 136], r: -112 },
);

const chip = layer(
  "chip",
  [
    leaf("bg", rc({ w: 88, h: 30, r: 15 }), { fill: C.pistachio }),
    tick({ r: 8, x: -25, y: 0.5, w: 3.5, drawn: anim([68, 0, "out"], [78, 100, "hold"], [OP, 0]) }),
    leaf("label", rc({ w: 38, h: 6, r: 3, x: 11 }), { fill: { c: C.white, o: 85 } }),
  ],
  {
    p: [150, 76],
    s: anim([64, 0, "back"], [76, 100, "hold"], [OP, 0]),
    o: anim([0, 100], [96, 100, "in"], [106, 0, "hold"], [OP, 100]),
  },
);

const pointsCoin = layer("coin", [coin({ r: 14 })], {
  p: anim([72, [210, 80], "out"], [92, [210, 46], "hold"], [OP, [210, 80]]),
  s: anim([72, 0, "back"], [79, 100, "hold"], [OP, 0]),
  o: anim([0, 100], [86, 100, "in"], [92, 0, "hold"], [OP, 100]),
});

export default comp({
  name: "scan",
  seconds: 4,
  poster: 80,
  layers: [blob, customerPhone, beam, scanner, beep, chip, pointsCoin],
});
