import { config } from '@/config';
import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { THEME } from '@/constants/palette';

type Props = {
  brand: { id: string; name: string; logoUrl?: string | null };
  size?: number;
  /** Greyed out (paused brand). */
  muted?: boolean;
};

// Contrast-checked against white text (all ≥ 4.5:1). Categorical Tailwind
// 700s, independent of the app accent (index order kept so colours are stable).
const PALETTE = ['#B91C1C', '#1D4ED8', '#047857', '#7C3AED', '#B45309', '#0F766E', '#BE185D', '#374151'];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

/**
 * A brand's logo, or its initials on a colour picked from the brand id.
 * Never the Loodly fallback image: that would read as the wrong brand.
 * Hidden from screen readers: the name is always rendered next to it.
 */
export function BrandLogo({ brand, size = 48, muted = false }: Props) {
  const [failed, setFailed] = useState(false);
  const uri = brand.logoUrl
    ? brand.logoUrl.startsWith('http')
      ? brand.logoUrl
      : `${config.API_URL}${brand.logoUrl}`
    : null;

  const box = {
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: muted ? 0.5 : 1,
  } as const;

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={[box, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: THEME.borderStrong }]}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }

  return (
    <View
      style={[box, { backgroundColor: PALETTE[hash(brand.id) % PALETTE.length] }]}
      className="items-center justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        className="font-urbanist text-white"
        style={{ fontSize: Math.round(size * 0.38), fontWeight: '700' }}
        maxFontSizeMultiplier={1}
      >
        {initials(brand.name)}
      </Text>
    </View>
  );
}
