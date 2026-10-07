/**
 * 10 · couriers — "Courier on the way, live on the map" (6 s, poster 152).
 * A berry route draws from the shop to the customer's home; a Loodly Courier
 * rider follows it, the home's door turns green, a pin drops and a check pops.
 */
import { C, anim, comp, layer, leaf, sh, smooth } from "../lib.mjs";
import { check, cityMap, courier, house, pin, storefront } from "../props.mjs";

const OP = 180;
const TENSION = 0.6;
const ROUTE = [
  [130, 268],
  [204, 266],
  [254, 206],
  [330, 174],
  [342, 134],
];
const TIMES = [48, 70, 90, 112, 136];
const LIFT = 8; // courier rides slightly above the road centre line

const map = layer("map", [
  cityMap({
    cx: 240,
    cy: 182,
    minor: [
      "M52 170 C120 160 170 138 214 92",
      "M276 300 C314 262 372 252 430 254",
      "M300 64 C292 110 300 132 330 150",
      "M58 222 L140 210",
    ],
  }),
  leaf("park", smooth([[86, 80], [150, 70], [168, 112], [120, 136], [76, 118]], { closed: true }), {
    fill: { c: C.pistachio, o: 35 },
  }),
  leaf("park2", smooth([[330, 230], [392, 214], [422, 240], [390, 284], [340, 270]], { closed: true }), {
    fill: { c: C.pistachio, o: 28 },
  }),
  leaf("driveway", sh("M338 136 C352 130 366 129 382 129"), { stroke: { c: C.white, w: 10 } }),
  leaf("road", smooth(ROUTE, { tension: TENSION }), { stroke: { c: C.white, w: 16 } }),
]);

const route = layer(
  "route",
  [
    leaf("route", smooth(ROUTE, { tension: TENSION }), {
      stroke: { c: C.berry, w: 5 },
      trim: { e: anim([10, 0, "inOut"], [46, 100, "hold"], [OP, 0]) },
    }),
  ],
  { o: anim([0, 100], [164, 100, "in"], [176, 0, "hold"], [OP, 100]) },
);

const shop = layer("store", [storefront()], { p: [76, 262], s: 70 });

const home = layer(
  "house",
  [
    house({
      door: anim([0, C.espressoLight], [136, C.espressoLight, "inOut"], [144, C.pistachio, "hold"], [168, C.pistachio, "inOut"], [176, C.espressoLight]),
    }),
  ],
  { p: [392, 130], s: 70 },
);

// Courier path: the same Catmull-Rom tangents as the road, so the rider
// stays on it between keyframes.
const k = TENSION / 3;
const tangent = (i) => {
  const prev = ROUTE[Math.max(0, i - 1)];
  const next = ROUTE[Math.min(ROUTE.length - 1, i + 1)];
  if (i === 0 || i === ROUTE.length - 1) return [0, 0];
  return [(next[0] - prev[0]) * k, (next[1] - prev[1]) * k];
};
const lifted = ROUTE.map(([x, y]) => [x, y - LIFT]);
const ride = [];
lifted.forEach((pt, i) => {
  const last = i === lifted.length - 1;
  const easeName = i === 0 ? "accel" : i === lifted.length - 2 ? "decel" : "linear";
  if (last) ride.push([TIMES[i], pt, "hold"]);
  else {
    const t0 = tangent(i);
    const t1 = tangent(i + 1);
    ride.push([TIMES[i], pt, easeName, { to: t0, ti: [-t1[0], -t1[1]] }]);
  }
});
ride.push([179, lifted[0]]);

const bobFrames = [[48, 0, "inOut"]];
for (let t = 59, sign = 1; t < 136; t += 11, sign = -sign) bobFrames.push([t, 3 * sign, "inOut"]);
bobFrames.push([136, 0]);

const rider = layer(
  "courier",
  [
    courier({
      k: 70,
      wheelR: anim([48, 0, "linear"], [136, 1080, "hold"], [179, 0]),
      bob: anim(...bobFrames),
    }),
  ],
  {
    p: anim(...ride),
    s: anim([36, 0, "back"], [46, 70, "hold"], [179, 0]),
    o: anim([0, 100], [164, 100, "in"], [176, 0, "hold"], [179, 100]),
  },
);

const destination = layer("pin", [pin()], {
  p: anim([136, [392, 48], "back"], [148, [392, 78], "hold"], [179, [392, 48]]),
  o: anim([136, 0, "out"], [142, 100], [164, 100, "in"], [176, 0]),
});

const delivered = layer(
  "check",
  [check({ r: 15, drawn: anim([142, 0, "out"], [152, 100, "hold"], [179, 0]) })],
  { p: [352, 64], s: anim([140, 0, "back"], [150, 100], [164, 100, "in"], [174, 0]) },
);

export default comp({
  name: "couriers",
  seconds: 6,
  poster: 152,
  layers: [map, route, shop, home, rider, destination, delivered],
});
