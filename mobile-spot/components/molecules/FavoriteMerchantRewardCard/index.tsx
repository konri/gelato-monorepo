import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { config } from '@/config';
import { generalShadowStyle } from '@/utils/styles';
import React from 'react';
import { Pressable, Image as RNImage, View } from 'react-native';

const CARD_WIDTH = 120;
const LOGO_SIZE = 72;

interface FavoriteMerchantRewardCardProps {
  logoUrl?: string;
  storeName: string;
  statusLabel: string;
  isReady: boolean;
  hasActivity: boolean;
  stampIconUrl?: string;
  onPress?: () => void;
}

export function FavoriteMerchantRewardCard({
  logoUrl,
  storeName,
  statusLabel,
  isReady,
  hasActivity,
  stampIconUrl,
  onPress,
}: FavoriteMerchantRewardCardProps) {
  const fullStampIconUrl = stampIconUrl
    ? (stampIconUrl.startsWith('http') ? stampIconUrl : `${config.API_URL}${stampIconUrl}`)
    : undefined;

  return (
    <Pressable onPress={onPress} className="items-center" style={{ width: CARD_WIDTH }}>
      <View
        className="bg-white rounded-3xl items-center px-2 pb-3 justify-between shadow-sm border border-gray-100"
        style={{ width: CARD_WIDTH, height: 130, paddingTop: LOGO_SIZE / 2 }}
      >
        {/* Logo on top edge */}
        <View
          className="absolute rounded-full bg-white"
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            top: -(LOGO_SIZE / 2),
            ...generalShadowStyle,
          }}
        >
          <Image
            url={logoUrl}
            fallbackWidth={LOGO_SIZE}
            fallbackHeight={LOGO_SIZE}
            fallbackLogoSize={22}
            rounded={true}
            className="w-full h-full rounded-full overflow-hidden"
            resizeMode="contain"
          />
        </View>

        {/* Store name */}
        <Typography variant="body-base-bold" className="text-text-primary text-center mb-2 mt-2" numberOfLines={1}>
          {storeName}
        </Typography>

        {/* Status */}
        {!hasActivity ? (
          <Typography variant="body-base-medium-small" className="text-gray-400 text-center pb-2">
            {statusLabel}
          </Typography>
        ) : (
          <View className="flex-row items-center gap-1">
            {fullStampIconUrl && (
              <RNImage source={{ uri: fullStampIconUrl }} style={{ width: 20, height: 20 }} resizeMode="contain" />
            )}
            <Typography variant="body-base-medium-small" className="text-accent pb-2">
              {statusLabel}
            </Typography>
          </View>
        )}
      </View>
    </Pressable>
  );
}
