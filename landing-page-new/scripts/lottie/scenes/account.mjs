/**
 * 1 · account — "We set up your brand account" (4 s, poster 104).
 * An invitation envelope flies into the brand console on a laptop, a sign-in
 * form fills in (email, password, button) and a green check confirms it.
 */
import { C, anim, comp, el, layer, leaf, rc } from "../lib.mjs";
import { fadeInOut, growX, twinkle } from "../motion.mjs";
import { check, envelope, laptop, mark, pill, skeleton, sparkle } from "../props.mjs";

const OP = 120;

const blob = layer(
  "blob",
  [leaf("blob", el({ w: 330, h: 244 }), { fill: { c: C.strawberry, o: 18 } })],
  { p: [240, 176], s: anim([0, 100], [60, 104], [OP, 100]) },
);

const device = layer("laptop", [laptop()], { p: [240, 180] });

// Loodly splash on the empty console; cross-fades with the form.
const splash = layer("splash", [mark({ scale: 1 })], {
  p: [240, 174],
  o: anim([0, 100], [12, 100, "in"], [20, 0, "hold"], [112, 0, "out"], [OP - 1, 100]),
  s: anim([0, 100], [12, 100, "in"], [20, 80, "hold"], [112, 92, "out"], [OP - 1, 100]),
});

// Sign-in form, in screen space around (240, 170).
const field = (name, y) =>
  leaf(name, rc({ w: 150, h: 20, r: 6, y }), { fill: C.white, stroke: { c: C.espresso, o: 12, w: 2 } });
const dots = Array.from({ length: 6 }, (_, i) =>
  leaf(`dot${i}`, el({ w: 7, h: 7 }), {
    fill: { c: C.espresso, o: 70 },
    p: [-63 + 12 * i, 14],
    s: anim([66 + 2 * i, 0, "back"], [72 + 2 * i, 100, "hold"], [OP, 0]),
  }),
);
const form = layer(
  "form",
  [
    skeleton(90, { title: true, x: -45, y: -42 }),
    field("email", -14),
    skeleton(92, { x: -65, y: -14, c: C.berry, op: 35, h: 6, s: growX(54, { dur: 14, reset: OP }), name: "emailFill" }),
    field("password", 14),
    dots,
    pill(150, 22, {
      y: 44,
      labelW: 44,
      s: anim([82, 100, "inOut"], [86, 94, "back"], [90, 100]),
      name: "button",
    }),
  ],
  {
    p: anim([40, [240, 184], "out"], [54, [240, 170], "hold"], [OP - 1, [240, 184]]),
    o: fadeInOut(40, 104, { dur: 14, outDur: 8 }),
  },
);

const done = layer(
  "check",
  [check({ r: 20, drawn: anim([92, 0, "out"], [102, 100, "hold"], [OP, 0]) })],
  { p: [318, 118], s: anim([88, 0, "back"], [100, 100], [104, 100, "in"], [112, 0]) },
);

const sparkles = layer("sparkles", [
  sparkle({ x: 350, y: 94, ...twinkle(96, { dur: 16, max: 170 }) }),
  sparkle({ x: 290, y: 96, ...twinkle(101, { dur: 16, max: 120 }) }),
]);

const invite = layer(
  "envelope",
  [envelope({ flapS: anim([26, [100, 100], "inOut"], [34, [100, -100], "hold"], [70, [100, 100]]) })],
  {
    p: anim([8, [70, 60], "out", { to: [90, -10], ti: [-40, -52] }], [26, [240, 150], "hold"], [70, [70, 60]]),
    r: anim([8, -14, "out"], [26, 0, "hold"], [70, -14]),
    s: anim([0, 60, "back"], [8, 100], [34, 100, "in"], [44, 20, "hold"], [70, 60]),
    o: anim([0, 0, "out"], [6, 100], [36, 100, "in"], [44, 0]),
  },
);

export default comp({
  name: "account",
  seconds: 4,
  poster: 104,
  layers: [blob, device, splash, form, done, sparkles, invite],
});
