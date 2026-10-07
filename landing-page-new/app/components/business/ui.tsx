import type { ReactNode } from "react";

/** Visible keyboard focus on light backgrounds. */
export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry";

/** Visible keyboard focus on berry / espresso backgrounds. */
export const FOCUS_RING_ON_DARK =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Sections sit under a fixed header; keep anchor jumps clear of it. */
export const SECTION_ANCHOR = "scroll-mt-20";

export const BTN_PRIMARY = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-berry px-7 py-3 text-center font-semibold text-white shadow-xl shadow-berry/25 transition-transform motion-safe:hover:scale-105 ${FOCUS_RING}`;

export const BTN_SECONDARY = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-berry/25 bg-white px-7 py-3 text-center font-semibold text-berry transition-colors hover:border-berry hover:bg-cream-soft ${FOCUS_RING}`;

/** White pill with berry text, for berry / espresso bands. */
export const BTN_ON_DARK = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-center font-bold text-berry shadow-xl transition-transform motion-safe:hover:scale-105 ${FOCUS_RING_ON_DARK}`;

/** light = cream backgrounds, dark = espresso band (mango eyebrow), berry = berry/espresso gradient (white eyebrow). */
type Tone = "light" | "dark" | "berry";

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={
        tone === "dark"
          ? "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-mango"
          : tone === "berry"
            ? "inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white"
            : "inline-flex items-center gap-2 rounded-full border border-berry/20 bg-white/70 px-4 py-1.5 text-sm font-semibold text-berry"
      }
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  tone = "light",
  align = "center",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: Tone;
  align?: "center" | "left";
}) {
  const dark = tone !== "light";
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <h2
        id={id}
        className={`${eyebrow ? "mt-4" : ""} text-balance text-3xl font-black tracking-tight sm:text-4xl ${
          dark ? "text-white" : "text-espresso"
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 text-lg leading-relaxed ${dark ? "text-white/80" : "text-espresso/70"}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}
