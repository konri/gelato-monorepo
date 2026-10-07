import { useId, type SVGProps } from "react";

/**
 * The Loodly mark (cone + scoops + "oo" rings) ported 1:1 from
 * `public/loodly-mark.svg`, as an inline, nestable <svg>.
 *
 * - Decorative (`aria-hidden`) unless `title` is given.
 * - Nests inside other SVGs: pass `x`, `y`, `width`, `height`.
 * - `detail` adds the waffle lattice (use at 64 px or larger). Its clipPath id
 *   is unique per instance, because the source file's fixed `id="coneClip"`
 *   collides when the mark appears several times on one page.
 */

const LOGO_RED = "#EC2828";
const LOGO_CREAM = "#FFF7F0";
const LOGO_MANGO = "#FFB020";

const SCOOPS: { cx: number; cy: number; r: number }[] = [
  { cx: 34.69, cy: 38.31, r: 8.9 },
  { cx: 65.31, cy: 38.31, r: 8.9 },
  { cx: 44.48, cy: 30.3, r: 8.19 },
  { cx: 55.52, cy: 30.3, r: 8.19 },
  { cx: 50, cy: 23.18, r: 7.66 },
  { cx: 40.92, cy: 43.83, r: 9.44 },
  { cx: 59.08, cy: 43.83, r: 9.44 },
  { cx: 50, cy: 36.53, r: 9.79 },
];

const LATTICE = Array.from({ length: 10 }, (_, k) => {
  const a = -36.2 + 7.4 * k;
  const b = 83.8 + 7.4 * k;
  return [`M-10 ${a.toFixed(2)} L110 ${b.toFixed(2)}`, `M-10 ${b.toFixed(2)} L110 ${a.toFixed(2)}`];
}).flat();

export type LoodlyMarkProps = SVGProps<SVGSVGElement> & {
  /** Accessible name. When omitted the mark is decorative. */
  title?: string;
  /** Draw the waffle lattice on the cone (64 px and up). */
  detail?: boolean;
};

export function LoodlyMark({ title, detail = false, ...props }: LoodlyMarkProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `loodly-cone-${uid}`;
  const titleId = `loodly-title-${uid}`;

  const a11y = title
    ? { role: "img" as const, "aria-labelledby": titleId }
    : { "aria-hidden": true as const, focusable: "false" as const };

  return (
    <svg viewBox="24 14 52 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...a11y} {...props}>
      {title ? <title id={titleId}>{title}</title> : null}
      <path d="M30.18 46 L69.82 46 L50 92 Z" fill={LOGO_MANGO} />
      <path d="M31.88 47.7 L68.12 47.7 L50 89.76 Z" fill={LOGO_CREAM} />
      {detail ? (
        <>
          <clipPath id={clipId}>
            <path d="M31.88 47.7 L68.12 47.7 L50 89.76 Z" />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            {LATTICE.map((d) => (
              <path key={d} d={d} stroke={LOGO_MANGO} strokeWidth="1.5" />
            ))}
          </g>
        </>
      ) : null}
      {SCOOPS.map((s) => (
        <circle
          key={`${s.cx}-${s.cy}`}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={LOGO_CREAM}
          stroke={LOGO_RED}
          strokeWidth="1.6"
        />
      ))}
      <ellipse cx="38.6" cy="52" rx="12.2" ry="13" fill={LOGO_RED} />
      <ellipse cx="61.4" cy="52" rx="12.2" ry="13" fill={LOGO_RED} />
      <ellipse cx="38.6" cy="52" rx="7.2" ry="8" fill={LOGO_CREAM} />
      <ellipse cx="61.4" cy="52" rx="7.2" ry="8" fill={LOGO_CREAM} />
    </svg>
  );
}

/** Logo colours, for illustrations that pair the mark with a wordmark. */
export const LOODLY_LOGO_COLORS = {
  red: LOGO_RED,
  cream: LOGO_CREAM,
  mango: LOGO_MANGO,
} as const;
