"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import type { PlayerMode } from "./LottiePlayer";
import type { SceneName } from "./scenes";
import { useReducedMotion } from "./useReducedMotion";

// Client only: lottie-web needs the DOM. Loaded the first time a scene gets
// near the viewport, so the library never ships with the initial page JS.
const LottiePlayer = dynamic(() => import("./LottiePlayer"), {
  ssr: false,
  loading: () => null,
});

/** Share of the box that must be on screen before the loop runs. */
const VISIBLE_RATIO = 0.3;

export type LottieSceneProps = {
  /** Scene file: `public/lottie/<name>.json`. */
  name: SceneName;
  /** Text alternative for the animation (exposed as an image label). */
  label: string;
  className?: string;
  /** Override the play/pause button labels (default: business.a11y.*). */
  playLabel?: string;
  pauseLabel?: string;
  /**
   * Names the scene in the play/pause button ("Pause animation: <name>"), so
   * several buttons on one page are distinguishable. Defaults to `label`.
   */
  controlsLabel?: string;
};

type Choice = { value: "play" | "pause"; reducedMotion: boolean };

/**
 * A looping Lottie scene in a fixed 4:3 box (no layout shift).
 *
 * - Plays only while ≥30% visible and the tab is visible; pauses otherwise.
 * - prefers-reduced-motion: stops on the scene's "poster" frame; the visitor
 *   can still press Play.
 * - Play/pause button for WCAG 2.2.2 (the loops run longer than 5 s).
 * - The animation itself is aria-hidden; `label` is the text alternative.
 */
export function LottieScene({ name, label, className, playLabel, pauseLabel, controlsLabel }: LottieSceneProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [everPlayed, setEverPlayed] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      setInView(true);
      return;
    }
    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    const viewObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) {
          setInView(entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO * 0.98);
        }
      },
      { threshold: [0, VISIBLE_RATIO, 0.6, 1] },
    );
    nearObserver.observe(el);
    viewObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      viewObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // A choice made under one motion preference is dropped when it changes, so
  // turning reduced motion on while a scene plays sends it back to its poster.
  const userChoice = choice && choice.reducedMotion === reducedMotion ? choice.value : null;
  const wantsPlay = userChoice === "play" || (userChoice === null && !reducedMotion);
  const active = ready && wantsPlay && inView && pageVisible;

  useEffect(() => {
    if (active) setEverPlayed(true);
  }, [active]);

  let mode: PlayerMode;
  if (active) mode = "play";
  else if (reducedMotion && userChoice === null) mode = "poster";
  else if (!everPlayed) mode = "idle";
  else mode = "pause";

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const buttonLabel = wantsPlay
    ? pauseLabel ?? translate("business.a11y.pause", "Pause animation")
    : playLabel ?? translate("business.a11y.play", "Play animation");

  return (
    <div
      ref={rootRef}
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-cream-soft ${className ?? ""}`}
    >
      <div role="img" aria-label={label} className="absolute inset-0">
        {/* Quiet placeholder until the first frame is drawn (no motion). */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="absolute left-[18%] top-[20%] h-[52%] w-[46%] rounded-[45%] bg-cream-deep" />
          <span className="absolute bottom-[16%] right-[14%] h-[30%] w-[26%] rounded-[45%] bg-cream-deep/70" />
        </div>
        {near && !failed && (
          <LottiePlayer
            name={name}
            mode={mode}
            onReady={() => setReady(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {ready && !failed && (
        <button
          type="button"
          onClick={() =>
            setChoice({ value: wantsPlay ? "pause" : "play", reducedMotion })
          }
          aria-label={`${buttonLabel}: ${controlsLabel ?? label}`}
          title={buttonLabel}
          className="absolute bottom-2.5 right-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-espresso shadow-sm ring-1 ring-espresso/10 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry"
        >
          {wantsPlay ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default LottieScene;
