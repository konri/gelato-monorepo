"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem, LottiePlayer as LottieApi } from "lottie-web/build/player/lottie_light";
import type { SceneName } from "./scenes";

/**
 * What the player should show right now.
 * - `idle`   — poster frame, before the scene has ever played (frame 0 is mostly
 *              empty, so the poster is what shows while the visitor scrolls in)
 * - `play`   — loop; the first play starts from frame 0, later ones resume
 * - `pause`  — freeze on the current frame (scrolled away, tab hidden, user pause)
 * - `poster` — freeze on the scene's "poster" marker (reduced motion)
 */
export type PlayerMode = "idle" | "play" | "pause" | "poster";

export type LottiePlayerProps = {
  name: SceneName;
  mode: PlayerMode;
  onReady: () => void;
  onError?: () => void;
};

// lottie-web touches `document` at import time, so it is only ever imported
// from an effect. One shared promise: the library loads once for all scenes.
let lottiePromise: Promise<LottieApi> | null = null;
function loadLottie(): Promise<LottieApi> {
  if (!lottiePromise) {
    lottiePromise = import("lottie-web/build/player/lottie_light").then((mod) => mod.default);
    lottiePromise.catch(() => {
      lottiePromise = null;
    });
  }
  return lottiePromise;
}

// Raw JSON text per scene. lottie-web mutates the animation data it is given,
// so every mount parses a fresh copy instead of sharing one object.
const sceneCache = new Map<SceneName, Promise<string>>();
function loadScene(name: SceneName): Promise<string> {
  let pending = sceneCache.get(name);
  if (!pending) {
    pending = fetch(`/lottie/${name}.json`).then((res) => {
      if (!res.ok) throw new Error(`Lottie scene "${name}" failed: HTTP ${res.status}`);
      return res.text();
    });
    pending.catch(() => sceneCache.delete(name));
    sceneCache.set(name, pending);
  }
  return pending;
}

export default function LottiePlayer({ name, mode, onReady, onError }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  /** Whether this animation has played yet (the first play starts from frame 0). */
  const hasStartedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  // Create / destroy the animation. StrictMode's double effect is covered by
  // `cancelled` + destroy().
  useEffect(() => {
    let cancelled = false;
    let anim: AnimationItem | null = null;
    const fail = () => {
      if (!cancelled) onErrorRef.current?.();
    };

    Promise.all([loadLottie(), loadScene(name)])
      .then(([lottie, json]) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: false,
          animationData: JSON.parse(json),
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
          },
        });
        animRef.current = anim;
        hasStartedRef.current = false;
        anim.addEventListener("data_failed", fail);
        const markLoaded = () => {
          if (!cancelled) setLoaded(true);
        };
        // With inline data lottie can finish synchronously inside loadAnimation.
        if (anim.isLoaded) markLoaded();
        else anim.addEventListener("DOMLoaded", markLoaded);
      })
      .catch(fail);

    return () => {
      cancelled = true;
      anim?.destroy();
      animRef.current = null;
      setLoaded(false);
    };
  }, [name]);

  // Drive playback from the requested mode.
  useEffect(() => {
    const anim = animRef.current;
    if (!loaded || !anim) return;
    switch (mode) {
      case "play":
        if (hasStartedRef.current) {
          anim.play();
        } else {
          hasStartedRef.current = true;
          anim.goToAndPlay(0, true);
        }
        break;
      case "pause":
        anim.pause();
        break;
      case "poster":
        anim.goToAndStop("poster");
        break;
      case "idle":
        anim.goToAndStop("poster");
        break;
    }
  }, [loaded, mode]);

  // Declared after the mode effect, so the first frame is set before the
  // parent fades the player in.
  useEffect(() => {
    if (loaded) onReadyRef.current();
  }, [loaded]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none [&>svg]:block ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
