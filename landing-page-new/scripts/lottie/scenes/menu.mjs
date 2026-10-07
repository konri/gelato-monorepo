/**
 * 4 · menu — "Fill in your menu" (5 s, poster 100: the cake is switched off,
 * so reduced-motion visitors still see the "sold out in one tap" moment).
 * In Loodly Spot on a tablet: four product cards (coffee, croissant, ice
 * cream, cake) slide in with price, points and an availability toggle; the
 * cake is switched off (sold out) for a moment and back on.
 */
import { C, anim, circ, comp, el, group, layer, leaf, poly, rc } from "../lib.mjs";
import { growX } from "../motion.mjs";
import { cakeSlice, coffeeCup, coin, coneIcon, croissant, ripple, skeleton, tablet } from "../props.mjs";

const OP = 150;

const blob = layer("blob", [leaf("blob", el({ w: 350, h: 250 }), { fill: { c: C.pistachio, o: 16 } })], {
  p: [240, 178],
  s: anim([0, 100], [75, 104], [OP, 100]),
});

const device = layer("tablet", [tablet()], { p: [240, 182] });

// Screen spans x 127–353, y 106–258 (tablet at 240,182).
const header = layer("header", [
  leaf("bar", rc({ w: 216, h: 16, r: 8, x: 240, y: 115 }), { fill: C.white }),
  leaf("dot", circ(4.5, 141, 115), { fill: C.berry }),
  skeleton(56, { title: true, x: 151, y: 115 }),
  leaf("add", circ(6.5, 337, 115), { fill: C.berry }),
  leaf("plus", [poly([[333.5, 115], [340.5, 115]]), poly([[337, 111.5], [337, 118.5]])], { stroke: { c: C.white, w: 2 } }),
]);

const ICONS = [
  (o) => coffeeCup({ s: 64, y: 3, ...o }),
  (o) => croissant({ s: 68, ...o }),
  (o) => coneIcon({ s: 70, y: 1, ...o }),
  (o) => cakeSlice({ s: 72, y: 1, ...o }),
];
const CARDS = [
  [185, 157],
  [295, 157],
  [185, 224],
  [295, 224],
];

const cards = CARDS.map(([cx, cy], k) => {
  const tIn = 8 + 8 * k;
  const tGrow = 50 + 2 * k;
  const isCake = k === 3;
  const iconPop = anim([tIn + 6, 0, "back"], [tIn + 16, 100, "hold"], [OP, 0]);
  // cake: switched off 88–94, back on 118–124
  const dim = isCake ? anim([0, 100], [88, 100, "inOut"], [94, 40, "hold"], [118, 40, "inOut"], [124, 100]) : 100;
  const knobX = isCake ? anim([88, [41, 17], "inOut"], [94, [31, 17], "hold"], [118, [31, 17], "inOut"], [124, [41, 17]]) : [41, 17];
  const trackOn = isCake ? anim([0, 100], [88, 100, "inOut"], [94, 0, "hold"], [118, 0, "inOut"], [124, 100]) : 100;
  return layer(
    `card${k + 1}`,
    [
      leaf("shadow", rc({ w: 100, h: 56, r: 10, y: 3 }), { fill: { c: C.espresso, o: 7 } }),
      leaf("card", rc({ w: 104, h: 58, r: 10 }), { fill: C.white }),
      group(
        "content",
        [
          leaf("tile", rc({ w: 40, h: 40, r: 9, x: -26 }), { fill: C.creamSoft }),
          group("icon", [ICONS[k]({})], { p: [-26, 0], s: iconPop }),
          skeleton(40, { title: true, x: 0, y: -13, s: growX(tGrow, { dur: 10, reset: OP }) }),
          leaf("price", rc({ w: 26, h: 12, r: 6, x: 13 }), { fill: C.mango, p: [0, 3], s: growX(tGrow + 2, { dur: 10, reset: OP }) }),
          coin({ r: 6, x: 37, y: 3, s: anim([tGrow + 4, 0, "back"], [tGrow + 12, 100, "hold"], [OP, 0]) }),
        ],
        { o: dim },
      ),
      leaf("track", rc({ w: 22, h: 12, r: 6, x: 36, y: 17 }), { fill: { c: C.espresso, o: 22 } }),
      leaf("trackOn", rc({ w: 22, h: 12, r: 6, x: 36, y: 17 }), { fill: C.pistachio, o: trackOn }),
      leaf("knob", circ(4.5), { fill: C.white, p: knobX }),
    ],
    {
      p: anim([tIn, [cx + 24, cy], "out"], [tIn + 12, [cx, cy], "hold"], [OP, [cx + 24, cy]]),
      o: anim([tIn, 0, "out"], [tIn + 10, 100], [132 + 2 * k, 100, "in"], [140 + 2 * k, 0]),
    },
  );
});

const taps = layer("taps", [ripple([84, 114], { x: 331, y: 241, r: 11, dur: 14 })]);

export default comp({
  name: "menu",
  seconds: 5,
  poster: 100,
  layers: [blob, device, header, ...cards, taps],
});
