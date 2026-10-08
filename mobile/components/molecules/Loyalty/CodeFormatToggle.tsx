import type { CodeFormat } from '@/hooks/useCodeFormat';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { THEME } from '@/constants/palette';

type Props = {
  value: CodeFormat;
  onChange: (next: CodeFormat) => void;
  /** The barcode cannot be drawn sharply here (tiny screen): QR only. */
  barcodeDisabled?: boolean;
};

const SEGMENTS: { key: CodeFormat; icon: 'qr-code-outline' | 'barcode-outline'; labelKey: string }[] = [
  { key: 'qr', icon: 'qr-code-outline', labelKey: 'LoyaltyCode.qr' },
  { key: 'barcode', icon: 'barcode-outline', labelKey: 'LoyaltyCode.barcode' },
];

/** QR | Barcode, two 56dp segments with icon AND text (BRANDS_SPEC §5.4). */
export function CodeFormatToggle({ value, onChange, barcodeDisabled = false }: Props) {
  const { t } = useTranslation();
  return (
    <View
      className="flex-row rounded-2xl bg-gray-100 p-1"
      accessibilityRole="radiogroup"
      accessibilityLabel={t('LoyaltyCode.formatA11y')}
    >
      {SEGMENTS.map((segment) => {
        const selected = value === segment.key;
        const disabled = segment.key === 'barcode' && barcodeDisabled;
        return (
          <Pressable
            key={segment.key}
            onPress={() => {
              if (selected || disabled) return;
              void Haptics.selectionAsync();
              onChange(segment.key);
            }}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected, disabled }}
            accessibilityLabel={t(segment.labelKey)}
            className={`flex-1 flex-row items-center justify-center rounded-xl px-2 ${
              selected ? 'bg-white' : ''
            }`}
            style={{
              minHeight: 56,
              opacity: disabled ? 0.4 : 1,
              ...(selected
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : null),
            }}
          >
            <Ionicons name={segment.icon} size={22} color={selected ? THEME.primaryDark : THEME.textSecondary} />
            <Text
              className="ml-2 font-urbanist"
              style={{
                fontSize: 17,
                fontWeight: selected ? '700' : '500',
                color: selected ? THEME.primaryDark : THEME.textSecondary,
                flexShrink: 1,
              }}
              numberOfLines={2}
              maxFontSizeMultiplier={1.4}
            >
              {t(segment.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
