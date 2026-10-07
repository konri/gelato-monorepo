import { useBrandContext } from '@/hooks/useBrands';
import { useCodeFormat } from '@/hooks/useCodeFormat';
import { useMaxBrightness } from '@/hooks/useMaxBrightness';
import { useOverlayOpen } from '@/hooks/useOverlayOpen';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StatusBar, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CodeFormatToggle } from './CodeFormatToggle';
import { LoyaltyCode, spelledCode, useBarcodeAvailable } from './LoyaltyCode';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** `GL-…` card code (or a `PR-…` reward code). */
  code?: string | null;
  /** Legacy QR payload when the account has no code yet. */
  userId?: string | null;
  /** Screen-reader label of the code; default "Card number …". */
  codeLabel?: string;
  /** A reward code (`PR-…`): not "My card on screen" for auto-follow. */
  isReward?: boolean;
};

/**
 * The card at maximum size for the scanner (BRANDS_SPEC §5.4): white
 * background (also in dark mode), full brightness and keep-awake while open,
 * both restored when it closes or the app goes to the background.
 */
export function LoyaltyCodeFullscreen({ visible, onClose, code, userId, codeLabel, isReward }: Props) {
  useOverlayOpen(visible);
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait']}
      onRequestClose={onClose}
    >
      {visible ? (
        <LoyaltyCodeFullscreenBody
          onClose={onClose}
          code={code}
          userId={userId}
          codeLabel={codeLabel}
          isReward={isReward}
        />
      ) : null}
    </Modal>
  );
}

/**
 * The fullscreen card's content, for screens that are already inside a
 * Modal (a second Modal on top of a Modal does not present on iOS), e.g. the
 * upgrade gate's "Show my card".
 */
export function LoyaltyCodeFullscreenBody({
  onClose,
  code,
  userId,
  codeLabel,
  isReward = false,
}: Omit<Props, 'visible'>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [format, setFormat] = useCodeFormat();
  const { setCardFocused } = useBrandContext();

  useKeepAwake('loodly-card');
  useMaxBrightness(true);

  // The fullscreen card counts as "My card on screen" for auto-follow. It is
  // counted (useBrands): closing it while My card is shown keeps following.
  useEffect(() => {
    if (isReward) return;
    setCardFocused(true);
    return () => setCardFocused(false);
  }, [setCardFocused, isReward]);

  const label = codeLabel ?? (code ? t('LoyaltyCode.codeA11y', { spelled: spelledCode(code) }) : undefined);

  const codeWidth = width - 32;
  const qrSize = Math.round(Math.min(width - 48, 360, height * 0.45));
  const barcodeHeight = Math.round(Math.max(200, Math.min(height * 0.4, 320)));
  const barcodeOk = useBarcodeAvailable(code, codeWidth);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: '#FFFFFF',
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 16,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <CodeFormatToggle
        value={format === 'barcode' && barcodeOk && code ? 'barcode' : 'qr'}
        onChange={setFormat}
        barcodeDisabled={!barcodeOk || !code}
      />

      <View className="flex-1 items-center justify-center">
        <LoyaltyCode
          code={code}
          userId={userId}
          format={format}
          width={codeWidth}
          qrSize={qrSize}
          barcodeHeight={barcodeHeight}
          accessibilityLabel={label}
        />
        {code ? (
          <Text
            selectable
            className="mt-5 text-center"
            style={{ fontSize: 34, fontFamily: 'SpaceMono', letterSpacing: 2, color: '#111827' }}
            maxFontSizeMultiplier={1.3}
            accessibilityLabel={label}
          >
            {code}
          </Text>
        ) : null}
        <Text
          className="mt-3 text-center font-urbanist"
          style={{ fontSize: 18, lineHeight: 26, color: '#4B5563' }}
          maxFontSizeMultiplier={1.5}
        >
          {t('LoyaltyCode.fullscreenHint')}
        </Text>
      </View>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('LoyaltyCode.close')}
        className="items-center justify-center rounded-2xl bg-gray-900 active:opacity-80"
        style={{ minHeight: 64 }}
      >
        <Text className="font-urbanist text-white" style={{ fontSize: 20, fontWeight: '700' }}>
          {t('LoyaltyCode.close')}
        </Text>
      </Pressable>
    </View>
  );
}
