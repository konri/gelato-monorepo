import { Typography } from '@/components/atoms/Typography';
import {
  applyToSpot,
  useCities,
  useMyCourierApplications,
  useSpotsByCity,
} from '@/hooks/useCourierApplications';
import { City, Spot } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ApplySpotScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: cities, loading: citiesLoading } = useCities();
  const [cityId, setCityId] = useState<string | null>(null);
  const { data: spots, loading: spotsLoading } = useSpotsByCity(cityId);
  const { data: applications, refetch: refetchApplications } =
    useMyCourierApplications();

  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Spot ids the courier has already applied to (any status).
  const appliedSpotIds = useMemo(
    () => new Set((applications ?? []).map((a) => a.spotId)),
    [applications],
  );

  const localizedCity = (c: City) => {
    const nl = typeof c.nameLocal === 'object' && c.nameLocal ? c.nameLocal : null;
    const lang = i18n.language.split('-')[0] as 'pl' | 'en' | 'ua';
    return (nl && (nl[lang] || nl.en)) || c.name;
  };

  const handleApply = async (spot: Spot) => {
    setApplyingId(spot.id);
    try {
      const res = await applyToSpot(spot.id);
      if (res.error) {
        Alert.alert(t('Courier.applyErrorTitle'), res.error.message);
        return;
      }
      await refetchApplications();
      Alert.alert(t('Courier.applySuccessTitle'), t('Courier.applySuccessBody'));
    } catch (e) {
      Alert.alert(
        t('Courier.applyErrorTitle'),
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setApplyingId(null);
    }
  };

  const selectedCity = cities?.find((c) => c.id === cityId) ?? null;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <Pressable onPress={() => router.back()} className="p-1 mr-2">
          <Ionicons name="chevron-back" size={26} color="#212121" />
        </Pressable>
        <Typography variant="body-lg-bold" className="text-text-primary">
          {t('Courier.applyTitle')}
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Step 1: city */}
        {!selectedCity ? (
          <>
            <Typography variant="body-lg-bold" className="text-text-primary mb-3">
              {t('Courier.selectCity')}
            </Typography>
            {citiesLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator color="#EC2828" />
              </View>
            ) : (cities ?? []).length === 0 ? (
              <Typography variant="body-base-regular" className="text-gray-500">
                {t('Courier.noCities')}
              </Typography>
            ) : (
              <View className="gap-3">
                {cities!.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setCityId(c.id)}
                    className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="location-outline" size={20} color="#EC2828" />
                      <Typography
                        variant="body-base-semibold"
                        className="text-text-primary ml-3"
                      >
                        {localizedCity(c)}
                      </Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Selected city + change */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="location" size={18} color="#EC2828" />
                <Typography
                  variant="body-base-semibold"
                  className="text-text-primary ml-2"
                >
                  {localizedCity(selectedCity)}
                </Typography>
              </View>
              <Pressable onPress={() => setCityId(null)}>
                <Typography variant="body-small-semibold" className="text-primary">
                  {t('Courier.changeCity')}
                </Typography>
              </Pressable>
            </View>

            {/* Step 2: spot */}
            <Typography variant="body-lg-bold" className="text-text-primary mb-3">
              {t('Courier.selectSpot')}
            </Typography>
            {spotsLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator color="#EC2828" />
              </View>
            ) : (spots ?? []).length === 0 ? (
              <Typography variant="body-base-regular" className="text-gray-500">
                {t('Courier.noSpots')}
              </Typography>
            ) : (
              <View className="gap-3">
                {spots!.map((spot) => {
                  const applied = appliedSpotIds.has(spot.id);
                  const isApplying = applyingId === spot.id;
                  return (
                    <View
                      key={spot.id}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <Typography
                        variant="body-base-semibold"
                        className="text-text-primary"
                      >
                        {spot.name}
                      </Typography>
                      <Typography
                        variant="body-small-regular"
                        className="text-gray-500 mt-0.5"
                      >
                        {spot.address}
                      </Typography>
                      <Pressable
                        disabled={applied || isApplying}
                        onPress={() => handleApply(spot)}
                        className="mt-3 rounded-xl py-3 items-center"
                        style={{
                          backgroundColor: applied ? '#E5E7EB' : '#EC2828',
                        }}
                      >
                        {isApplying ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Typography
                            variant="body-base-semibold"
                            style={{ color: applied ? '#6B7280' : '#FFFFFF' }}
                          >
                            {applied
                              ? t('Courier.alreadyApplied')
                              : t('Courier.apply')}
                          </Typography>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
