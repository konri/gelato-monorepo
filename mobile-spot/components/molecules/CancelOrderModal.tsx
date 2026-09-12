import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

export const APOLOGY_POINT_OPTIONS = [100, 200, 500] as const;
export type ApologyPoints = (typeof APOLOGY_POINT_OPTIONS)[number];

type Props = {
  visible: boolean;
  orderNumber?: string | null;
  onClose: () => void;
  onConfirm: (reason: string, points: ApologyPoints) => Promise<void>;
};

// Reason + apology-points form used from the order card and the order detail
// screen. Works on web (unlike Alert.alert).
export function CancelOrderModal({ visible, orderNumber, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [points, setPoints] = useState<ApologyPoints | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason('');
    setPoints(null);
    setError(null);
    setBusy(false);
  }, [visible]);

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('CancelOrder.reasonRequired'));
      return;
    }
    if (!points) {
      setError(t('CancelOrder.pointsRequired'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onConfirm(trimmed, points);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('OrderTrack.terminateFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1 items-center justify-center bg-black/70 px-4" onPress={onClose}>
          <Pressable
            className="w-full max-w-lg rounded-2xl bg-white"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
              <Typography variant="body-lg-bold" className="text-text-primary">
                {t('CancelOrder.title')}
              </Typography>
              <Pressable onPress={onClose} hitSlop={8} disabled={busy}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16 }}
            >
              <Typography variant="body-small-regular" className="text-gray-600">
                {orderNumber
                  ? t('CancelOrder.bodyNamed', { number: orderNumber })
                  : t('CancelOrder.body')}
              </Typography>

              <Typography variant="body-small-semibold" className="mt-4 text-text-primary">
                {t('CancelOrder.reasonLabel')}
              </Typography>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={t('CancelOrder.reasonPlaceholder')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!busy}
                className="mt-1.5 min-h-[96px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-text-primary"
              />

              <Typography variant="body-small-semibold" className="mt-4 text-text-primary">
                {t('CancelOrder.pointsLabel')}
              </Typography>
              <Typography variant="body-very-small-regular" className="mt-0.5 text-gray-500">
                {t('CancelOrder.pointsHint')}
              </Typography>
              <View className="mt-2 flex-row gap-2">
                {APOLOGY_POINT_OPTIONS.map((n) => {
                  const selected = points === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setPoints(n)}
                      disabled={busy}
                      className="flex-1 items-center rounded-xl border py-2.5"
                      style={{
                        borderColor: selected ? '#EC2828' : '#E5E7EB',
                        backgroundColor: selected ? '#FEECEC' : '#fff',
                      }}
                    >
                      <Typography
                        variant="body-base-bold"
                        style={{ color: selected ? '#EC2828' : '#374151' }}
                      >
                        {n}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>

              {!!error && (
                <Typography variant="body-small-regular" className="mt-3" style={{ color: '#DC2626' }}>
                  {error}
                </Typography>
              )}

              <View className="mt-5 gap-2">
                <Pressable
                  onPress={() => void submit()}
                  disabled={busy}
                  className="items-center rounded-xl py-3"
                  style={{ backgroundColor: busy ? '#F4A3A3' : '#DC2626' }}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Typography variant="body-base-bold" className="text-white">
                      {t('CancelOrder.confirm')}
                    </Typography>
                  )}
                </Pressable>
                <Pressable
                  onPress={onClose}
                  disabled={busy}
                  className="items-center rounded-xl border border-gray-200 py-3"
                >
                  <Typography variant="body-base-semibold" className="text-gray-700">
                    {t('CancelOrder.keep')}
                  </Typography>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
