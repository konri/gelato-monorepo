import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';
import { RoundedCard } from '@/components/atoms/RoundedCard';

interface QuestCardProps {
  points: number;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  completed?: boolean;
  onPress?: () => void;
}

export const QuestCard = ({
  points,
  title,
  description,
  iconName,
  completed = false,
  onPress,
}: QuestCardProps) => {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <RoundedCard variant="less-rounded" shadow className="py-4 px-4">
        <View className="flex-row items-center">
          {/* Left: points badge */}
          <View className="items-center justify-center mr-4">
            <View
              className={`w-16 h-16 rounded-2xl items-center justify-center ${
                completed ? 'bg-gray-100' : 'bg-amber-50'
              }`}
            >
              <Typography
                variant="body-lg-bold"
                className={completed ? 'text-gray-400' : 'text-red-500'}
              >
                +{points}
              </Typography>
              <Typography
                variant="body-very-small-medium"
                className={completed ? 'text-gray-400' : 'text-amber-700'}
              >
                pts
              </Typography>
            </View>
          </View>

          {/* Right: details */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Ionicons
                name={iconName}
                size={18}
                color={completed ? '#9CA3AF' : '#EC2828'}
              />
              <Typography
                variant="body-base-bold"
                className={`ml-2 ${completed ? 'text-gray-400' : 'text-text-primary'}`}
              >
                {title}
              </Typography>
            </View>
            <Typography
              variant="body-small-regular"
              className="text-gray-600"
            >
              {description}
            </Typography>
          </View>

          {/* Trailing affordance */}
          <View className="ml-2">
            {completed ? (
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            ) : onPress ? (
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            ) : null}
          </View>
        </View>
      </RoundedCard>
    </Pressable>
  );
};
