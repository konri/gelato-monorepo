import { Image } from '@/components/atoms/Image';
import type { UserPrize } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fmt = (d: string) => new Date(d).toLocaleDateString();

// Modal listing the user's already-redeemed (used) prizes.
export const PrizeHistoryModal = ({
  visible,
  onClose,
  prizes,
}: {
  visible: boolean;
  onClose: () => void;
  prizes: UserPrize[];
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const history = prizes.filter((p) => p.isRedeemed);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%', paddingBottom: insets.bottom + 12 }}>
          <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
              {t('Prizes.historyTitle')}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#212121" />
            </Pressable>
          </View>

          {history.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-5xl mb-3">🎟️</Text>
              <Text className="font-urbanist text-text-secondary">{t('Prizes.noHistory')}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {history.map((up) => (
                <View
                  key={up.id}
                  className="flex-row items-center bg-white rounded-2xl border border-gray-200 overflow-hidden mb-3"
                >
                  <Image
                    url={up.prize.imageUrl ?? undefined}
                    className="w-16 h-16"
                    resizeMode="cover"
                    fallbackWidth={64}
                    fallbackHeight={64}
                    fallbackLogoSize={22}
                  />
                  <View className="flex-1 px-3 py-2">
                    <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
                      {up.prize.title}
                    </Text>
                    <Text className="text-xs font-urbanist text-text-tertiary mt-0.5">
                      {up.redeemedAt
                        ? t('Prizes.redeemedOn', { date: fmt(up.redeemedAt) })
                        : t('Prizes.used')}
                    </Text>
                  </View>
                  <View className="bg-gray-100 rounded-full px-3 py-1 mr-3">
                    <Text className="text-xs font-urbanist-bold text-gray-600">{t('Prizes.used')}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
