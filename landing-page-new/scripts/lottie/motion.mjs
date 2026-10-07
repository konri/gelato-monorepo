/**
 * Shared motion recipes (anim() builders) for the scenes. All of them start
 * and end at rest so loops stay seamless.
 */
import { anim } from "./lib.mjs";

/** Scale 0 → 100 → 0 with a small spin, for sparkles. Returns { s, r }. */
export function twinkle(t0, { dur = 14, max = 100, spin = 45 } = {}) {
  return {
    s: anim([t0, 0, "out"], [t0 + dur / 2, max, "in"], [t0 + dur, 0]),
    r: anim([t0, 0, "linear"], [t0 + dur, spin, "hold"], [t0 + dur + 1, 0]),
  };
}

/** Scale-X grow from 0 at t0 (left-anchored skeletons), reset at `reset` (hidden). */
export function growX(t0, { dur = 12, reset, e = "out", to = 100 } = {}) {
  const frames = [
    [t0, [0, 100], e],
    [t0 + dur, [to, 100], reset !== undefined ? "hold" : "inOut"],
  ];
  if (reset !== undefined) frames.push([reset, [0, 100]]);
  return anim(...frames);
}

/** Uniform pop 0 → 100 at t0 (back ease), shrink back at tOut. */
export function popInOut(t0, tOut, { dur = 12, outDur = 10, max = 100 } = {}) {
  return anim([t0, 0, "back"], [t0 + dur, max], [tOut, max, "in"], [tOut + outDur, 0]);
}

/** Opacity 0 → 100 at t0, 100 → 0 at tOut. */
export function fadeInOut(t0, tOut, { dur = 10, outDur = 10, max = 100 } = {}) {
  return anim([t0, 0, "out"], [t0 + dur, max], [tOut, max, "in"], [tOut + outDur, 0]);
}

/** Hold value `v` and jump back to `rest` at `reset` (use while invisible). */
export function holdReset(frames, reset, rest) {
  const list = frames.map((f) => [...f]);
  const last = list[list.length - 1];
  last[2] = "hold";
  list.push([reset, rest]);
  return anim(...list);
}
