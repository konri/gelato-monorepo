import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { formatNumber } from '@/utils/formatPoints';

interface QuestCardProps {
  /** Optional: bonuses differ per brand, so most cards show an icon instead. */
  points?: number;
  title: string;
  description: string;
  /** Extra lines under the description (e.g. the brands that take part). */
  details?: (string | null | undefined)[];
  iconName: keyof typeof Ionicons.glyphMap;
  completed?: boolean;
  onPress?: () => void;
}

export const QuestCard = ({
  points,
  title,
  description,
  details = [],
  iconName,
  completed = false,
  onPress,
}: QuestCardProps) => {
  const { t } = useTranslation();
  const lines = details.filter(Boolean) as string[];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, description, ...lines].join('. ')}
      accessibilityState={{ checked: completed }}
    >
      <RoundedCard variant="less-rounded" shadow className="py-4 px-4">
        <View className="flex-row items-center" style={{ minHeight: 72 }}>
          {/* Left: points badge, or the task's icon when the bonus depends on the brand */}
          <View
            className={`mr-4 w-16 h-16 rounded-2xl items-center justify-center ${
              completed ? 'bg-gray-100' : 'bg-amber-50'
            }`}
          >
            {points != null ? (
              <>
                <LText size={20} weight="700" color={completed ? COLORS.secondary : COLORS.red} max={1.2}>
                  +{formatNumber(points)}
                </LText>
                <LText size={16} color={completed ? COLORS.secondary : COLORS.amber} max={1.2}>
                  {t('Loyalty.pointsUnit', { count: points })}
                </LText>
              </>
            ) : (
              <Ionicons name={iconName} size={30} color={completed ? COLORS.secondary : COLORS.red} />
            )}
          </View>

          {/* Right: details */}
          <View className="flex-1">
            <LText size={20} weight="700" color={completed ? COLORS.secondary : COLORS.text}>
              {title}
            </LText>
            <LText size={16} color={COLORS.secondary} className="mt-0.5">
              {description}
            </LText>
            {lines.map((line) => (
              <LText key={line} size={16} color="#374151" className="mt-1">
                {line}
              </LText>
            ))}
          </View>

          {/* Trailing affordance */}
          <View className="ml-2">
            {completed ? (
              <Ionicons name="checkmark-circle" size={26} color="#16A34A" />
            ) : onPress ? (
              <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
            ) : null}
          </View>
        </View>
      </RoundedCard>
    </Pressable>
  );
};
