import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, TextInput, View } from 'react-native';

/** A scanner "types" a whole code within a few ms per character; people are far slower. */
const BURST_MIN_LENGTH = 8;
const BURST_MAX_MS_PER_CHAR = 40;
const SILENCE_MS = 120;
const REFOCUS_MS = 150;

/**
 * Keyboard-wedge detection for a text field (BRANDS_SPEC §4.8): a scanner
 * either ends a code with Enter (the field's submit, or "\r"/"\n" inside the
 * text), or sends no suffix at all. Without a suffix, a fast burst of at least
 * 8 characters followed by 120 ms of silence counts as one scanned code.
 * Typing by hand is far slower, so it is never submitted on its own.
 */
export function useWedgeBurst(onCode: (raw: string) => void) {
  const burst = useRef<{ start: number; last: number } | null>(null);
  const silence = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (silence.current) clearTimeout(silence.current);
    silence.current = null;
    burst.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  /** Feed every text change. Returns true when the text was submitted (Enter inside it). */
  const track = useCallback(
    (next: string): boolean => {
      const now = Date.now();
      if (!burst.current || next.length <= 1) burst.current = { start: now, last: now };
      else burst.current.last = now;
      // Some scanners put the Enter suffix into the text instead of submitting.
      if (/[\r\n]/.test(next)) {
        cancel();
        onCode(next);
        return true;
      }
      if (silence.current) clearTimeout(silence.current);
      silence.current = setTimeout(() => {
        const b = burst.current;
        const length = next.trim().length;
        if (b && length >= BURST_MIN_LENGTH && b.last - b.start <= (length - 1) * BURST_MAX_MS_PER_CHAR) {
          cancel();
          onCode(next);
        }
      }, SILENCE_MS);
      return false;
    },
    [cancel, onCode],
  );

  return { track, cancel };
}

/** Another text field (or, on web, an open dialog) has the focus: a scanner field must not take it. */
function anotherFieldHasFocus(own: TextInput | null): boolean {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return false;
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || el === (own as unknown as HTMLElement | null)) return false;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) {
      return true;
    }
    // react-native-web's Modal keeps the focus inside its dialog.
    return !!el.closest?.('[aria-modal="true"]');
  }
  const focused = TextInput.State.currentlyFocusedInput?.() as unknown;
  return !!focused && focused !== (own as unknown);
}

/**
 * Keeps a scanner field focused while its screen is shown (a scanner types
 * into whatever has the focus). It takes the focus back after its own blur,
 * when the keyboard closes (native) and when focus leaves another element or
 * the window regains it (web), but never from another text field or a dialog.
 */
function useHeldFocus(ref: RefObject<TextInput | null>, canHold: boolean): () => void {
  const screenFocused = useRef(false);
  const canHoldRef = useRef(canHold);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    canHoldRef.current = canHold;
  }, [canHold]);

  const scheduleFocus = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!screenFocused.current || !canHoldRef.current) return;
      if (anotherFieldHasFocus(ref.current)) return;
      ref.current?.focus();
    }, REFOCUS_MS);
  }, [ref]);

  useFocusEffect(
    useCallback(() => {
      screenFocused.current = true;
      scheduleFocus();
      return () => {
        screenFocused.current = false;
        ref.current?.blur();
      };
    }, [ref, scheduleFocus]),
  );

  useEffect(() => {
    if (canHold) scheduleFocus();
    else ref.current?.blur();
  }, [canHold, ref, scheduleFocus]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      document.addEventListener('focusout', scheduleFocus);
      window.addEventListener('focus', scheduleFocus);
      return () => {
        document.removeEventListener('focusout', scheduleFocus);
        window.removeEventListener('focus', scheduleFocus);
      };
    }
    const sub = Keyboard.addListener('keyboardDidHide', scheduleFocus);
    // React Native has no global focus event: when another field lost the
    // focus without the keyboard closing (a hardware keyboard is attached),
    // take it back once nothing has it.
    const poll = setInterval(() => {
      if (!TextInput.State.currentlyFocusedInput?.()) scheduleFocus();
    }, 1000);
    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, [scheduleFocus]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return scheduleFocus;
}

/**
 * Native "handheld scanner" mode (BRANDS_SPEC §4.8): a USB / Bluetooth
 * scanner works as a keyboard (keyboard wedge). This 64dp field keeps the
 * focus while the Scan tab is shown, never opens the on-screen keyboard, and
 * submits on Enter, or on its own after a fast burst (useWedgeBurst). The
 * value is only trimmed; the server parses it.
 */
export function HandheldScannerInput({
  onScan,
  disabled,
  paused,
}: {
  onScan: (value: string) => void;
  disabled?: boolean;
  /** Another field (manual entry) has the focus: stop pulling it back. */
  paused?: boolean;
}) {
  const { t } = useTranslation();
  const ref = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const scheduleFocus = useHeldFocus(ref, !disabled && !paused);

  const submit = useCallback(
    (raw: string) => {
      setValue('');
      const code = raw.trim();
      if (code && !disabled) onScan(code);
      scheduleFocus();
    },
    [disabled, onScan, scheduleFocus],
  );
  const wedge = useWedgeBurst(submit);

  return (
    <View>
      <View
        className="flex-row items-center rounded-2xl border-2 bg-white px-4"
        style={{ minHeight: 64, borderColor: focused ? '#EC2828' : '#D1D5DB' }}
      >
        <Ionicons name="barcode-outline" size={26} color={focused ? '#EC2828' : '#6B7280'} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(next) => {
            if (!wedge.track(next)) setValue(next);
          }}
          onSubmitEditing={() => {
            wedge.cancel();
            submit(value);
          }}
          submitBehavior="submit"
          showSoftInputOnFocus={false}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            scheduleFocus();
          }}
          placeholder={t('Scan.handheldPlaceholder')}
          placeholderTextColor="#6B7280"
          accessibilityLabel={t('Scan.handheldA11y')}
          className="ml-3 flex-1 text-lg"
          style={{ minHeight: 60 }}
        />
      </View>
      <Typography variant="body-small-regular" className="mt-2 text-gray-600">
        {focused ? t('Scan.handheldReady') : t('Scan.handheldTapToFocus')}
      </Typography>
    </View>
  );
}

/**
 * An invisible wedge field for the result screens (web, and native in
 * handheld mode): the next code read by a hardware scanner closes the current
 * result and opens the new one, without a tap on "Scan another". It yields the
 * focus to any other text field (custom points, notes) and to dialogs.
 */
export function HiddenScannerInput({ onScan, disabled }: { onScan: (value: string) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  const ref = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const scheduleFocus = useHeldFocus(ref, !disabled);

  const submit = useCallback(
    (raw: string) => {
      setValue('');
      const code = raw.trim();
      if (code && !disabled) onScan(code);
      scheduleFocus();
    },
    [disabled, onScan, scheduleFocus],
  );
  const wedge = useWedgeBurst(submit);

  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={(next) => {
        if (!wedge.track(next)) setValue(next);
      }}
      onSubmitEditing={() => {
        wedge.cancel();
        submit(value);
      }}
      onKeyPress={(e) => {
        // Some scanners end a code with Tab instead of Enter.
        if (Platform.OS === 'web' && e.nativeEvent.key === 'Tab') {
          e.preventDefault();
          wedge.cancel();
          submit(value);
        }
      }}
      onBlur={scheduleFocus}
      submitBehavior="submit"
      showSoftInputOnFocus={false}
      caretHidden
      editable={!disabled}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      accessibilityLabel={t('Scan.handheldA11y')}
      style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0 }}
    />
  );
}
