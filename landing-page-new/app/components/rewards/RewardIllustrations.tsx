import type { SVGProps } from "react";
import { LoodlyMark } from "../brand/LoodlyMark";
import { CakeSliceGraphic, CroissantGraphic } from "../TreatGraphics";

/**
 * Example reward illustrations (brief §5.2): Loodly-branded merch and a few
 * menu treats, hand-built in the flat cartoon style of IceCreamGraphics —
 * palette fills, no outlines, one soft white highlight, a ground shadow.
 *
 * - Every illustration is a 160×160 <svg> that spreads its props, so callers
 *   size it with className. They are decorative: the visible tile label names
 *   the item, so the root carries `aria-hidden` by default.
 * - Merch always carries the Loodly mark (on a cream roundel when the surface
 *   is coloured). Mark only, no typeset "loodly": the real logotype
 *   (`public/loodly-logo.svg`) is lettering + mark, and a font stand-in would
 *   not match it. Treats carry no mark: they are the brands' own products.
 * - Each item sits on a soft tinted disc (berry for merch, mango for treats),
 *   and light objects (the cream mug, the tote) carry darker accents, so
 *   they stay crisp on a white tile.
 */

const C = {
  berry: "#c026a3",
  berryLight: "#e05bc4",
  berryDark: "#8a1673",
  espresso: "#3a1526",
  espressoLight: "#5c2a3d",
  espressoDark: "#25060f",
  strawberry: "#ff6f91",
  pistachio: "#8bc34a",
  mango: "#ffb020",
  cream: "#fff8f0",
  creamSoft: "#fff1e6",
  creamDeep: "#ffe6d5",
  white: "#ffffff",
  wafer: "#e8a866",
  crust: "#d18f4e",
  waferLine: "#b9773a",
  cherry: "#e11d48",
} as const;

export type RewardId =
  | "umbrella"
  | "mug"
  | "tote"
  | "cap"
  | "thermal"
  | "tshirt"
  | "coffee"
  | "croissant"
  | "scoop"
  | "cake";

type IllustrationProps = SVGProps<SVGSVGElement>;

/* ------------------------------- helpers ------------------------------- */

const r1 = (n: number) => Math.round(n * 10) / 10;

/** LoodlyMark viewBox is 52×80; `h` is the drawn height, centred on (cx, cy). */
function Mark({ cx, cy, h }: { cx: number; cy: number; h: number }) {
  const w = (h * 52) / 80;
  return <LoodlyMark x={r1(cx - w / 2)} y={r1(cy - h / 2)} width={r1(w)} height={h} />;
}

function Frame({
  kind,
  children,
  ...props
}: IllustrationProps & { kind: "merch" | "treat" }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      {...props}
    >
      <circle
        cx="80"
        cy="80"
        r="64"
        fill={kind === "merch" ? C.berry : C.mango}
        opacity={kind === "merch" ? 0.09 : 0.14}
      />
      <ellipse cx="80" cy="146" rx="46" ry="6" fill={C.espresso} opacity="0.08" />
      {children}
    </svg>
  );
}

/* ------------------------------- Umbrella ------------------------------- */

// Open canopy seen slightly from below: seven panels between meridian ribs
// (quarter ellipses from the tip), with scalloped edges between rib ends.
const UMB = { cx: 80, top: 26, R: 66, rim: 76, dip: 8 };
const UMB_PANELS = (() => {
  const n = 7;
  const k = 0.5523; // cubic quarter-ellipse constant
  const ribs = Array.from({ length: n + 1 }, (_, i) => {
    const phi = -Math.PI / 2 + (Math.PI * i) / n;
    return {
      a: UMB.R * Math.sin(phi),
      y: UMB.rim + UMB.dip * Math.cos(phi),
    };
  });
  const down = ({ a, y }: { a: number; y: number }) =>
    `C${r1(UMB.cx + k * a)} ${UMB.top} ${r1(UMB.cx + a)} ${r1(y - k * (y - UMB.top))} ${r1(UMB.cx + a)} ${r1(y)}`;
  const up = ({ a, y }: { a: number; y: number }) =>
    `C${r1(UMB.cx + a)} ${r1(y - k * (y - UMB.top))} ${r1(UMB.cx + k * a)} ${UMB.top} ${UMB.cx} ${UMB.top}`;
  return ribs.slice(0, n).map((r, i) => {
    const next = ribs[i + 1];
    const x1 = UMB.cx + r.a;
    const x2 = UMB.cx + next.a;
    const mx = (x1 + x2) / 2;
    const my = (r.y + next.y) / 2 - (x2 - x1) * 0.3;
    return {
      d: `M${UMB.cx} ${UMB.top} ${down(r)} Q${r1(mx)} ${r1(my)} ${r1(x2)} ${r1(next.y)} ${up(next)} Z`,
      fill: i % 2 === 0 ? C.berry : C.cream,
    };
  });
})();

const drop = (cx: number, cy: number) =>
  `M${cx} ${cy - 7} C${cx + 5} ${cy} ${cx + 5} ${cy + 5} ${cx} ${cy + 5} C${cx - 5} ${cy + 5} ${cx - 5} ${cy} ${cx} ${cy - 7} Z`;

export function UmbrellaIllustration(props: IllustrationProps) {
  return (
    <Frame kind="merch" {...props}>
      <path d={drop(24, 112)} fill={C.berryLight} opacity="0.5" />
      <path d={drop(138, 120)} fill={C.berryLight} opacity="0.5" />
      <g transform="rotate(-8 80 84)">
        {/* Shaft + J-handle */}
        <path d="M80 82 V128" stroke={C.espressoLight} strokeWidth="4" strokeLinecap="round" />
        <path d="M80 126 V130 A8 8 0 0 0 96 130" stroke={C.berryDark} strokeWidth="6" strokeLinecap="round" />
        {/* Tip */}
        <rect x="77" y="14" width="6" height="14" rx="3" fill={C.espresso} />
        {/* Canopy */}
        {UMB_PANELS.map((p) => (
          <path key={p.d} d={p.d} fill={p.fill} />
        ))}
        <path d="M30 62 C33 46 48 34 64 30" stroke={C.white} strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
        <Mark cx={80} cy={58} h={26} />
      </g>
    </Frame>
  );
}

/* --------------------------------- Mug --------------------------------- */

export function MugIllustration(props: IllustrationProps) {
  return (
    <Frame kind="merch" {...props}>
      {/* Steam */}
      <path
        d="M58 58 C52 50 64 44 58 34 M80 58 C74 50 86 44 80 34"
        stroke={C.espresso}
        strokeOpacity="0.2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Handle */}
      <circle cx="101" cy="101" r="15" stroke={C.berry} strokeWidth="9" />
      {/* Body */}
      <path d="M37 68 H101 V128 Q101 138 91 138 H47 Q37 138 37 128 Z" fill={C.cream} />
      <path d="M89 68 H101 V128 Q101 138 91 138 H86 Q89 135 89 128 Z" fill={C.creamDeep} />
      <path d="M37 124 H101 V128 Q101 138 91 138 H47 Q37 138 37 128 Z" fill={C.creamDeep} />
      {/* Rim band */}
      <rect x="35" y="64" width="68" height="9" rx="4.5" fill={C.berry} />
      {/* Highlight */}
      <rect x="44" y="80" width="5" height="36" rx="2.5" fill={C.white} opacity="0.7" />
      <Mark cx={66} cy={99} h={34} />
    </Frame>
  );
}

/* ------------------------------ Tote bag ------------------------------ */

export function ToteIllustration(props: IllustrationProps) {
  return (
    <Frame kind="merch" {...props}>
      {/* Straps: back (darker) and front */}
      <path d="M62 58 C62 22 98 22 98 58" stroke={C.berryDark} strokeWidth="6" strokeLinecap="round" />
      <path d="M54 60 C54 14 106 14 106 60" stroke={C.berry} strokeWidth="6" strokeLinecap="round" />
      {/* Canvas, slightly wider at the bottom */}
      <path d="M41 54 H119 L122 136 Q122 142 116 142 H44 Q38 142 38 136 Z" fill={C.creamDeep} />
      {/* Fold shadow */}
      <path d="M104 54 H119 L122 136 Q122 142 116 142 H110 Q106 98 104 54 Z" fill={C.espresso} opacity="0.06" />
      {/* Strap tabs + hem */}
      <rect x="50" y="54" width="8" height="11" rx="2" fill={C.berry} />
      <rect x="102" y="54" width="8" height="11" rx="2" fill={C.berry} />
      <path d="M43 70 H117" stroke={C.espresso} strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 3" />
      {/* Highlight */}
      <path d="M47 80 L45.5 120" stroke={C.white} strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
      {/* Logo: mark on a roundel */}
      <circle cx="80" cy="104" r="27" fill={C.cream} />
      <Mark cx={80} cy={103} h={40} />
    </Frame>
  );
}

/* --------------------------------- Cap --------------------------------- */

export function CapIllustration(props: IllustrationProps) {
  return (
    <Frame kind="merch" {...props}>
      <g transform="translate(0 12)">
        {/* Crown */}
        <path
          d="M40 106 C38 66 60 40 90 40 C120 40 136 66 134 104 C112 112 64 114 40 106 Z"
          fill={C.strawberry}
        />
        {/* Shaded right side */}
        <path d="M110 46 C126 56 136 76 134 104 C128 106 120 108 112 109 C114 86 114 64 110 46 Z" fill={C.berryDark} opacity="0.14" />
        {/* Seams */}
        <path
          d="M89 42 C76 58 67 82 65 110 M91 42 C102 58 109 84 111 109"
          stroke={C.berryDark}
          strokeOpacity="0.3"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Top button */}
        <ellipse cx="90" cy="41" rx="7" ry="4" fill={C.berryDark} />
        {/* Highlight */}
        <path d="M54 72 C58 60 66 52 76 47" stroke={C.white} strokeOpacity="0.4" strokeWidth="5" strokeLinecap="round" />
        {/* Visor */}
        <path
          d="M44 100 C28 103 13 113 15 123 C18 130 44 129 72 121 C88 116 100 111 106 107 C84 112 62 110 44 100 Z"
          fill={C.berry}
        />
        <path d="M15 123 C18 130 44 129 72 121 C88 116 100 111 106 107 C92 116 60 128 30 129 C21 129 16 127 15 123 Z" fill={C.berryDark} opacity="0.5" />
        {/* Logo roundel on the front panel */}
        <circle cx="88" cy="80" r="17" fill={C.cream} />
        <Mark cx={88} cy={79.5} h={27} />
      </g>
    </Frame>
  );
}

/* ----------------------------- Thermal cup ----------------------------- */

export function ThermalIllustration(props: IllustrationProps) {
  return (
    <Frame kind="merch" {...props}>
      {/* Body */}
      <path d="M54 46 H106 V128 Q106 142 92 142 H68 Q54 142 54 128 Z" fill={C.espresso} />
      <path d="M54 130 H106 Q105 142 92 142 H68 Q55 142 54 130 Z" fill={C.espressoDark} />
      {/* Highlight strip */}
      <rect x="60" y="54" width="6" height="74" rx="3" fill={C.white} opacity="0.25" />
      {/* Sleeve band */}
      <rect x="54" y="84" width="52" height="22" fill={C.berry} />
      {/* Lid */}
      <rect x="57" y="22" width="46" height="14" rx="7" fill={C.creamDeep} />
      <rect x="50" y="32" width="60" height="16" rx="8" fill={C.creamDeep} />
      <rect x="50" y="42" width="60" height="6" rx="3" fill={C.crust} opacity="0.25" />
      <rect x="66" y="26" width="18" height="5" rx="2.5" fill={C.espressoDark} />
      {/* Logo roundel on the sleeve */}
      <circle cx="80" cy="95" r="15" fill={C.cream} />
      <Mark cx={80} cy={94.5} h={23} />
    </Frame>
  );
}

/* ------------------------------- T-shirt ------------------------------- */

const TEE =
  "M62 34 C68 42 92 42 98 34 L122 42 L142 66 L126 78 L118 70 V134 Q118 138 114 138 H46 Q42 138 42 134 V70 L34 78 L18 66 L38 42 Z";

export function TshirtIllustration(props: IllustrationProps) {
  return (
    <Frame kind="merch" {...props}>
      {/* Mango tee: a cream shirt all but vanished on the pale disc + white tile */}
      <path d={TEE} fill={C.mango} />
      {/* Fold shadow */}
      <path d="M118 84 V134 Q118 138 114 138 H74 C92 128 108 108 118 84 Z" fill={C.espresso} opacity="0.08" />
      {/* Sleeve hems */}
      <path d="M142 66 L126 78 L121.8 73.8 L138.2 61.4 Z" fill={C.berry} opacity="0.55" />
      <path d="M18 66 L34 78 L38.2 73.8 L21.8 61.4 Z" fill={C.berry} opacity="0.55" />
      {/* Rib collar */}
      <path d="M62 34 C68 44 92 44 98 34" stroke={C.berry} strokeWidth="5" strokeLinecap="round" />
      {/* Highlight */}
      <path d="M50 78 V122" stroke={C.white} strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
      {/* Chest logo: mark on a cream roundel (coloured surface) */}
      <circle cx="80" cy="84" r="22" fill={C.cream} />
      <Mark cx={80} cy={83} h={32} />
    </Frame>
  );
}

/* -------------------------------- Coffee -------------------------------- */

export function CoffeeIllustration(props: IllustrationProps) {
  return (
    <Frame kind="treat" {...props}>
      {/* Steam */}
      <path
        d="M64 62 C58 54 70 48 64 38 M84 62 C78 54 90 48 84 38"
        stroke={C.espresso}
        strokeOpacity="0.2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Saucer */}
      <ellipse cx="78" cy="130" rx="56" ry="14" fill={C.creamDeep} />
      <ellipse cx="78" cy="128" rx="38" ry="8" fill={C.crust} opacity="0.2" />
      {/* Handle */}
      <circle cx="112" cy="96" r="12" stroke={C.berry} strokeWidth="7" />
      {/* Cup */}
      <path d="M38 78 C38 110 52 128 74 128 C96 128 110 110 110 78 A36 10 0 0 0 38 78 Z" fill={C.berry} />
      <path d="M96 86 C96 104 90 118 80 125 C96 124 108 108 110 80 Z" fill={C.berryDark} opacity="0.3" />
      <ellipse cx="74" cy="78" rx="36" ry="10" fill={C.berryDark} />
      {/* Crema + latte heart */}
      <ellipse cx="74" cy="79.5" rx="31" ry="7.5" fill={C.crust} />
      <path d="M74 84 C66 80 66 75.5 70 75.5 C72 75.5 74 77 74 78 C74 77 76 75.5 78 75.5 C82 75.5 82 80 74 84 Z" fill={C.cream} />
      {/* Highlight */}
      <path d="M45 90 C47 104 53 114 61 120" stroke={C.white} strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  );
}

/* ------------------------------- Croissant ------------------------------- */

export function CroissantIllustration(props: IllustrationProps) {
  return (
    <Frame kind="treat" {...props}>
      {/* Plate */}
      <ellipse cx="80" cy="122" rx="60" ry="15" fill={C.creamDeep} />
      <ellipse cx="80" cy="120" rx="48" ry="10" fill={C.white} opacity="0.7" />
      {/* Croissant (shared TreatGraphics shapes) */}
      <CroissantGraphic x={16} y={44} width={128} height={80} />
    </Frame>
  );
}

/* --------------------------------- Scoop --------------------------------- */

// Waffle lattice kept inside the cone by construction: every line runs
// between the band (y = 82) and the slanted edges x = 54 + 0.371(y - 72) and
// x = 106 - 0.371(y - 72), so no clipPath (and no id) is needed.
const CONE_LATTICE = [
  "M74.1 126.1 L82.5 135.3", "M65.8 103.8 L86 126", "M58 82 L89.4 116.6",
  "M70 82 L92.9 107.2", "M82 82 L96.4 97.8", "M94 82 L99.9 88.5",
  "M85.9 126.1 L77.5 135.3", "M94.2 103.8 L74 126", "M102 82 L70.6 116.6",
  "M90 82 L67.1 107.2", "M78 82 L63.6 97.8", "M66 82 L60.1 88.5",
];

export function ScoopIllustration(props: IllustrationProps) {
  return (
    <Frame kind="treat" {...props}>
      {/* Cone */}
      <path d="M54 72 L80 142 L106 72 Z" fill={C.wafer} />
      <path d="M54 72 H106 L102.5 82 H57.5 Z" fill={C.crust} opacity="0.6" />
      <path d={CONE_LATTICE.join(" ")} stroke={C.waferLine} strokeWidth="2" opacity="0.55" />
      {/* Scoop with a melting rim */}
      <circle cx="80" cy="56" r="31" fill={C.strawberry} />
      {[54, 65, 76, 87, 98, 107].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 === 0 ? 76 : 78} r="7.5" fill={C.strawberry} />
      ))}
      {/* Drip */}
      <path d="M90 78 V92 A4.5 4.5 0 0 0 99 92 V78 Z" fill={C.strawberry} />
      {/* Highlight */}
      <circle cx="68" cy="44" r="7" fill={C.white} opacity="0.5" />
      {/* Cherry */}
      <circle cx="80" cy="24" r="8" fill={C.cherry} />
      <circle cx="77" cy="21" r="2.4" fill={C.white} opacity="0.5" />
      <path d="M80 17 C82 10 88 7 93 9" stroke={C.pistachio} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

/* ------------------------------ Cake slice ------------------------------ */

export function CakeIllustration(props: IllustrationProps) {
  return (
    <Frame kind="treat" {...props}>
      {/* Plate */}
      <ellipse cx="80" cy="124" rx="62" ry="14" fill={C.creamDeep} />
      <ellipse cx="80" cy="122" rx="50" ry="9" fill={C.white} opacity="0.7" />
      {/* Slice (shared TreatGraphics shapes, 160×130 → 128×104) */}
      <CakeSliceGraphic x={16} y={26} width={128} height={104} />
    </Frame>
  );
}

/* ------------------------------- Catalogue ------------------------------- */

export const REWARD_EXAMPLES: {
  id: RewardId;
  kind: "merch" | "treat";
  Illustration: (p: IllustrationProps) => JSX.Element;
}[] = [
  { id: "coffee", kind: "treat", Illustration: CoffeeIllustration },
  { id: "croissant", kind: "treat", Illustration: CroissantIllustration },
  { id: "scoop", kind: "treat", Illustration: ScoopIllustration },
  { id: "cake", kind: "treat", Illustration: CakeIllustration },
  { id: "umbrella", kind: "merch", Illustration: UmbrellaIllustration },
  { id: "mug", kind: "merch", Illustration: MugIllustration },
  { id: "tote", kind: "merch", Illustration: ToteIllustration },
  { id: "cap", kind: "merch", Illustration: CapIllustration },
  { id: "thermal", kind: "merch", Illustration: ThermalIllustration },
  { id: "tshirt", kind: "merch", Illustration: TshirtIllustration },
];
