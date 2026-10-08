import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The system "Reduce Motion" setting, or `null` until it has been read — for
 * motion that starts on mount (looping illustrations), which should wait for
 * the answer instead of starting and then snapping still.
 */
export function useReduceMotionSetting(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduce(v);
      })
      .catch(() => {
        if (mounted) setReduce((prev) => prev ?? false);
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** The system "Reduce Motion" setting (no confetti, no count-up when on). */
export function useReduceMotion(): boolean {
  return useReduceMotionSetting() ?? false;
}
