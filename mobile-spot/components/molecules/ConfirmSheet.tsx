import { Typography } from '@/components/atoms/Typography';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  title: string;
  /** The sentence that says exactly what will happen. */
  message?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** Red confirm button for actions that take something away (remove, sign out). */
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * One confirm step for counter and team actions (exchange points for a
 * reward, hand over a reward, remove a team member). A bottom sheet on
 * phones, a centered dialog on tablet / web. Works on web (unlike
 * Alert.alert).
 *
 * Cancel, the backdrop and the back button stay available while `busy`: a
 * stalled request must never lock the screen. The caller abandons the running
 * attempt in `onCancel` and ignores its late answer.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  destructive,
  busy,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const confirmColor = destructive ? '#B91C1C' : '#EC2828';

  const body = (
    <>
      <Typography variant="body-xl-bold" className="text-text-primary" accessibilityRole="header">
        {title}
      </Typography>
      {!!message && (
        <Typography variant="body-base-regular" className="mt-2 text-gray-700">
          {message}
        </Typography>
      )}
      {children}
      {!!error && (
        <View className="mt-3 rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
          <Typography variant="body-base-regular" style={{ color: '#B91C1C' }}>
            {error}
          </Typography>
        </View>
      )}
      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white"
          style={{ minHeight: 56 }}
        >
          <Typography variant="body-base-bold" className="text-gray-700">
            {cancelLabel}
          </Typography>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ busy: !!busy, disabled: !!busy }}
          className="flex-1 items-center justify-center rounded-xl"
          style={{ minHeight: 56, backgroundColor: busy ? '#F4A3A3' : confirmColor }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="body-base-bold" className="text-white">
              {confirmLabel}
            </Typography>
          )}
        </Pressable>
      </View>
    </>
  );

  if (isWide) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 p-6" onPress={onCancel}>
          <Pressable
            className="w-full rounded-3xl bg-white p-6"
            style={{ maxWidth: 480 }}
            onPress={(e) => e.stopPropagation()}
          >
            {body}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onCancel} accessibilityLabel={cancelLabel} />
        <View className="rounded-t-3xl bg-white px-5 pt-5" style={{ paddingBottom: insets.bottom + 16 }}>
          {body}
        </View>
      </View>
    </Modal>
  );
}
