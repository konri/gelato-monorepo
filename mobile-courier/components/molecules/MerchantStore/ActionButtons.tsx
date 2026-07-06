import { Button } from '@/components/atoms/Button';
import { config } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

interface ActionButtonsProps {
  isFavorite: boolean;
  favoriteIconUrl?: string;
  isTogglingFavorite: boolean;
  onToggleFavorite: () => void;
  onBuyVoucher: () => void;
}

export const ActionButtons = ({
  isFavorite,
  favoriteIconUrl,
  isTogglingFavorite,
  onToggleFavorite,
  onBuyVoucher,
}: ActionButtonsProps) => {
  const { t } = useTranslation();

  const favoriteIcon = favoriteIconUrl ? (
    <Image
      source={{ uri: `${config.API_URL}${favoriteIconUrl}` }}
      style={{ width: 18, height: 18, opacity: isFavorite ? 1 : 0.4 }}
    />
  ) : (
    <Ionicons
      name={isFavorite ? 'star' : 'star-outline'}
      size={18}
      color={isFavorite ? '#F5A623' : '#000'}
    />
  );

  return (
    <View className="px-6 mt-4 flex-row gap-3">
      <Button
        title={isFavorite ? t('MerchantStore.removeFromFavorites') : t('MerchantStore.addToFavorites')}
        onPress={onToggleFavorite}
        disabled={isTogglingFavorite}
        width={170}
        height={36}
        className="bg-white border border-yellow-400 rounded-2xl px-4 py-1"
        textColor="text-text-primary"
        leftIcon={favoriteIcon}
      />
      <Button
        title={t('MerchantStore.buyVoucher')}
        onPress={onBuyVoucher}
        width={170}
        height={36}
        textColor="text-text-primary"
        className="bg-white border border-accent rounded-2xl px-4 py-1"
      />
    </View>
  );
};
