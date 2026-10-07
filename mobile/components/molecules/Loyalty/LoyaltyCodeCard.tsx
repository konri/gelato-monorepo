import { useCodeFormat } from '@/hooks/useCodeFormat';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { CodeFormatToggle } from './CodeFormatToggle';
import { LoyaltyCode, spelledCode, useBarcodeAvailable } from './LoyaltyCode';

type Props = {
  /** `GL-XXXXXXXX`; null while unknown (legacy JSON QR with `userId`). */
  code?: string | null;
  userId?: string | null;
  /** Side of the QR (and height of the code area), chosen by the screen. */
  qrSize: number;
  onBigger: () => void;
};

const CARD_PADDING = 12;

/**
 * "Your card": the one code staff scan at every brand (BRANDS_SPEC §5.4).
 * QR (raw `GL-` code) or Code 128, the card number, and "Bigger and brighter"
 * for the fullscreen card. The code area keeps the same height in both
 * formats so the layout never jumps.
 */
export function LoyaltyCodeCard({ code, userId, qrSize, onBigger }: Props) {
  const { t } = useTranslation();
  const [format, setFormat] = useCodeFormat();
  const [innerWidth, setInnerWidth] = useState(0);
  const barcodeOk = useBarcodeAvailable(code, innerWidth);
  // What is actually drawn: the QR when the barcode cannot be drawn sharply.
  const shown = format === 'barcode' && (!code || (innerWidth > 0 && !barcodeOk)) ? 'qr' : format;

  const onInnerLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== innerWidth) setInnerWidth(w);
  };

  const barcodeHeight = Math.round(Math.min(qrSize, Math.max(96, qrSize * 0.7)));

  return (
    <View
      className="mx-4 mt-3 rounded-3xl border border-gray-200 bg-white"
      style={{ padding: CARD_PADDING }}
    >
      <View className="flex-row items-center">
        <View className="mr-2 flex-1">
          <Text
            accessibilityRole="header"
            className="font-urbanist text-gray-900"
            style={{ fontSize: 20, lineHeight: 25, fontWeight: '700' }}
            maxFontSizeMultiplier={1.3}
          >
            {t('LoyaltyCode.title')}
          </Text>
          <Text
            className="font-urbanist"
            style={{ fontSize: 16, lineHeight: 20, color: '#4B5563' }}
            maxFontSizeMultiplier={1.3}
          >
            {t('Loyalty.oneCard')}
          </Text>
        </View>
        <Pressable
          onPress={onBigger}
          accessibilityRole="button"
          accessibilityLabel={t('LoyaltyCode.bigger')}
          className="flex-row items-center rounded-full border border-amber-300 bg-amber-50 px-3 active:opacity-80"
          style={{ minHeight: 48, maxWidth: '58%' }}
        >
          <Ionicons name="sunny" size={22} color="#92400E" />
          <Text
            className="ml-1.5 font-urbanist"
            style={{ fontSize: 16, lineHeight: 20, fontWeight: '700', color: '#92400E', flexShrink: 1 }}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
          >
            {t('LoyaltyCode.bigger')}
          </Text>
        </Pressable>
      </View>

      <View className="mt-2.5">
        <CodeFormatToggle
          value={shown}
          onChange={setFormat}
          barcodeDisabled={!code || (innerWidth > 0 && !barcodeOk)}
        />
      </View>

      <View
        onLayout={onInnerLayout}
        className="mt-2.5 items-center justify-center"
        style={{ minHeight: qrSize }}
      >
        {innerWidth > 0 ? (
          <LoyaltyCode
            code={code}
            userId={userId}
            format={format}
            width={innerWidth}
            qrSize={qrSize}
            barcodeHeight={barcodeHeight}
          />
        ) : null}
      </View>

      <View
        className="mt-2.5 flex-row flex-wrap items-baseline justify-between"
        accessible
        accessibilityLabel={code ? t('LoyaltyCode.codeA11y', { spelled: spelledCode(code) }) : undefined}
      >
        <Text
          className="mr-2 font-urbanist"
          style={{ fontSize: 16, lineHeight: 20, color: '#4B5563' }}
          maxFontSizeMultiplier={1.3}
        >
          {t('LoyaltyCode.cardNumber')}
        </Text>
        {/* Already large (28px); not scaled further so the number stays on one
            line and the card fits above the fold at 130 % text size. */}
        <Text
          selectable
          style={{ fontSize: 28, lineHeight: 36, fontFamily: 'SpaceMono', letterSpacing: 0.5, color: '#111827' }}
          maxFontSizeMultiplier={1}
        >
          {code || '—'}
        </Text>
      </View>
    </View>
  );
}
