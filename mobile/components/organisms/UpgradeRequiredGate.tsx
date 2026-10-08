import Lockup from '@/assets/images/loodly_lockup.svg';
import { LoyaltyCodeFullscreenBody } from '@/components/molecules/Loyalty/LoyaltyCodeFullscreen';
import { config } from '@/config';
import { useOverlayOpen } from '@/hooks/useOverlayOpen';
import {
  getUpgradeRequired,
  onUpgradeRequired,
  type UpgradeInfo,
} from '@/shared/api-client/src/upgradeEvents';
import { readLastCard, type LastCard } from '@/utils/loyaltyStorage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/palette';

const storeUrls = (): string[] => {
  if (Platform.OS === 'android') {
    const pkg = Constants.expoConfig?.android?.package;
    return pkg
      ? [`market://details?id=${pkg}`, `https://play.google.com/store/apps/details?id=${pkg}`]
      : [];
  }
  if (Platform.OS === 'ios' && config.IOS_APP_STORE_URL) {
    return [config.IOS_APP_STORE_URL.replace(/^https:/, 'itms-apps:'), config.IOS_APP_STORE_URL];
  }
  return [];
};

const openStore = async (urls: string[]) => {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      /* try the next form */
    }
  }
};

/**
 * Covers the whole app when the server says this build is too old
 * (`UPGRADE_REQUIRED`, BRANDS_SPEC §5.2). Not dismissable: every request
 * would fail anyway. Rendered once at the root, above the navigator.
 *
 * It also covers My card, so it offers "Show my card": the card stored on the
 * device (LAST_CARD_KEY) still works at the counter, to pay and to collect
 * points, until the user updates (review #12).
 */
export function UpgradeRequiredGate() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<UpgradeInfo | null>(() => getUpgradeRequired());
  const [lastCard, setLastCard] = useState<LastCard | null>(null);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => onUpgradeRequired(setInfo), []);
  useOverlayOpen(!!info);

  // The card stored at the last successful `me` (no request needed).
  useEffect(() => {
    if (!info) return;
    let active = true;
    void readLastCard().then((card) => {
      if (active) setLastCard(card);
    });
    return () => {
      active = false;
    };
  }, [info]);

  if (!info) return null;
  const urls = storeUrls();

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait']}
      // Back closes the card; the gate itself cannot be dismissed.
      onRequestClose={() => setShowCard(false)}
    >
      {showCard && lastCard ? (
        // The same Modal shows the card: a second Modal on top would not
        // present on iOS.
        <LoyaltyCodeFullscreenBody
          onClose={() => setShowCard(false)}
          code={lastCard.loyaltyCode}
          userId={lastCard.userId}
        />
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: THEME.background }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
        >
          <View className="items-center">
            <Lockup width={160} height={111} />
            <View className="mt-8 h-16 w-16 items-center justify-center rounded-full bg-berry-wash">
              <Ionicons name="arrow-up-circle-outline" size={40} color={THEME.primaryDark} />
            </View>
            <Text
              accessibilityRole="header"
              className="mt-6 text-center font-urbanist text-gray-900"
              style={{ fontSize: 28, fontWeight: '700' }}
            >
              {t('Upgrade.title')}
            </Text>
            <Text
              className="mt-4 text-center font-urbanist"
              style={{ fontSize: 18, lineHeight: 26, color: THEME.textSecondary }}
            >
              {t('Upgrade.body')}
            </Text>
            {info.minVersion ? (
              <Text
                className="mt-3 text-center font-urbanist"
                style={{ fontSize: 18, lineHeight: 26, color: THEME.textSecondary }}
              >
                {t('Upgrade.minVersion', { version: info.minVersion })}
              </Text>
            ) : null}
          </View>

          {urls.length > 0 ? (
            <Pressable
              onPress={() => void openStore(urls)}
              accessibilityRole="button"
              className="mt-10 items-center justify-center rounded-2xl bg-accent active:opacity-80"
              style={{ minHeight: 56 }}
            >
              <Text className="font-urbanist text-white" style={{ fontSize: 18, fontWeight: '700' }}>
                {t('Upgrade.button')}
              </Text>
            </Pressable>
          ) : (
            <Text
              className="mt-10 text-center font-urbanist text-gray-900"
              style={{ fontSize: 18, lineHeight: 26, fontWeight: '600' }}
            >
              {t('Upgrade.manual')}
            </Text>
          )}

          {lastCard ? (
            <View className="mt-8">
              <Text
                className="mb-3 text-center font-urbanist"
                style={{ fontSize: 18, lineHeight: 26, color: THEME.textSecondary }}
              >
                {t('Upgrade.cardHint')}
              </Text>
              <Pressable
                onPress={() => setShowCard(true)}
                accessibilityRole="button"
                accessibilityLabel={t('LoyaltyCode.showMyCard')}
                className="flex-row items-center justify-center rounded-2xl border-2 border-gray-900 bg-white px-4 active:opacity-80"
                style={{ minHeight: 64 }}
              >
                <Ionicons name="qr-code-outline" size={28} color={THEME.text} />
                <Text
                  className="ml-2 font-urbanist text-gray-900"
                  style={{ fontSize: 20, fontWeight: '700' }}
                  maxFontSizeMultiplier={1.4}
                >
                  {t('LoyaltyCode.showMyCard')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </Modal>
  );
}
