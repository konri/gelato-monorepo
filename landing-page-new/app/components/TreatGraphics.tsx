import type { SVGProps } from "react";
import { ConeGraphic } from "./IceCreamGraphics";
import { LoodlyMark } from "./brand/LoodlyMark";

/**
 * Hand-built treat illustrations for the multi-category landing (cafés,
 * bakeries, pastry shops) in the same flat cartoon style as IceCreamGraphics:
 * palette fills, no outlines, one soft white highlight.
 *
 * Every graphic is a self-contained <svg>, so it can be sized with className
 * or nested inside another SVG with x / y / width / height.
 */

const C = {
  berry: "#c026a3",
  berryDark: "#8a1673",
  espresso: "#3a1526",
  espressoLight: "#5c2a3d",
  strawberry: "#ff6f91",
  pistachio: "#8bc34a",
  mango: "#ffb020",
  cream: "#fff8f0",
  creamSoft: "#fff1e6",
  creamDeep: "#ffe6d5",
  wafer: "#e8a866",
  crust: "#d18f4e",
  cherry: "#e11d48",
} as const;

/* ---------------------------- Coffee to go ---------------------------- */

export function CoffeeCupGraphic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 170" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Steam */}
      <path
        d="M47 28 C40 21 54 15 47 5 M71 28 C64 21 78 15 71 5"
        stroke={C.espresso}
        strokeOpacity="0.2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Cup body */}
      <path d="M24 50 L34 156 Q35 164 43 164 H77 Q85 164 86 156 L96 50 Z" fill="#ffffff" />
      <path d="M82 50 H96 L86 156 Q85 164 77 164 H72 Z" fill={C.creamDeep} />
      {/* Sleeve */}
      <path d="M26.6 78 H93.4 L89 124 H31 Z" fill={C.berry} />
      <path d="M84 78 H93.4 L89 124 H80 Z" fill={C.berryDark} opacity="0.35" />
      <path d="M33 84 L36 118" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M60 110 C50 103 50 95 55.5 95 C58 95 60 97.5 60 99 C60 97.5 62 95 64.5 95 C70 95 70 103 60 110 Z"
        fill={C.cream}
      />
      {/* Lid */}
      <path d="M30 40 C30 31 40 27 60 27 C80 27 90 31 90 40 Z" fill={C.creamDeep} />
      <rect x="49" y="30" width="22" height="4" rx="2" fill={C.espressoLight} opacity="0.55" />
      <rect x="17" y="38" width="86" height="13" rx="6.5" fill={C.creamDeep} />
      <rect x="17" y="46" width="86" height="5" rx="2.5" fill={C.crust} opacity="0.25" />
      <rect x="24" y="40.5" width="34" height="4" rx="2" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ------------------------------ Croissant ------------------------------ */

// Five puffy segments on an arch around a centre below the croissant.
// Angles in degrees (0 = right, 90 = up); radii in viewBox units.
const CROISSANT_O = [80, 94] as const;
const CROISSANT_SEGMENTS = [
  { a1: 172, a2: 142, rIn: 30, rOut: 50 },
  { a1: 8, a2: 38, rIn: 30, rOut: 50 },
  { a1: 146, a2: 112, rIn: 26, rOut: 64 },
  { a1: 34, a2: 68, rIn: 26, rOut: 64 },
  { a1: 116, a2: 64, rIn: 22, rOut: 76 },
];

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [CROISSANT_O[0] + r * Math.cos(a), CROISSANT_O[1] - r * Math.sin(a)];
}

const f = (n: number) => n.toFixed(1);

function croissantSegment({ a1, a2, rIn, rOut }: (typeof CROISSANT_SEGMENTS)[number]) {
  const mid = (a1 + a2) / 2;
  const [x1, y1] = polar(rIn, a1);
  const [x2, y2] = polar(rOut * 0.9, a1);
  const [cx, cy] = polar(rOut * 1.14, mid);
  const [x3, y3] = polar(rOut * 0.9, a2);
  const [x4, y4] = polar(rIn, a2);
  const [ix, iy] = polar(rIn * 0.86, mid);
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} Q${f(cx)} ${f(cy)} ${f(x3)} ${f(y3)} L${f(x4)} ${f(y4)} Q${f(ix)} ${f(iy)} ${f(x1)} ${f(y1)} Z`;
}

function croissantHighlight({ a1, a2, rOut }: (typeof CROISSANT_SEGMENTS)[number]) {
  const span = a2 - a1;
  const [x1, y1] = polar(rOut * 0.86, a1 + span * 0.3);
  const [cx, cy] = polar(rOut * 0.98, a1 + span * 0.5);
  const [x2, y2] = polar(rOut * 0.86, a1 + span * 0.7);
  return `M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`;
}

const CROISSANT_PATHS = CROISSANT_SEGMENTS.map((s) => ({
  d: croissantSegment(s),
  hl: croissantHighlight(s),
}));

export function CroissantGraphic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {CROISSANT_PATHS.map((p) => (
        <g key={p.d}>
          <path d={p.d} fill={C.wafer} stroke={C.crust} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={p.hl} stroke={C.creamDeep} strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------ Bread loaf ------------------------------ */

export function BreadLoafGraphic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 86 C8 48 40 22 80 22 C120 22 152 48 148 86 Q148 98 136 98 H24 Q12 98 12 86 Z" fill={C.wafer} />
      <path d="M12.4 80 C14 90 16 98 24 98 H136 C144 98 146 90 147.6 80 Z" fill={C.crust} opacity="0.5" />
      <path
        d="M46 46 Q57 51 60 66 M72 38 Q83 44 86 59 M98 40 Q109 47 111 62"
        stroke={C.crust}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M47.5 49 Q55 53 57.5 62 M73.5 41 Q81 46 83.5 55 M99.5 43 Q107 49 108.5 58"
        stroke={C.creamDeep}
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M32 50 C42 34 60 27 78 26" stroke={C.creamDeep} strokeOpacity="0.6" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------ Cake slice ------------------------------ */

export function CakeSliceGraphic(props: SVGProps<SVGSVGElement>) {
  // Wedge in three-quarter view: tip T (front left), near back corner N,
  // far back corner F; layers are offsets below the top edge.
  const T = [12, 64];
  const N = [124, 78];
  const F = [148, 50];
  const H = 46;
  const side = (d1: number, d2: number) =>
    `M${T[0]} ${T[1] + d1} L${N[0]} ${N[1] + d1} L${N[0]} ${N[1] + d2} L${T[0]} ${T[1] + d2} Z`;
  const back = (d1: number, d2: number) =>
    `M${N[0]} ${N[1] + d1} L${F[0]} ${F[1] + d1} L${F[0]} ${F[1] + d2} L${N[0]} ${N[1] + d2} Z`;
  return (
    <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Back (outer) face: frosting all over */}
      <path d={back(0, H)} fill={C.creamDeep} />
      <path d={back(0, H)} fill={C.espresso} opacity="0.06" />
      <path d={back(H - 8, H)} fill={C.strawberry} opacity="0.55" />
      {/* Side face: sponge, jam, cream, sponge */}
      <path d={side(0, 7)} fill={C.creamDeep} />
      <path d={side(7, 21)} fill={C.strawberry} />
      <path d={side(21, 25)} fill={C.berry} />
      <path d={side(25, 32)} fill={C.cream} />
      <path d={side(32, H)} fill={C.strawberry} />
      <path d={`M${T[0] + 4} ${T[1] + 11} L${N[0] - 4} ${N[1] + 11}`} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
      {/* Top face */}
      <path d={`M${T[0]} ${T[1]} L${F[0]} ${F[1]} L${N[0]} ${N[1]} Z`} fill="#ffffff" />
      <path d={`M${T[0]} ${T[1]} L${N[0]} ${N[1]} L${N[0] + 6} ${N[1] - 7} Z`} fill={C.creamDeep} opacity="0.6" />
      {/* Cream dollop + cherry */}
      <circle cx="128" cy="60" r="9" fill={C.cream} />
      <circle cx="120" cy="64" r="6" fill={C.creamDeep} />
      <circle cx="136" cy="63" r="6" fill={C.creamDeep} />
      <circle cx="128" cy="49" r="8" fill={C.cherry} />
      <circle cx="125" cy="46" r="2.4" fill="#ffffff" opacity="0.5" />
      <path d="M128 42 C130 34 136 31 141 33" stroke={C.pistachio} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- Hero cluster ------------------------------ */

/**
 * The hero composition: an ice cream cone at the back, a coffee to go, a
 * cake slice and a croissant in front, and a small "card" chip with the
 * Loodly mark and a decorative barcode.
 */
export function HeroTreatsGraphic(props: SVGProps<SVGSVGElement>) {
  const bars = [3, 1.5, 2, 1, 3, 1.5, 1, 2.5, 1.5, 3];
  let x = 338;
  const barRects = bars.map((w) => {
    const r = { x, w };
    x += w + 2.6;
    return r;
  });
  return (
    <svg viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Ice cream cone, back centre */}
      <ConeGraphic x={140} y={6} width={140} height={233} />
      {/* Coffee to go, front left */}
      <CoffeeCupGraphic x={30} y={160} width={132} height={187} />
      {/* Cake slice, front right */}
      <CakeSliceGraphic x={236} y={210} width={170} height={138} />
      {/* Croissant, bottom centre */}
      <CroissantGraphic x={112} y={290} width={196} height={122} />

      {/* Loyalty card chip, top right */}
      <g transform="rotate(8 340 90)">
        <rect x="286" y="58" width="116" height="72" rx="18" fill={C.espresso} opacity="0.1" />
        <rect x="282" y="52" width="116" height="72" rx="18" fill="#ffffff" />
        <LoodlyMark x={292} y={62} width={34} height={52} />
        {barRects.map((b) => (
          <rect key={b.x} x={b.x} y={68} width={b.w} height={40} rx={0.5} fill={C.espresso} />
        ))}
      </g>

      {/* Sparkles */}
      <path d="M58 92 L61 101 L70 104 L61 107 L58 116 L55 107 L46 104 L55 101 Z" fill={C.mango} />
      <path d="M392 176 L394 182 L400 184 L394 186 L392 192 L390 186 L384 184 L390 182 Z" fill={C.mango} opacity="0.8" />
    </svg>
  );
}
