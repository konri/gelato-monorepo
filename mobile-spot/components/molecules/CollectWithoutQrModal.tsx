import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';

type Props = {
  visible: boolean;
  orderNumber: string;
  customerName?: string | null;
  // Amount to take at the counter (pay-at-spot orders), null if already paid.
  amountDue?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

// Manual hand-over of a pickup order when the customer can't show their QR
// (e.g. no phone). Staff must confirm the customer's identity before it
// unlocks. Works on web (unlike Alert.alert).
export function CollectWithoutQrModal({
  visible,
  orderNumber,
  customerName,
  amountDue,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setAgreed(false);
    setBusy(false);
    setError(null);
  }, [visible]);

  const submit = async () => {
    if (!agreed) return;
    setError(null);
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('Scan.collectError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/70 px-4" onPress={busy ? undefined : onClose}>
        <Pressable className="w-full max-w-lg rounded-2xl bg-white" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {t('CollectManual.title')}
            </Typography>
            <Pressable onPress={onClose} hitSlop={8} disabled={busy}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="flex-row rounded-xl bg-amber-50 p-3">
              <Ionicons name="warning" size={20} color="#B45309" style={{ marginTop: 1 }} />
              <Typography variant="body-small-regular" className="ml-2 flex-1" style={{ color: '#92400E' }}>
                {t('CollectManual.warning', { number: orderNumber })}
              </Typography>
            </View>

            <View className="mt-4 rounded-xl border border-gray-200 p-3">
              <Typography variant="body-very-small-medium" className="text-gray-500">
                {t('CollectManual.customer')}
              </Typography>
              <Typography variant="body-lg-bold" className="text-text-primary">
                {customerName || '—'}
              </Typography>
            </View>

            {!!amountDue && (
              <View className="mt-3 rounded-xl border border-gray-200 p-3">
                <Typography variant="body-very-small-medium" className="text-gray-500">
                  {t('CollectManual.amountDue')}
                </Typography>
                <Typography variant="body-lg-bold" style={{ color: '#EC2828' }}>
                  {amountDue}
                </Typography>
              </View>
            )}

            <Pressable
              onPress={() => setAgreed((v) => !v)}
              disabled={busy}
              className="mt-4 flex-row items-start"
            >
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreed ? '#EC2828' : '#9CA3AF'}
              />
              <Typography variant="body-small-regular" className="ml-2 flex-1 text-text-primary">
                {t('CollectManual.agree')}
              </Typography>
            </Pressable>

            {!!error && (
              <Typography variant="body-small-regular" className="mt-3" style={{ color: '#DC2626' }}>
                {error}
              </Typography>
            )}

            <View className="mt-5 gap-2">
              <Pressable
                onPress={() => void submit()}
                disabled={!agreed || busy}
                className="items-center rounded-xl py-3"
                style={{ backgroundColor: !agreed || busy ? '#F4A3A3' : '#EC2828' }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Typography variant="body-base-bold" className="text-white">
                    {t('CollectManual.confirm')}
                  </Typography>
                )}
              </Pressable>
              <Pressable
                onPress={onClose}
                disabled={busy}
                className="items-center rounded-xl border border-gray-200 py-3"
              >
                <Typography variant="body-base-semibold" className="text-gray-700">
                  {t('CollectManual.back')}
                </Typography>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
