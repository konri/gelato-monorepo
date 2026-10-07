import { Typography } from '@/components/atoms/Typography';
import { onRequestError } from '@/shared/api-client/src/errorEvents';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info';

/** Optional button on the toast, e.g. "Show Gelato Roma". */
export type ToastAction = { label: string; onPress: () => void };

type ToastState = { id: number; type: ToastType; message: string; action?: ToastAction };

type ToastContextValue = {
  show: (message: string, type?: ToastType, options?: { action?: ToastAction }) => void;
  /**
   * Adds `action` to the toast on screen (e.g. the socket's "Show {brand}"
   * arriving after the push toast for the same credit) and keeps it up for
   * the action duration. False when no toast (of `type`, if given) is visible.
   */
  attachAction: (action: ToastAction, options?: { type?: ToastType }) => boolean;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { bg: string; text: string; icon: any }> = {
  // `text`: the action label on its white button (contrast ≥ 4.5:1).
  success: { bg: '#15803D', text: '#14532D', icon: 'checkmark-circle' },
  error: { bg: '#DC2626', text: '#991B1B', icon: 'alert-circle' },
  info: { bg: '#374151', text: '#111827', icon: 'information-circle' },
};

// Older users (BRANDS_SPEC §5.7): long enough to read 18px text…
const DURATION_MS = 5000;
// …and to find and press the action button (review #4: ≥ 10 s).
const ACTION_DURATION_MS = 12000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);
  const visibleRef = useRef<ToastState | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      visibleRef.current = null;
      setToast(null);
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = 'info', options?: { action?: ToastAction }) => {
      if (!message) return;
      const action = options?.action;
      const duration = action ? ACTION_DURATION_MS : DURATION_MS;
      // Same toast already on screen (duplicate FCM / listener re-fire): keep it
      // visible and only bump the hide timer. Resetting opacity to 0 is what
      // made the in-app banner look like it was blinking.
      const current = visibleRef.current;
      if (current && current.message === message && current.type === type) {
        if (action && !current.action) {
          const updated = { ...current, action };
          visibleRef.current = updated;
          setToast(updated);
        }
        if (hideTimer.current) clearTimeout(hideTimer.current);
        // Never shorten a toast that already offers an action.
        hideTimer.current = setTimeout(dismiss, current.action ? ACTION_DURATION_MS : duration);
        return;
      }
      idRef.current += 1;
      const next = { id: idRef.current, type, message, action };
      visibleRef.current = next;
      setToast(next);
      opacity.setValue(0);
      translateY.setValue(-16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(dismiss, duration);
    },
    [opacity, translateY, dismiss],
  );

  const attachAction = useCallback(
    (action: ToastAction, options?: { type?: ToastType }): boolean => {
      const current = visibleRef.current;
      if (!current || (options?.type && current.type !== options.type)) return false;
      if (!current.action) {
        const updated = { ...current, action };
        visibleRef.current = updated;
        setToast(updated);
      }
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(dismiss, ACTION_DURATION_MS);
      return true;
    },
    [dismiss],
  );

  // Global error toasts from the api-client choke point (backend down, etc.).
  useEffect(() => {
    const unsub = onRequestError(({ kind }) => {
      show(
        kind === 'network' ? t('Errors.networkError') : t('Errors.somethingWrong'),
        'error',
      );
    });
    return unsub;
  }, [show, t]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const success = useCallback((m: string) => show(m, 'success'), [show]);
  const error = useCallback((m: string) => show(m, 'error'), [show]);
  const value = useMemo<ToastContextValue>(
    () => ({ show, attachAction, success, error }),
    [show, attachAction, success, error],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            alignItems: 'center',
            opacity,
            transform: [{ translateY }],
            zIndex: 9999,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: STYLES[toast.type].bg,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            {/* Tap the text to close; the action is its own big button below
                it (older users: 18px text, 56dp target — review #4). */}
            <Pressable
              onPress={dismiss}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityLabel={toast.message}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name={STYLES[toast.type].icon} size={24} color="#fff" />
              <Typography
                variant="body-lg-semibold"
                className="ml-2 text-white"
                style={{ flexShrink: 1 }}
                maxFontSizeMultiplier={1.5}
              >
                {toast.message}
              </Typography>
            </Pressable>
            {toast.action ? (
              <Pressable
                onPress={() => {
                  const action = toast.action;
                  if (hideTimer.current) clearTimeout(hideTimer.current);
                  dismiss();
                  action?.onPress();
                }}
                accessibilityRole="button"
                accessibilityLabel={toast.action.label}
                style={{
                  marginTop: 12,
                  minHeight: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Typography
                  variant="body-lg-bold"
                  style={{ color: STYLES[toast.type].text, textAlign: 'center' }}
                  maxFontSizeMultiplier={1.5}
                >
                  {toast.action.label}
                </Typography>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op if used outside the provider (shouldn't happen).
    return { show: () => {}, attachAction: () => false, success: () => {}, error: () => {} };
  }
  return ctx;
}
