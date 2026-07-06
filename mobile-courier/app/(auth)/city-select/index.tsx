import { Button } from '@/components/atoms/Button';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { useCities } from '@/hooks/useTastes';
import { getLocation } from '@/services/locationService';
import { updatePreferredCity } from '@repo/api-client';
import type { City } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

export default function CitySelectScreen() {
  const { t, i18n } = useTranslation();
  const { data: cities, loading } = useCities();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detectedId, setDetectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const localized = (c: City) => {
    const nl = typeof c.nameLocal === 'object' && c.nameLocal ? c.nameLocal : null;
    const lang = i18n.language.split('-')[0] as 'pl' | 'en' | 'ua';
    return (nl && (nl[lang] || nl.en)) || c.name;
  };

  // Propose the nearest city from the device location (default selection).
  useEffect(() => {
    let active = true;
    (async () => {
      if (!cities || cities.length === 0) return;
      const loc = await getLocation();
      if (!active || !loc) return;
      const withCoords = cities.filter((c) => c.latitude != null && c.longitude != null);
      if (!withCoords.length) return;
      const nearest = withCoords.reduce((best, c) =>
        haversineKm(loc.latitude, loc.longitude, c.latitude!, c.longitude!) <
        haversineKm(loc.latitude, loc.longitude, best.latitude!, best.longitude!)
          ? c
          : best,
      );
      setDetectedId(nearest.id);
      setSelectedId((prev) => prev ?? nearest.id);
    })();
    return () => {
      active = false;
    };
  }, [cities]);

  const selectedCity = useMemo(
    () => cities?.find((c) => c.id === selectedId) ?? null,
    [cities, selectedId],
  );

  const handleConfirm = async () => {
    if (!selectedCity) return;
    setSaving(true);
    try {
      const name = localized(selectedCity);
      await AsyncStorage.setItem('selectedCity', name);
      // Persist to the backend profile too (best-effort).
      const token = await safeGetItem('access_token');
      await updatePreferredCity({ city: name, token: token ?? undefined }).catch(() => {});
    } finally {
      setSaving(false);
      router.push('/(auth)/notifications');
    }
  };

  return (
    <View className="flex-1 px-6 py-2">
      <View className="gap-6 flex-1">
        <AuthHeader title={t('CitySelect.title')} subtitle={t('CitySelect.subtitle')} />

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#EC2828" />
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {(cities ?? []).map((city) => {
              const selected = city.id === selectedId;
              const detected = city.id === detectedId;
              return (
                <Pressable
                  key={city.id}
                  onPress={() => setSelectedId(city.id)}
                  className={`flex-row items-center justify-between rounded-2xl px-4 py-4 mb-3 border ${
                    selected ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="location" size={20} color={selected ? '#EC2828' : '#9E9E9E'} />
                    <Text
                      className={`ml-3 font-urbanist-semibold ${selected ? 'text-accent' : 'text-text-primary'}`}
                    >
                      {localized(city)}
                    </Text>
                    {detected ? (
                      <View className="ml-2 bg-green-50 rounded-full px-2 py-0.5">
                        <Text className="text-[10px] font-urbanist-bold text-green-700">
                          {t('CitySelect.nearYou')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={22} color="#EC2828" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View className="items-center py-4">
        <Button
          title={saving ? t('Common.loading') : t('CitySelect.confirm')}
          onPress={handleConfirm}
          variant="primary"
          disabled={saving || !selectedCity}
          width="100%"
        />
      </View>
    </View>
  );
}
