import { Image } from '@/components/atoms/Image';
import { PrizeHistoryModal } from '@/components/prizes/PrizeHistoryModal';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { usePointBalance } from '@/hooks/usePointBalance';
import { useMyPrizes, usePrizes } from '@/hooks/usePrizes';
import type { Prize, UserPrize } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fmt = (d: string) => new Date(d).toLocaleDateString();

export default function PrizesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { data: balance, refetch: refetchBalance } = usePointBalance();
  const { data: prizes, loading: prizesLoading, refetch: refetchPrizes } = usePrizes();
  const { data: myPrizes, refetch: refetchMine } = useMyPrizes();

  const [refreshing, setRefreshing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const points = balance?.availablePoints ?? 0;
  const activePrizes = (myPrizes ?? []).filter((p) => !p.isRedeemed);
  const hasHistory = (myPrizes ?? []).some((p) => p.isRedeemed);

  // Refresh when returning from the detail screen (points/prizes may have changed).
  useFocusEffect(
    useCallback(() => {
      refetchBalance();
      refetchMine();
    }, [refetchBalance, refetchMine]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchBalance(), refetchPrizes(), refetchMine()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchBalance, refetchPrizes, refetchMine]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header with points */}
      <View className="px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-urbanist-bold text-text-primary">{t('Prizes.title')}</Text>
        <View className="flex-row items-center mt-3 bg-accent rounded-2xl px-4 py-3">
          <Ionicons name="star" size={22} color="white" />
          <View className="ml-3">
            <Text className="text-white/80 text-xs font-urbanist">{t('Prizes.yourPoints')}</Text>
            <Text className="text-white text-2xl font-urbanist-bold">
              {t('Prizes.points', { count: points })}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        {/* My prizes */}
        <View className="px-6 pt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-urbanist-bold text-text-primary text-base">
              {t('Prizes.myPrizesTitle')}
            </Text>
            {hasHistory ? (
              <Pressable onPress={() => setHistoryOpen(true)} hitSlop={8} className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color="#EC2828" />
                <Text className="ml-1 font-urbanist-semibold text-accent text-sm">
                  {t('Prizes.history')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {activePrizes.length === 0 ? (
            <View className="bg-background-secondary rounded-2xl p-6 items-center">
              <Text className="text-4xl mb-2">🍦</Text>
              <Text className="font-urbanist-bold text-text-primary text-center">
                {t('Prizes.noActivePrizes')}
              </Text>
              <Text className="font-urbanist text-text-secondary text-center mt-1">
                {t('Prizes.noActivePrizesHint')}
              </Text>
            </View>
          ) : (
            activePrizes.map((up) => <ActivePrizeCard key={up.id} userPrize={up} />)
          )}
        </View>

        {/* Available prizes */}
        <View className="px-6 pt-6">
          <Text className="font-urbanist-bold text-text-primary text-base mb-3">
            {t('Prizes.availableTitle')}
          </Text>
          {prizesLoading && !prizes ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : (prizes ?? []).length === 0 ? (
            <Text className="font-urbanist text-text-secondary">{t('Prizes.noneAvailable')}</Text>
          ) : (
            <View className="flex-row flex-wrap -mx-2">
              {(prizes ?? []).map((prize) => (
                <PrizeCard key={prize.id} prize={prize} points={points} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <PrizeHistoryModal
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        prizes={myPrizes ?? []}
      />
    </View>
  );
}

/* ---------- Available prize card (2-col grid) ---------- */

const PrizeCard = ({ prize, points }: { prize: Prize; points: number }) => {
  const { t } = useTranslation();
  const affordable = points >= prize.pointsCost;
  const outOfStock = prize.quantity != null && prize.claimed >= prize.quantity;

  return (
    <View className="w-1/2 px-2 mb-4">
      <Pressable
        className="bg-white rounded-2xl overflow-hidden border border-gray-200"
        onPress={() => router.push(`/prize/${prize.id}`)}
      >
        <Image url={prize.imageUrl ?? undefined} className="w-full h-28" resizeMode="cover" fallbackLogoSize={36} />
        <View className="p-3">
          <Text className="text-sm font-urbanist-bold text-text-primary" numberOfLines={2}>
            {prize.title}
          </Text>
          <View className="flex-row items-center justify-between mt-2">
            <View className={`rounded-full px-2.5 py-1 ${affordable ? 'bg-accent/10' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-urbanist-bold ${affordable ? 'text-accent' : 'text-text-tertiary'}`}>
                {t('Prizes.cost', { count: prize.pointsCost })}
              </Text>
            </View>
            {outOfStock ? (
              <Text className="text-[10px] font-urbanist text-text-tertiary">{t('Prizes.outOfStock')}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
};

/* ---------- Active (claimed) prize card ---------- */

const ActivePrizeCard = ({ userPrize }: { userPrize: UserPrize }) => {
  const { t } = useTranslation();
  return (
    <Pressable
      className="flex-row items-center bg-white rounded-2xl border border-accent/30 overflow-hidden mb-3"
      onPress={() => router.push(`/prize/mine/${userPrize.id}`)}
    >
      <Image
        url={userPrize.prize.imageUrl ?? undefined}
        className="w-16 h-16"
        resizeMode="cover"
        fallbackWidth={64}
        fallbackHeight={64}
        fallbackLogoSize={22}
      />
      <View className="flex-1 px-3 py-2">
        <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
          {userPrize.prize.title}
        </Text>
        <Text className="text-xs font-urbanist text-text-secondary mt-0.5">
          {t('Prizes.validUntil', { date: fmt(userPrize.validUntil) })}
        </Text>
      </View>
      <View className="bg-green-50 rounded-full px-3 py-1 mr-3">
        <Text className="text-xs font-urbanist-bold text-green-700">{t('Prizes.active')}</Text>
      </View>
    </Pressable>
  );
};
