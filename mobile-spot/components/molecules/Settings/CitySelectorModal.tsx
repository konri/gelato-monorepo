import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from '@/components/atoms/Modal';
import { Typography } from '@/components/atoms/Typography';
import { AVAILABLE_CITIES } from '@/constants/cities';
import { updatePreferredCity } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';

interface CitySelectorModalProps {
  visible: boolean;
  currentCity?: string;
  onClose: () => void;
  onSelected: (city: string) => void;
}

export const CitySelectorModal = ({
  visible,
  currentCity,
  onClose,
  onSelected,
}: CitySelectorModalProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState<string | null>(null);

  const handleSelect = async (city: string) => {
    setSaving(city);
    try {
      const token = await safeGetItem('access_token');
      const result = await updatePreferredCity({ city, token: token ?? undefined });
      if (!result.success) {
        throw new Error(result.error?.message || t('Common.saveDataFailed'));
      }
      await AsyncStorage.setItem('selectedCity', city);
      onSelected(city);
      onClose();
    } catch (error) {
      const err = error as { message?: string };
      Alert.alert(t('Common.error'), err?.message || t('Common.saveDataFailed'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} headerTitle={t('Settings.selectCity')}>
      <View className="w-full py-2">
        {AVAILABLE_CITIES.map((city) => {
          const selected = currentCity === city;
          return (
            <Pressable
              key={city}
              onPress={() => handleSelect(city)}
              disabled={saving !== null}
              className="flex-row items-center justify-between py-4 px-2 border-b border-gray-100"
            >
              <Typography
                variant={selected ? 'body-base-bold' : 'body-base-regular'}
                className={selected ? 'text-red-500' : 'text-text-primary'}
              >
                {city}
              </Typography>
              {selected && <Ionicons name="checkmark" size={22} color="#EC2828" />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
};
