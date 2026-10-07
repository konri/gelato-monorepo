import type { CodeFormat } from '@/hooks/useCodeFormat';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { Code128Barcode, useCode128Layout } from './Code128Barcode';

/** The QR payload: the raw code; legacy JSON only when there is no code (§5.4). */
export const qrValueFor = (code?: string | null, userId?: string | null): string | null => {
  if (code) return code;
  if (userId) return JSON.stringify({ userId, type: 'LOYALTY_USER' });
  return null;
};

/** Quiet zone the QR spec asks for, in modules (ISO/IEC 18004: 4). */
const QR_QUIET_MODULES = 4;
/** Modules of the smallest QR (version 1, 21×21); every `GL-`/`PR-` code fits it. */
const QR_MIN_MODULES = 21;

/**
 * The white margin, in the QR library's units (its `size` spans the matrix
 * only). Sized for the smallest matrix: a larger one has smaller modules, so
 * the margin is then more than 4 of them. The whole white square (code +
 * margin) still fits in `qrSize`, so layouts measured with it do not change.
 */
export const qrQuietZone = (qrSize: number): number =>
  Math.ceil((qrSize * QR_QUIET_MODULES) / QR_MIN_MODULES);

/** "G L dash A B C D …" so screen readers spell the code. */
export const spelledCode = (code: string) => code.split('').join(' ');

type Props = {
  code?: string | null;
  userId?: string | null;
  format: CodeFormat;
  /** Width available for the barcode, in points. */
  width: number;
  /** Side of the QR code, in points. */
  qrSize: number;
  /** Height of the bars, in points. */
  barcodeHeight: number;
  /** Screen-reader label; default "Card number G L dash …". */
  accessibilityLabel?: string;
};

/** True when `code` can be drawn as a sharp barcode in `width` points. */
export function useBarcodeAvailable(code: string | null | undefined, width: number): boolean {
  return !!useCode128Layout(code ?? '', width);
}

/**
 * The code itself: QR or Code 128. Falls back to the QR when the barcode would
 * be too small to scan (modules under 2 px) or there is no code yet.
 */
export function LoyaltyCode({ code, userId, format, width, qrSize, barcodeHeight, accessibilityLabel }: Props) {
  const { t } = useTranslation();
  const barcodeOk = useBarcodeAvailable(code, width);
  const qrValue = qrValueFor(code, userId);
  const label =
    accessibilityLabel ?? (code ? t('LoyaltyCode.codeA11y', { spelled: spelledCode(code) }) : undefined);

  if (format === 'barcode' && code && barcodeOk) {
    return (
      <View className="items-center justify-center" style={{ minHeight: barcodeHeight }}>
        <Code128Barcode
          value={code}
          maxWidth={width}
          height={barcodeHeight}
          accessibilityLabel={label}
        />
      </View>
    );
  }

  if (!qrValue) {
    return <View style={{ width: qrSize, height: qrSize }} className="bg-gray-100 rounded-xl" />;
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <QRCodeSVG
        value={qrValue}
        size={qrSize}
        color="#000000"
        backgroundColor="#FFFFFF"
        quietZone={qrQuietZone(qrSize)}
        ecl="M"
      />
    </View>
  );
}
