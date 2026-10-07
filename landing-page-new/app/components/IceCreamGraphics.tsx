import type { SVGProps } from "react";

/**
 * Hand-built ice cream SVG illustrations — the ice cream shop part of the
 * multi-category graphics. Coffee, croissant, bread and cake live in
 * `TreatGraphics.tsx` (same flat style), which reuses `ConeGraphic`.
 * Each graphic is self-contained and scales via width/height or className.
 */

export function ConeGraphic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Scoops */}
      <circle cx="60" cy="52" r="34" fill="#ff6f91" />
      <circle cx="42" cy="70" r="28" fill="#8bc34a" />
      <circle cx="80" cy="72" r="26" fill="#ffb020" />
      <circle cx="60" cy="82" r="30" fill="#c026a3" />
      {/* Highlights */}
      <circle cx="50" cy="42" r="7" fill="#ffffff" opacity="0.5" />
      <circle cx="34" cy="62" r="5" fill="#ffffff" opacity="0.45" />
      <circle cx="74" cy="64" r="5" fill="#ffffff" opacity="0.45" />
      {/* Cherry */}
      <circle cx="60" cy="20" r="9" fill="#e11d48" />
      <path d="M60 12 C64 4 72 2 76 6" stroke="#8bc34a" strokeWidth="3" strokeLinecap="round" />
      {/* Cone */}
      <path d="M30 96 L60 190 L90 96 Z" fill="#e8a866" />
      <path d="M30 96 L90 96 L84 108 L36 108 Z" fill="#d18f4e" opacity="0.6" />
      {/* Waffle pattern */}
      <path
        d="M40 108 L60 148 M52 104 L72 132 M68 104 L82 118 M32 104 L48 128 M46 128 L64 108 M56 148 L78 108"
        stroke="#b9773a"
        strokeWidth="2"
        opacity="0.55"
      />
    </svg>
  );
}

export function ScoopGraphic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="60" cy="60" r="46" fill="#ffb020" />
      <path d="M60 14 a46 46 0 0 1 0 92 a30 46 0 0 0 0 -92 Z" fill="#c026a3" opacity="0.85" />
      <circle cx="44" cy="46" r="9" fill="#ffffff" opacity="0.5" />
      <circle cx="60" cy="8" r="7" fill="#e11d48" />
    </svg>
  );
}

export function SprinkleField({ className }: { className?: string }) {
  const sprinkles = [
    { x: 12, y: 20, r: 12, c: "#ff6f91" },
    { x: 82, y: 12, r: 6, c: "#8bc34a" },
    { x: 40, y: 70, r: 5, c: "#ffb020" },
    { x: 90, y: 60, r: 9, c: "#c026a3" },
    { x: 60, y: 30, r: 4, c: "#ff6f91" },
    { x: 20, y: 90, r: 7, c: "#8bc34a" },
    { x: 70, y: 90, r: 5, c: "#ffb020" },
  ];
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {sprinkles.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity="0.5" />
      ))}
    </svg>
  );
}
