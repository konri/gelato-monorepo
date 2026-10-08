import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { LOGO, PALETTE as C } from './palette';

/**
 * Flat treat illustrations, ported 1:1 from the landing page
 * (landing-page-new/app/components/TreatGraphics.tsx, IceCreamGraphics.tsx and
 * brand/LoodlyMark.tsx) to react-native-svg: palette fills, no outlines, one
 * soft white highlight. Same viewBoxes and paths as the web originals, so the
 * hero composition coordinates carry over unchanged.
 *
 * Each graphic is its own <Svg> so the hero can float every treat separately.
 */

type Size = { width: number; height: number };

/* ------------------------------ Ice cream cone ------------------------------ */

export function ConeGraphic({ width, height }: Size) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 200" fill="none">
      {/* Scoops */}
      <Circle cx="60" cy="52" r="34" fill={C.strawberry} />
      <Circle cx="42" cy="70" r="28" fill={C.pistachio} />
      <Circle cx="80" cy="72" r="26" fill={C.mango} />
      <Circle cx="60" cy="82" r="30" fill={C.berry} />
      {/* Highlights */}
      <Circle cx="50" cy="42" r="7" fill={C.white} opacity={0.5} />
      <Circle cx="34" cy="62" r="5" fill={C.white} opacity={0.45} />
      <Circle cx="74" cy="64" r="5" fill={C.white} opacity={0.45} />
      {/* Cherry */}
      <Circle cx="60" cy="20" r="9" fill={C.cherry} />
      <Path d="M60 12 C64 4 72 2 76 6" stroke={C.pistachio} strokeWidth={3} strokeLinecap="round" />
      {/* Cone */}
      <Path d="M30 96 L60 190 L90 96 Z" fill={C.wafer} />
      <Path d="M30 96 L90 96 L84 108 L36 108 Z" fill={C.crust} opacity={0.6} />
      {/* Waffle pattern */}
      <Path
        d="M40 108 L60 148 M52 104 L72 132 M68 104 L82 118 M32 104 L48 128 M46 128 L64 108 M56 148 L78 108"
        stroke="#b9773a"
        strokeWidth={2}
        opacity={0.55}
      />
    </Svg>
  );
}

/* ------------------------------- Coffee to go ------------------------------- */

export function CoffeeCupGraphic({ width, height }: Size) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 170" fill="none">
      {/* Steam */}
      <Path
        d="M47 28 C40 21 54 15 47 5 M71 28 C64 21 78 15 71 5"
        stroke={C.espresso}
        strokeOpacity={0.2}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Cup body */}
      <Path d="M24 50 L34 156 Q35 164 43 164 H77 Q85 164 86 156 L96 50 Z" fill={C.white} />
      <Path d="M82 50 H96 L86 156 Q85 164 77 164 H72 Z" fill={C.creamDeep} />
      {/* Sleeve */}
      <Path d="M26.6 78 H93.4 L89 124 H31 Z" fill={C.berry} />
      <Path d="M84 78 H93.4 L89 124 H80 Z" fill={C.berryDark} opacity={0.35} />
      <Path d="M33 84 L36 118" stroke={C.white} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
      <Path
        d="M60 110 C50 103 50 95 55.5 95 C58 95 60 97.5 60 99 C60 97.5 62 95 64.5 95 C70 95 70 103 60 110 Z"
        fill={C.cream}
      />
      {/* Lid */}
      <Path d="M30 40 C30 31 40 27 60 27 C80 27 90 31 90 40 Z" fill={C.creamDeep} />
      <Rect x="49" y="30" width="22" height="4" rx="2" fill={C.espressoLight} opacity={0.55} />
      <Rect x="17" y="38" width="86" height="13" rx="6.5" fill={C.creamDeep} />
      <Rect x="17" y="46" width="86" height="5" rx="2.5" fill={C.crust} opacity={0.25} />
      <Rect x="24" y="40.5" width="34" height="4" rx="2" fill={C.white} opacity={0.6} />
    </Svg>
  );
}

/* --------------------------------- Croissant -------------------------------- */

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
type CroissantSegment = (typeof CROISSANT_SEGMENTS)[number];

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [CROISSANT_O[0] + r * Math.cos(a), CROISSANT_O[1] - r * Math.sin(a)];
}

const f = (n: number) => n.toFixed(1);

function croissantSegment({ a1, a2, rIn, rOut }: CroissantSegment) {
  const mid = (a1 + a2) / 2;
  const [x1, y1] = polar(rIn, a1);
  const [x2, y2] = polar(rOut * 0.9, a1);
  const [cx, cy] = polar(rOut * 1.14, mid);
  const [x3, y3] = polar(rOut * 0.9, a2);
  const [x4, y4] = polar(rIn, a2);
  const [ix, iy] = polar(rIn * 0.86, mid);
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} Q${f(cx)} ${f(cy)} ${f(x3)} ${f(y3)} L${f(x4)} ${f(y4)} Q${f(ix)} ${f(iy)} ${f(x1)} ${f(y1)} Z`;
}

function croissantHighlight({ a1, a2, rOut }: CroissantSegment) {
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

export function CroissantGraphic({ width, height }: Size) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 100" fill="none">
      {CROISSANT_PATHS.map((p) => (
        <G key={p.d}>
          <Path d={p.d} fill={C.wafer} stroke={C.crust} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d={p.hl} stroke={C.creamDeep} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

/* -------------------------------- Cake slice -------------------------------- */

// Wedge in three-quarter view: tip T (front left), near back corner N, far
// back corner F; layers are offsets below the top edge.
const T = [12, 64];
const N = [124, 78];
const F = [148, 50];
const H = 46;
const side = (d1: number, d2: number) =>
  `M${T[0]} ${T[1] + d1} L${N[0]} ${N[1] + d1} L${N[0]} ${N[1] + d2} L${T[0]} ${T[1] + d2} Z`;
const back = (d1: number, d2: number) =>
  `M${N[0]} ${N[1] + d1} L${F[0]} ${F[1] + d1} L${F[0]} ${F[1] + d2} L${N[0]} ${N[1] + d2} Z`;

export function CakeSliceGraphic({ width, height }: Size) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 130" fill="none">
      {/* Back (outer) face: frosting all over */}
      <Path d={back(0, H)} fill={C.creamDeep} />
      <Path d={back(0, H)} fill={C.espresso} opacity={0.06} />
      <Path d={back(H - 8, H)} fill={C.strawberry} opacity={0.55} />
      {/* Side face: sponge, jam, cream, sponge */}
      <Path d={side(0, 7)} fill={C.creamDeep} />
      <Path d={side(7, 21)} fill={C.strawberry} />
      <Path d={side(21, 25)} fill={C.berry} />
      <Path d={side(25, 32)} fill={C.cream} />
      <Path d={side(32, H)} fill={C.strawberry} />
      <Path
        d={`M${T[0] + 4} ${T[1] + 11} L${N[0] - 4} ${N[1] + 11}`}
        stroke={C.white}
        strokeOpacity={0.35}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Top face */}
      <Path d={`M${T[0]} ${T[1]} L${F[0]} ${F[1]} L${N[0]} ${N[1]} Z`} fill={C.white} />
      <Path d={`M${T[0]} ${T[1]} L${N[0]} ${N[1]} L${N[0] + 6} ${N[1] - 7} Z`} fill={C.creamDeep} opacity={0.6} />
      {/* Cream dollop + cherry */}
      <Circle cx="128" cy="60" r="9" fill={C.cream} />
      <Circle cx="120" cy="64" r="6" fill={C.creamDeep} />
      <Circle cx="136" cy="63" r="6" fill={C.creamDeep} />
      <Circle cx="128" cy="49" r="8" fill={C.cherry} />
      <Circle cx="125" cy="46" r="2.4" fill={C.white} opacity={0.5} />
      <Path d="M128 42 C130 34 136 31 141 33" stroke={C.pistachio} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/* --------------------------- Loyalty card chip --------------------------- */

// The Loodly mark (viewBox "24 14 52 80" in the landing LoodlyMark.tsx).
const MARK_SCOOPS = [
  { cx: 34.69, cy: 38.31, r: 8.9 },
  { cx: 65.31, cy: 38.31, r: 8.9 },
  { cx: 44.48, cy: 30.3, r: 8.19 },
  { cx: 55.52, cy: 30.3, r: 8.19 },
  { cx: 50, cy: 23.18, r: 7.66 },
  { cx: 40.92, cy: 43.83, r: 9.44 },
  { cx: 59.08, cy: 43.83, r: 9.44 },
  { cx: 50, cy: 36.53, r: 9.79 },
];

/** The mark drawn into a parent <Svg>, its 52×80 viewBox placed at x/y/width. */
function LoodlyMarkShape({ x, y, width }: { x: number; y: number; width: number }) {
  const s = width / 52;
  return (
    <G transform={`translate(${x - 24 * s} ${y - 14 * s}) scale(${s})`}>
      <Path d="M30.18 46 L69.82 46 L50 92 Z" fill={LOGO.mango} />
      <Path d="M31.88 47.7 L68.12 47.7 L50 89.76 Z" fill={LOGO.cream} />
      {MARK_SCOOPS.map((sc) => (
        <Circle
          key={`${sc.cx}-${sc.cy}`}
          cx={sc.cx}
          cy={sc.cy}
          r={sc.r}
          fill={LOGO.cream}
          stroke={LOGO.berry}
          strokeWidth={1.6}
        />
      ))}
      <Ellipse cx="38.6" cy="52" rx="12.2" ry="13" fill={LOGO.berry} />
      <Ellipse cx="61.4" cy="52" rx="12.2" ry="13" fill={LOGO.berry} />
      <Ellipse cx="38.6" cy="52" rx="7.2" ry="8" fill={LOGO.cream} />
      <Ellipse cx="61.4" cy="52" rx="7.2" ry="8" fill={LOGO.cream} />
    </G>
  );
}

const CARD_BARS = (() => {
  const widths = [3, 1.5, 2, 1, 3, 1.5, 1, 2.5, 1.5, 3];
  let x = 338;
  return widths.map((w) => {
    const bar = { x, w };
    x += w + 2.6;
    return bar;
  });
})();

/**
 * The hero's loyalty card: Loodly mark + decorative barcode, tilted 8°.
 * Drawn in hero coordinates; the viewBox crops to the tilted card and its
 * shadow, so the hero places it at CARD_BOX.
 */
export const CARD_BOX = { x: 274, y: 40, w: 136, h: 102 };

export function LoyaltyCardGraphic({ width, height }: Size) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${CARD_BOX.x} ${CARD_BOX.y} ${CARD_BOX.w} ${CARD_BOX.h}`}
      fill="none"
    >
      <G transform="rotate(8 340 90)">
        <Rect x="286" y="58" width="116" height="72" rx="18" fill={C.espresso} opacity={0.1} />
        <Rect x="282" y="52" width="116" height="72" rx="18" fill={C.white} />
        <LoodlyMarkShape x={292} y={62} width={34} />
        {CARD_BARS.map((b) => (
          <Rect key={b.x} x={b.x} y={68} width={b.w} height={40} rx={0.5} fill={C.espresso} />
        ))}
      </G>
    </Svg>
  );
}

/* --------------------------------- Sparkle --------------------------------- */

/** Four-point sparkle; 24×24 viewBox. */
export function SparkleGraphic({ width, height, opacity = 1 }: Size & { opacity?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z" fill={C.mango} opacity={opacity} />
    </Svg>
  );
}

/* ------------------------------- Soft glow ------------------------------- */

/**
 * The landing's blurred strawberry blob behind the hero (`bg-strawberry/20
 * blur-3xl`), as a radial gradient — React Native has no CSS blur.
 */
export function GlowGraphic({ width, height }: Size) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="onboardingHeroGlow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={C.strawberry} stopOpacity={0.26} />
          <Stop offset="0.55" stopColor={C.strawberry} stopOpacity={0.14} />
          <Stop offset="1" stopColor={C.strawberry} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#onboardingHeroGlow)" />
    </Svg>
  );
}
