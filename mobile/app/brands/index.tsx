import { BrandDiscoveryList } from '@/components/molecules/Brands/BrandDiscoveryList';
import { BackHeader, COLORS, EmptyState, LText, SecondaryButton } from '@/components/molecules/Loyalty/ui';
import { HowToEarnCard } from '@/components/molecules/Rewards/HowToEarnCard';
import { PausedWallets } from '@/components/molecules/Rewards/PausedWallets';
import { CitySelectorModal } from '@/components/molecules/Settings/CitySelectorModal';
import { useBrands } from '@/hooks/useBrands';
import { localizedCityName } from '@/utils/cityMatch';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Where points can be collected (BRANDS_SPEC §5.5): the user's brands first,
 * then every brand of the city. Opened from Rewards ("see where else") and My
 * card in the discovery modes.
 */
export default function BrandsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { wallets, paused, city, cityId, status, refresh } = useBrands();
  const [refreshing, setRefreshing] = useState(false);
  const [cityModal, setCityModal] = useState(false);
  const cityName = city ? localizedCityName(city, i18n.language) : '';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh({ maxAgeMs: 0 });
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const yours = wallets.filter((w) => w.hasWallet && !w.paused);

  return (
    <View className="flex-1 bg-gray-50">
      <BackHeader title={t('Brand.listTitle')} topInset={insets.top} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
      >
        {cityName ? (
          <LText size={18} color={COLORS.secondary} className="mx-4 mt-3">
            {t('Brand.listSubtitle', { city: cityName })}
          </LText>
        ) : null}

        {status === 'loading' && wallets.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : !cityId && yours.length === 0 ? (
          <EmptyState
            icon="location-outline"
            title={t('Prizes.chooseCityTitle')}
            body={t('Prizes.chooseCityBody')}
            action={{ label: t('Loyalty.chooseCity'), onPress: () => setCityModal(true) }}
          />
        ) : (
          <BrandDiscoveryList
            cityId={cityId}
            cityName={cityName}
            yours={yours}
            cityFallback={wallets.filter((w) => w.inMyCity)}
          />
        )}

        <PausedWallets wallets={paused} />
        <HowToEarnCard />

        <View className="mx-4 mt-6">
          <SecondaryButton
            label={cityName ? t('Prizes.changeCityFrom', { city: cityName }) : t('Loyalty.chooseCity')}
            icon="location-outline"
            onPress={() => setCityModal(true)}
          />
        </View>
      </ScrollView>

      {cityModal ? (
        <CitySelectorModal
          visible
          currentCity={cityName || undefined}
          onClose={() => setCityModal(false)}
          onSelected={() => setCityModal(false)}
        />
      ) : null}
    </View>
  );
}
