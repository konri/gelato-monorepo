import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from '@/components/atoms/Modal';
import { Typography } from '@/components/atoms/Typography';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'ua', label: 'Українська' },
];

export const LanguageSelectorModal = ({ visible, onClose }: LanguageSelectorModalProps) => {
  const { t, i18n } = useTranslation();
  const current = i18n.language?.toLowerCase();

  const handleSelect = async (code: string) => {
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem('language', code.toUpperCase());
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} headerTitle={t('Settings.selectLanguage')}>
      <View className="w-full py-2">
        {LANGUAGES.map(({ code, label }) => {
          const selected = current === code;
          return (
            <Pressable
              key={code}
              onPress={() => handleSelect(code)}
              className="flex-row items-center justify-between py-4 px-2 border-b border-gray-100"
            >
              <Typography
                variant={selected ? 'body-base-bold' : 'body-base-regular'}
                className={selected ? 'text-red-500' : 'text-text-primary'}
              >
                {label}
              </Typography>
              {selected && <Ionicons name="checkmark" size={22} color="#EC2828" />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
};
