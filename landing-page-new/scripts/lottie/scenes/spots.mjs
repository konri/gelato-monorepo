/**
 * 3 · spots — "Add your locations" (5 s, poster 120).
 * The brand hub (the business's own croissant logo from the brand scene) sits on a city map; dashed connectors draw out
 * to three shop fronts that pop in as drafts, then each status dot turns
 * green (active) with a pulse.
 */
import { C, anim, circ, comp, el, layer, leaf, sh, smooth } from "../lib.mjs";
import { cityMap, croissant, storefront } from "../props.mjs";

const OP = 150;

const map = layer("map", [
  cityMap({
    cx: 240,
    cy: 185,
    roads: ["M52 205 L428 205", "M126 66 L314 310"],
    minor: ["M58 128 C120 138 168 116 226 130", "M300 66 C318 112 360 138 428 140", "M60 272 L212 250", "M340 236 C372 252 400 280 430 290"],
    parks: [],
  }),
  leaf("park", smooth([[360, 70], [414, 66], [428, 104], [396, 122], [356, 108]], { closed: true }), {
    fill: { c: C.pistachio, o: 35 },
  }),
  leaf("pond", smooth([[78, 300], [118, 290], [132, 306], [96, 314]], { closed: true }), { fill: { c: C.white, o: 55 } }),
]);

const HUB = [240, 190];
const STORES = [
  { id: "A", at: [120, 165], d: "M240 190 C200 196 152 186 124 166", draw: 14, pop: 24, live: 80, out: 134 },
  { id: "B", at: [360, 155], d: "M240 190 C282 184 330 178 356 156", draw: 32, pop: 42, live: 90, out: 137 },
  { id: "C", at: [300, 300], d: "M240 190 C250 230 276 262 298 296", draw: 50, pop: 60, live: 100, out: 140 },
];

const connectors = layer(
  "connectors",
  STORES.map((st) =>
    leaf(`link${st.id}`, sh(st.d), {
      stroke: { c: C.berry, w: 3, dash: [6, 6] },
      trim: { e: anim([st.draw, 0, "inOut"], [st.draw + 16, 100, "hold"], [OP, 0]) },
    }),
  ),
  { o: anim([0, 100], [134, 100, "in"], [144, 0, "hold"], [OP, 100]) },
);

const stores = STORES.map((st) =>
  layer(
    `store${st.id}`,
    [
      leaf("shadow", el({ w: 84, h: 10, y: 1 }), { fill: { c: C.espresso, o: 10 } }),
      storefront(),
      leaf("badgeBg", circ(9, 44, -76), { fill: C.white }),
      leaf("draft", circ(6, 44, -76), { fill: { c: C.espresso, o: 30 } }),
      leaf("active", circ(6, 44, -76), {
        fill: C.pistachio,
        o: anim([st.live, 0, "out"], [st.live + 6, 100, "hold"], [OP, 0]),
      }),
      leaf("pulse", circ(6), {
        stroke: { c: C.pistachio, w: 3 },
        p: [44, -76],
        s: anim([st.live, 100, "out"], [st.live + 16, 260, "hold"], [st.live + 17, 100]),
        o: anim([st.live - 1, 0, "hold"], [st.live, 90, "out"], [st.live + 16, 0]),
      }),
    ],
    {
      p: st.at,
      s: anim([st.pop, 0, "back"], [st.pop + 14, 80, "hold"], [st.out, 80, "in"], [st.out + 10, 0]),
    },
  ),
);

const hub = layer(
  "hub",
  [
    leaf("halo", circ(36), { fill: { c: C.berry, o: 10 } }),
    leaf("disc", circ(26), { fill: C.white, stroke: { c: C.berry, w: 3 } }),
    // Same logo as in the brand scene (ring r20 → croissant s60), scaled to the r26 disc.
    croissant({ s: 76, y: 1 }),
  ],
  { p: HUB, s: anim([4, 0, "back"], [16, 100], [138, 100, "in"], [148, 0]) },
);

export default comp({
  name: "spots",
  seconds: 5,
  poster: 120,
  layers: [map, connectors, ...stores, hub],
});
