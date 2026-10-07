import { BrandLogo } from '@/components/atoms/BrandLogo';
import { Image } from '@/components/atoms/Image';
import { Badge, COLORS, LText } from '@/components/molecules/Loyalty/ui';
import type { UserPrize } from '@repo/api-client';
import { localizedText } from '@/utils/localizedText';
import { formatShortDate } from '@/utils/promotionFormat';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOverlayOpen } from '@/hooks/useOverlayOpen';

/** Rewards that were picked up or expired, every brand, newest first. */
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
  const { t, i18n } = useTranslation();
  useOverlayOpen(visible);
  const history = prizes.filter((p) => p.isRedeemed || p.isExpired || !p.isRedeemableNow);

  const open = (id: string) => {
    onClose();
    router.push(`/prize/mine/${id}` as never);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {!visible ? null : (
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <Pressable
            className="flex-1"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('Loyalty.close')}
          />
          <View
            className="rounded-t-3xl bg-white"
            style={{ maxHeight: '85%', paddingBottom: insets.bottom + 12 }}
            accessibilityViewIsModal
          >
            <View className="flex-row items-center border-b border-gray-100 px-5 pb-3 pt-4">
              <LText size={24} weight="700" className="flex-1" accessibilityRole="header" max={1.4}>
                {t('Prizes.historyTitle')}
              </LText>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('Loyalty.close')}
                className="flex-row items-center rounded-full bg-gray-100 px-3 active:opacity-80"
                style={{ minHeight: 48 }}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
                <LText size={17} weight="700" className="ml-1" max={1.3}>
                  {t('Loyalty.close')}
                </LText>
              </Pressable>
            </View>

            {history.length === 0 ? (
              <View className="items-center px-6 py-14">
                <Ionicons name="receipt-outline" size={48} color={COLORS.secondary} />
                <LText size={18} color={COLORS.secondary} className="mt-3 text-center">
                  {t('Prizes.noHistory')}
                </LText>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                {history.map((up) => {
                  const title = localizedText(up.prize.titleLocal, i18n.language) || up.prize.title;
                  const status = up.isRedeemed
                    ? up.redeemedAt
                      ? t('Prizes.redeemedOn', { date: formatShortDate(up.redeemedAt, i18n.language) })
                      : t('Prizes.used')
                    : up.isExpired
                      ? t('Prizes.expired')
                      : t('Prizes.notUsableNow');
                  return (
                    <Pressable
                      key={up.id}
                      onPress={() => open(up.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${title}. ${up.brand.name}. ${status}`}
                      className="mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3 active:opacity-80"
                      style={{ minHeight: 72 }}
                    >
                      <Image
                        url={up.prize.imageUrl ?? undefined}
                        resizeMode="cover"
                        style={{ width: 56, height: 56, borderRadius: 12 }}
                        fallbackWidth={56}
                        fallbackHeight={56}
                        fallbackLogoSize={22}
                      />
                      <View className="ml-3 flex-1">
                        <LText size={18} weight="700" numberOfLines={2}>
                          {title}
                        </LText>
                        <View className="mt-0.5 flex-row items-center">
                          <BrandLogo brand={up.brand} size={20} />
                          <LText size={16} color={COLORS.secondary} className="ml-1.5 flex-1" numberOfLines={1}>
                            {up.brand.name}
                          </LText>
                        </View>
                        <View className="mt-1">
                          <Badge
                            tone="grey"
                            icon={up.isRedeemed ? 'checkmark-done' : 'time-outline'}
                            text={status}
                          />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
};
