import { BrandLogo } from '@/components/atoms/BrandLogo';
import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = {
  brand: { id: string; name: string; logoUrl?: string | null };
  /** "Change ⌄" (BrandSwitcher, MULTI) or "Info ›" (static header). */
  action: 'change' | 'info';
  onPress: () => void;
  /** Optional line under the name (e.g. the points). */
  subtitle?: string | null;
};

/**
 * `BrandHeader` / `BrandSwitcher` (BRANDS_SPEC §5.5): ≥ 64dp, logo 48, the
 * brand's name at 20px on up to 2 lines, then "Change ⌄" or "Info ›". The
 * whole row is one touch target.
 */
export function BrandHeader({ brand, action, onPress, subtitle }: Props) {
  const { t } = useTranslation();
  const actionLabel = action === 'change' ? t('Loyalty.change') : t('Loyalty.info');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[brand.name, subtitle, actionLabel].filter(Boolean).join('. ')}
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 py-2 active:opacity-80"
      style={{ minHeight: 64 }}
    >
      <BrandLogo brand={brand} size={48} />
      <View className="ml-3 flex-1">
        <LText size={20} weight="700" numberOfLines={2} max={1.4}>
          {brand.name}
        </LText>
        {subtitle ? (
          <LText size={16} color={COLORS.secondary} max={1.4}>
            {subtitle}
          </LText>
        ) : null}
      </View>
      <View
        className="ml-2 flex-row items-center rounded-full bg-red-50 px-3"
        style={{ minHeight: 48 }}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <LText size={17} weight="700" color={COLORS.red} max={1.3}>
          {actionLabel}
        </LText>
        <Ionicons
          name={action === 'change' ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={COLORS.red}
          style={{ marginLeft: 2 }}
        />
      </View>
    </Pressable>
  );
}
