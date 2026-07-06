import { useMyPrizes } from '@/hooks/usePrizes';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fmt = (d: string) => new Date(d).toLocaleDateString();

// Shows the QR code for a claimed prize to present at the spot.
export default function MyPrizeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: myPrizes, loading } = useMyPrizes();

  const userPrize = useMemo(
    () => (myPrizes ?? []).find((p) => p.id === id) ?? null,
    [myPrizes, id],
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }
  if (!userPrize) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <Ionicons name="arrow-back" size={24} color="#212121" onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, left: 16 }} />
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3">
        <Ionicons name="arrow-back" size={24} color="#212121" onPress={() => router.back()} />
        <Text className="text-lg font-urbanist-bold text-text-primary ml-3 flex-1" numberOfLines={1}>
          {userPrize.prize.title}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-white rounded-3xl p-6 border-2 border-accent items-center">
          <QRCodeSVG value={userPrize.qrCode} size={240} color="#000000" backgroundColor="#FFFFFF" />
        </View>
        <Text className="font-urbanist-bold text-text-primary text-lg mt-6 text-center">
          {userPrize.prize.title}
        </Text>
        <Text className="font-urbanist text-text-secondary mt-2 text-center">
          {t('Prizes.showAtSpot')}
        </Text>
        <Text className="font-urbanist text-text-tertiary text-xs mt-4">
          {t('Prizes.validUntil', { date: fmt(userPrize.validUntil) })}
        </Text>
      </View>
    </View>
  );
}
