import { Typography } from '@/components/atoms/Typography';
import { onRequestError } from '@/shared/api-client/src/errorEvents';
import { errorCodeMessage } from '@/utils/errorCodes';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  /** Tapping the toast runs this (then dismisses), e.g. open another spot's order. */
  onPress?: () => void;
};

type ToastState = { id: number; type: ToastType; message: string; onPress?: () => void };

type ToastContextValue = {
  show: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { bg: string; icon: any }> = {
  success: { bg: '#16A34A', icon: 'checkmark-circle' },
  error: { bg: '#DC2626', icon: 'alert-circle' },
  info: { bg: '#374151', icon: 'information-circle' },
};

const DURATION_MS = 3200;
const ACTION_DURATION_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      if (!message) return;
      idRef.current += 1;
      setToast({ id: idRef.current, type, message, onPress: options?.onPress });
      opacity.setValue(0);
      translateY.setValue(-16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      // A toast with an action stays a little longer so it can be tapped.
      hideTimer.current = setTimeout(dismiss, options?.onPress ? ACTION_DURATION_MS : DURATION_MS);
    },
    [opacity, translateY, dismiss],
  );

  // Global error toasts from the api-client choke point (backend down, etc.).
  // A server error code maps to `Errors.codes.*` (SCOPE_FORBIDDEN keeps the
  // server's own localized text); anything else gets the generic text.
  useEffect(() => {
    const unsub = onRequestError(({ kind, message, code }) => {
      const byCode = errorCodeMessage(code, message);
      show(
        byCode ?? (kind === 'network' ? t('Errors.networkError') : t('Errors.somethingWrong')),
        'error',
      );
    });
    return unsub;
  }, [show, t]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  };

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
            alignItems: 'center',
            opacity,
            transform: [{ translateY }],
            zIndex: 9999,
          }}
        >
          <Pressable
            onPress={() => {
              const action = toast.onPress;
              dismiss();
              action?.();
            }}
            accessibilityRole={toast.onPress ? 'button' : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: STYLES[toast.type].bg,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 14,
              maxWidth: 480,
              marginHorizontal: 16,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <Ionicons name={STYLES[toast.type].icon} size={20} color="#fff" />
            <Typography variant="body-small-semibold" className="ml-2 text-white" style={{ flexShrink: 1 }}>
              {toast.message}
            </Typography>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op if used outside the provider (shouldn't happen).
    return { show: () => {}, success: () => {}, error: () => {} };
  }
  return ctx;
}
