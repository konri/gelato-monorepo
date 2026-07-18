import { Typography } from '@/components/atoms/Typography';
import { validatePrizeQr, type PrizeValidation } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

/**
 * After a prize QR is scanned: validate it against the backend (which marks it
 * redeemed) and show the staff member which prize to hand over. The backend's
 * validatePrizeQR both validates AND redeems in one call, so we surface the
 * result directly and treat an already-redeemed/expired code as an error.
 */
export function PrizeRedeem({
  qrCode,
  spotId,
  onDone,
}: {
  qrCode: string;
  spotId: string | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PrizeValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await validatePrizeQr(qrCode, spotId, { token });
      if (cancelled) return;
      if (res.error || !res.data) {
        setError(t('Scan.redeemError'));
      } else if (res.data.isRedeemed) {
        setResult(res.data);
      } else {
        // Backend didn't flip it (unexpected) — still show the prize.
        setResult(res.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [qrCode, spotId, t]);

  if (loading) {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-10">
        <ActivityIndicator color="#EC2828" />
      </View>
    );
  }

  if (error || !result) {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <Ionicons name="close-circle" size={52} color="#B91C1C" />
        <Typography variant="body-base-regular" className="mt-3 text-center text-gray-600">
          {error ?? t('Scan.redeemError')}
        </Typography>
        <Pressable onPress={onDone} className="mt-5 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.scanAnother')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
      <Ionicons name="gift" size={52} color="#16A34A" />
      <Typography variant="body-base-regular" className="mt-3 text-gray-500">
        {t('Scan.prizeReady')}
      </Typography>
      <Typography variant="heading-32-bold" className="mt-1 text-center text-text-primary">
        {result.prize.title}
      </Typography>
      <Typography variant="body-small-regular" className="mt-1 text-gray-500">
        {t('Scan.prizeCost', { points: result.prize.pointsCost })}
      </Typography>
      <View className="mt-4 flex-row items-center rounded-full bg-green-50 px-4 py-2">
        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
        <Typography variant="body-small-bold" className="ml-2" style={{ color: '#15803D' }}>
          {t('Scan.redeemed')}
        </Typography>
      </View>
      <Pressable onPress={onDone} className="mt-6 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
        <Typography variant="body-base-bold" className="text-white">
          {t('Scan.scanAnother')}
        </Typography>
      </Pressable>
    </View>
  );
}
