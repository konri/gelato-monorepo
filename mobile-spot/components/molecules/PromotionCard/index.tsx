import React from 'react';
import { Pressable } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Image } from '@/components/atoms/Image';
import { View } from 'react-native';
import {logger} from "@/utils/logger";

interface PromotionCardProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  value?: number;
  onPress?: () => void;
}

export function PromotionCard({
  imageUrl,
  title,
  description,
  value,
  onPress,
}: PromotionCardProps) {
  return (
    <Pressable onPress={onPress} className="px-6">
      <RoundedCard variant="less-rounded" className="overflow-hidden shadow-sm border border-gray-100 mx-0 mb-0 p-0">
        {/* Image */}
        <View className="h-32 bg-gray-100">
          <Image
            url={imageUrl}
            className="w-full h-full"
            resizeMode="cover"
            fallbackWidth={224}
            fallbackHeight={128}
            fallbackLogoSize={32}
          />
        </View>

        {/* Content */}
        <View className="p-3">
          {title && (
            <Typography
              variant="body-base-semibold"
              className="text-text-primary mb-1"
              numberOfLines={1}
            >
              {title}
            </Typography>
          )}

          {description && (
            <Typography
              variant="body-small-regular"
              className="text-text-secondary mb-2"
              numberOfLines={2}
            >
              {description}
            </Typography>
          )}

          {value !== undefined && (
            <View className="bg-accent rounded-full px-3 py-1 self-start">
              <Typography variant="body-small-semibold" className="text-white">
                -{value}%
              </Typography>
            </View>
          )}
        </View>
      </RoundedCard>
    </Pressable>
  );
}

