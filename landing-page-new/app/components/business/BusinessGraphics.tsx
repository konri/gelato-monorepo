import type { SVGProps } from "react";
import { LoodlyMark } from "../brand/LoodlyMark";

/**
 * Static, flat illustrations for the `/for-business` pitch (and the landing
 * teaser). Palette only, no SVG text — every label is real HTML next to the
 * graphic. Each component spreads its props onto the root <svg>, so callers
 * decide between `aria-hidden` and `role="img"` + `aria-label`.
 */

const C = {
  berry: "#c026a3",
  berryLight: "#e05bc4",
  berryDark: "#8a1673",
  espresso: "#3a1526",
  espressoLight: "#5c2a3d",
  strawberry: "#ff6f91",
  pistachio: "#8bc34a",
  mango: "#ffb020",
  cream: "#fff8f0",
  creamSoft: "#fff1e6",
  creamDeep: "#ffe6d5",
  white: "#ffffff",
  wafer: "#e8a866",
  crust: "#d18f4e",
} as const;

/* ------------------------------ helpers ------------------------------ */

const BAR_WIDTHS = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 2];
const BAR_GAP = 1.5;

/** Decorative barcode: 16 bars filling `w` × `h` from (x, y). */
function Barcode({ x, y, w, h, color = C.espresso }: { x: number; y: number; w: number; h: number; color?: string }) {
  const units = BAR_WIDTHS.reduce((a, b) => a + b, 0) + BAR_GAP * (BAR_WIDTHS.length - 1);
  const u = w / units;
  let cursor = x;
  return (
    <g fill={color}>
      {BAR_WIDTHS.map((bw, i) => {
        const bx = cursor;
        cursor += (bw + BAR_GAP) * u;
        return <rect key={i} x={bx} y={y} width={bw * u} height={h} />;
      })}
    </g>
  );
}

function Skeleton({ x, y, w, h = 8, title = false, color = C.espresso }: { x: number; y: number; w: number; h?: number; title?: boolean; color?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={color} opacity={title ? 0.22 : 0.14} />;
}

/** Generic croissant icon (not a real brand logo), centred on (cx, cy). */
function MiniCroissant({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <path d="M-11 4 C-9 -8 9 -8 11 4 C6 -1 -6 -1 -11 4 Z" fill={C.wafer} />
      <path d="M-4.5 -4.2 L-2.6 1.2 M4.5 -4.2 L2.6 1.2 M0 -5.6 V0.8" stroke={C.crust} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function Sparkle({ cx, cy, s = 1, color = C.mango }: { cx: number; cy: number; s?: number; color?: string }) {
  return (
    <path
      transform={`translate(${cx} ${cy}) scale(${s})`}
      d="M0 -8 C1.2 -2.4 2.4 -1.2 8 0 C2.4 1.2 1.2 2.4 0 8 C-1.2 2.4 -2.4 1.2 -8 0 C-2.4 -1.2 -1.2 -2.4 0 -8 Z"
      fill={color}
    />
  );
}

function Bell({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} fill={C.mango}>
      <path d="M-6 3 V-1 A6 6 0 0 1 6 -1 V3 L8 5.5 H-8 Z" />
      <circle cx="0" cy="7.5" r="2" />
    </g>
  );
}

/* ---------------------------- PlatformTrio ---------------------------- */

/**
 * Brand console (laptop) + Loodly Spot (tablet) + customer card (phone) +
 * courier. viewBox 560×420, same prop proportions as the Lottie scenes.
 */
export function PlatformTrio(props: SVGProps<SVGSVGElement>) {
  const rows = [
    { y: 194, chip: C.berry, active: true },
    { y: 233, chip: C.mango, active: false },
    { y: 272, chip: C.pistachio, active: false },
  ];
  return (
    <svg viewBox="0 0 560 420" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Backdrop */}
      <ellipse cx="290" cy="214" rx="252" ry="184" fill={C.strawberry} opacity="0.12" />
      <circle cx="478" cy="76" r="44" fill={C.mango} opacity="0.16" />
      <ellipse cx="300" cy="408" rx="236" ry="9" fill={C.espresso} opacity="0.08" />

      {/* Dashed connectors (no arrows) */}
      <g stroke={C.berry} strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" opacity="0.55">
        <path d="M298 76 C 360 48, 420 82, 424 144" />
        <path d="M210 312 C 230 318, 244 300, 260 296" />
        <path d="M514 244 C 548 272, 542 306, 522 326" />
      </g>

      {/* ---- Laptop: brand console ---- */}
      <rect x="30" y="34" width="264" height="170" rx="12" fill={C.espresso} />
      <rect x="38" y="42" width="248" height="154" rx="6" fill={C.cream} />
      {/* sidebar */}
      <rect x="38" y="42" width="46" height="154" rx="6" fill={C.berryDark} />
      <rect x="70" y="42" width="14" height="154" fill={C.berryDark} />
      <circle cx="61" cy="61" r="11" fill={C.cream} />
      <LoodlyMark x={54.5} y={50.5} width={13} height={20} />
      {[86, 102, 118, 134].map((y, i) => (
        <rect key={y} x="49" y={y} width="24" height="6" rx="3" fill={C.white} opacity={i === 0 ? 0.9 : 0.35} />
      ))}
      {/* cover banner */}
      <rect x="94" y="50" width="184" height="46" rx="6" fill={C.strawberry} opacity="0.45" />
      <path d="M150 96 L178 70 L196 86 L212 74 L246 96 Z" fill={C.white} opacity="0.35" />
      <circle cx="252" cy="64" r="6" fill={C.white} opacity="0.5" />
      {/* logo circle with a generic croissant */}
      <circle cx="122" cy="98" r="18" fill={C.white} stroke={C.berry} strokeWidth="3" />
      <MiniCroissant cx={122} cy={99} />
      <Skeleton x={148} y={102} w={96} h={10} title />
      <Skeleton x={148} y={118} w={64} h={7} />
      <Skeleton x={98} y={134} w={172} />
      <Skeleton x={98} y={148} w={150} />
      <Skeleton x={98} y={162} w={104} />
      {/* city tags + save */}
      {/* (the tablet overlaps the console's lower right corner, so keep these left of x 256) */}
      {[96, 136, 176].map((x) => (
        <g key={x}>
          <rect x={x} y="176" width="36" height="14" rx="7" fill={C.creamDeep} />
          <circle cx={x + 8.5} cy="183" r="3" fill={C.berry} />
          <rect x={x + 14} y="181" width="16" height="4" rx="2" fill={C.espresso} opacity="0.25" />
        </g>
      ))}
      <rect x="220" y="176" width="34" height="14" rx="7" fill={C.berry} />
      <rect x="228" y="181" width="18" height="4" rx="2" fill={C.white} opacity="0.8" />
      {/* base */}
      <rect x="6" y="204" width="312" height="12" rx="6" fill={C.espressoLight} />
      <rect x="132" y="204" width="60" height="5" rx="2.5" fill={C.espresso} />

      {/* ---- Tablet: Loodly Spot ---- */}
      {/* Same shapes as the Lottie `tablet()` prop: uniform 12 px bezel, slim
          kickstand behind (mirrored to the left here, clear of the courier). */}
      <ellipse cx="387" cy="338" rx="100" ry="5" fill={C.espresso} opacity="0.08" />
      <path d="M317 298 H299 L275 342 H291 Z" fill={C.espressoLight} />
      <rect x="262" y="150" width="250" height="176" rx="22" fill={C.espresso} />
      <rect x="274" y="162" width="226" height="152" rx="12" fill={C.cream} />
      <circle cx="387" cy="156" r="2.5" fill={C.espressoLight} />
      <path d="M286 162 H488 A12 12 0 0 1 500 174 V188 H274 V174 A12 12 0 0 1 286 162 Z" fill={C.berry} />
      <rect x="284" y="171" width="58" height="8" rx="4" fill={C.white} opacity="0.75" />
      <Bell cx={484} cy={173} />
      <path d="M473 167 a12 12 0 0 0 0 12 M495 167 a12 12 0 0 1 0 12" stroke={C.mango} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {rows.map((r) => (
        <g key={r.y}>
          <rect
            x="280"
            y={r.y}
            width="214"
            height="32"
            rx="8"
            fill={C.white}
            stroke={r.active ? C.berry : "none"}
            strokeWidth={r.active ? 2 : 0}
          />
          <rect x="286" y={r.y + 4} width="24" height="24" rx="6" fill={C.creamSoft} />
          <path
            d={`M${292} ${r.y + 12} h12 l-1 10 h-10 Z`}
            fill={C.wafer}
          />
          <path d={`M${295} ${r.y + 12} v-2 a3 3 0 0 1 6 0 v2`} stroke={C.crust} strokeWidth="1.6" />
          <Skeleton x={318} y={r.y + 7} w={70} h={8} title />
          <Skeleton x={318} y={r.y + 19} w={46} h={6} />
          <rect x="444" y={r.y + 9} width="42" height="14" rx="7" fill={r.chip} />
        </g>
      ))}

      {/* ---- Phone: customer card ---- */}
      <rect x="96" y="196" width="112" height="208" rx="20" fill={C.espresso} />
      <rect x="102" y="202" width="100" height="196" rx="15" fill={C.cream} />
      <rect x="139" y="207" width="26" height="5" rx="2.5" fill={C.espressoLight} />
      <LoodlyMark x={112} y={219} width={18} height={28} />
      <Skeleton x={136} y={226} w={44} h={8} title />
      <Skeleton x={136} y={238} w={30} h={6} />
      <rect x="110" y="256" width="84" height="72" rx="12" fill={C.white} />
      <Barcode x={120} y={267} w={64} h={38} />
      <Skeleton x={124} y={313} w={56} h={5} />
      <rect x="112" y="338" width="80" height="22" rx="11" fill={C.creamDeep} />
      <rect x="152" y="340" width="38" height="18" rx="9" fill={C.berry} />
      <rect x="121" y="346" width="22" height="6" rx="3" fill={C.espresso} opacity="0.3" />
      <rect x="160" y="346" width="22" height="6" rx="3" fill={C.white} opacity="0.85" />
      <circle cx="122" cy="379" r="8" fill={C.mango} />
      <circle cx="122" cy="379" r="4.5" stroke={C.cream} strokeWidth="2" />
      <Skeleton x={136} y={375} w={46} h={8} title />

      {/* ---- Courier on a scooter ---- */}
      <path d="M430 362 H452 M422 376 H446" stroke={C.espresso} strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" />
      <rect x="460" y="352" width="32" height="27" rx="5" fill={C.mango} />
      <circle cx="476" cy="365.5" r="4.5" fill={C.cream} />
      <rect x="468" y="380" width="74" height="9" rx="4.5" fill={C.berry} />
      <path d="M534 386 L546 344" stroke={C.berry} strokeWidth="6" strokeLinecap="round" />
      <path d="M538 343 H553" stroke={C.espresso} strokeWidth="5" strokeLinecap="round" />
      <path d="M503 370 L514 382" stroke={C.espresso} strokeWidth="6" strokeLinecap="round" />
      <rect x="494" y="338" width="18" height="36" rx="8" fill={C.berryDark} />
      <path d="M506 350 L539 345" stroke={C.berryDark} strokeWidth="5" strokeLinecap="round" />
      <circle cx="503" cy="326" r="10" fill={C.espressoLight} />
      <path d="M491.5 325 A11.5 11.5 0 0 1 514.5 325 Z" fill={C.mango} />
      <circle cx="480" cy="396" r="11" fill={C.cream} stroke={C.espresso} strokeWidth="4" />
      <circle cx="536" cy="396" r="11" fill={C.cream} stroke={C.espresso} strokeWidth="4" />

      {/* Sparkles */}
      <Sparkle cx={330} cy={36} />
      <Sparkle cx={48} cy={290} s={0.8} color={C.berryLight} />
      <Sparkle cx={540} cy={150} s={0.9} />
    </svg>
  );
}

/* -------------------------- IntegrationDiagram -------------------------- */

/**
 * Receipt + invoice (the business's own system) → Loodly → tablet + phone.
 * viewBox 520×200, drawn for the espresso-dark band. Nodes sit at x = 1/6,
 * 1/2 and 5/6 of the width, so a 3-column HTML label row lines up below.
 */
export function IntegrationDiagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 520 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Connectors */}
      <g stroke={C.berryLight} strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round">
        <path d="M142 100 H200" />
        <path d="M320 100 H376" />
      </g>
      <g fill={C.berryLight}>
        <circle cx="142" cy="100" r="4.5" />
        <circle cx="204" cy="100" r="4.5" />
        <circle cx="316" cy="100" r="4.5" />
        <circle cx="378" cy="100" r="4.5" />
      </g>

      {/* Left: generic invoice (A4) + receipt — no vendor marks */}
      <g transform="rotate(-8 78 98)">
        <rect x="44" y="50" width="64" height="88" rx="6" fill={C.creamDeep} />
        <rect x="52" y="60" width="24" height="7" rx="3.5" fill={C.berry} />
        <Skeleton x={52} y={76} w={46} h={6} />
        <Skeleton x={52} y={87} w={38} h={6} />
        <Skeleton x={52} y={98} w={42} h={6} />
        <rect x="52" y="111" width="48" height="2" fill={C.espresso} opacity="0.2" />
        <rect x="78" y="119" width="22" height="7" rx="3.5" fill={C.espresso} opacity="0.3" />
      </g>
      <path
        d="M86 58 H130 V150 l-5.5 -5 l-5.5 5 l-5.5 -5 l-5.5 5 l-5.5 -5 l-5.5 5 l-5.5 -5 l-5.5 5 Z"
        fill={C.white}
      />
      <Skeleton x={96} y={68} w={24} h={6} title />
      <Skeleton x={94} y={82} w={28} h={5} />
      <Skeleton x={94} y={92} w={22} h={5} />
      <Skeleton x={94} y={102} w={28} h={5} />
      <path d="M94 116 H122" stroke={C.espresso} strokeOpacity="0.25" strokeWidth="2" strokeDasharray="3 3" />
      <rect x="104" y="124" width="18" height="7" rx="3.5" fill={C.mango} />

      {/* Centre: Loodly */}
      <circle cx="260" cy="100" r="62" fill={C.berryLight} opacity="0.16" />
      <circle cx="260" cy="100" r="50" fill={C.white} />
      <LoodlyMark x={239} y={68} width={42} height={64} />

      {/* Right: tablet at the location + customer's phone */}
      {/* tablet on a slim kickstand (left, since the phone covers its right side) */}
      <path d="M408 108 H402 L392 134 H398 Z" fill={C.espressoLight} />
      <rect x="384" y="56" width="88" height="66" rx="11" fill={C.espressoLight} stroke={C.white} strokeOpacity="0.18" strokeWidth="2" />
      <rect x="390" y="62" width="76" height="54" rx="6" fill={C.cream} />
      <rect x="390" y="62" width="76" height="11" rx="6" fill={C.berry} />
      <rect x="390" y="68" width="76" height="5" fill={C.berry} />
      {[78, 92, 104].map((y, i) => (
        <g key={y}>
          <rect x="395" y={y} width="56" height="9" rx="3" fill={C.white} />
          <circle cx="401" cy={y + 4.5} r="2.5" fill={[C.berry, C.mango, C.pistachio][i]} />
          <rect x="407" y={y + 3} width="26" height="3" rx="1.5" fill={C.espresso} opacity="0.2" />
        </g>
      ))}
      <rect x="448" y="92" width="40" height="72" rx="9" fill={C.espressoLight} stroke={C.white} strokeOpacity="0.18" strokeWidth="2" />
      <rect x="452" y="97" width="32" height="62" rx="6" fill={C.cream} />
      <LoodlyMark x={462} y={101} width={12} height={18} />
      <rect x="455" y="122" width="26" height="22" rx="4" fill={C.white} />
      <Barcode x={458} y={126} w={20} h={14} />
      <rect x="456" y="148" width="24" height="7" rx="3.5" fill={C.berry} />
    </svg>
  );
}

/* ------------------------------ RoleIcon ------------------------------ */

export type BusinessRole = "brandAdmin" | "locationAdmin" | "employee";

function MiniStore({ x, y, w }: { x: number; y: number; w: number }) {
  const h = w * 1.05;
  return (
    <g>
      <rect x={x} y={y + w * 0.36} width={w} height={h - w * 0.36} rx="1.5" stroke={C.berry} strokeWidth="2" fill={C.white} />
      <rect x={x - 1} y={y} width={w + 2} height={w * 0.4} rx="1.5" fill={C.berry} />
      <rect x={x + w * 0.36} y={y + h - w * 0.42} width={w * 0.28} height={w * 0.42} fill={C.berry} />
    </g>
  );
}

/** 48 px role pictogram: berry on cream-soft. Decorative. */
export function RoleIcon({ role, className }: { role: BusinessRole; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false" className={className}>
      <rect width="48" height="48" rx="14" fill={C.creamSoft} />
      {role === "brandAdmin" && (
        <g>
          <path d="M15.5 17 L14 8.5 L19.5 12.5 L24 6.5 L28.5 12.5 L34 8.5 L32.5 17 Z" fill={C.mango} stroke={C.berry} strokeWidth="1.8" strokeLinejoin="round" />
          <MiniStore x={6.5} y={22} w={10} />
          <MiniStore x={19} y={22} w={10} />
          <MiniStore x={31.5} y={22} w={10} />
        </g>
      )}
      {role === "locationAdmin" && (
        <g>
          <MiniStore x={5.5} y={18} w={13} />
          <MiniStore x={21} y={18} w={13} />
          <circle cx="40" cy="13" r="4.2" stroke={C.berry} strokeWidth="2.2" />
          <path d="M40 17.2 V33 M40 26 H43 M40 30.5 H43" stroke={C.berry} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}
      {role === "employee" && (
        <g>
          <circle cx="17" cy="15" r="5.5" fill={C.berry} />
          <path d="M7 39 V34 A10 10 0 0 1 27 34 V39 Z" fill={C.berry} />
          <path d="M24 31 L31 31" stroke={C.berryDark} strokeWidth="3" strokeLinecap="round" />
          <rect x="28" y="21" width="13" height="7.5" rx="2.5" fill={C.espresso} />
          <path d="M31.5 28 L30 35" stroke={C.espresso} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M41 22.5 L45 20 M41 26.5 L45 29" stroke={C.strawberry} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
