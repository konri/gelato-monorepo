import { Typography } from '@/components/atoms/Typography';
import { config } from '@/config';
import { onCodeEvent } from '@/shared/api-client/src/codeEvents';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Platform, Pressable, View } from 'react-native';

/** Where "Update app" leads: the store page on native, a reload on web. */
export function storeUrl(): string {
  if (Platform.OS === 'ios') return config.APP_STORE_URL;
  if (Platform.OS === 'android') return config.PLAY_STORE_URL;
  return '';
}

export function openUpdate(): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  const url = storeUrl();
  if (url) Linking.openURL(url).catch(() => {});
}

/** True when the update button has somewhere to go. */
export const canOpenUpdate = (): boolean => Platform.OS === 'web' || !!storeUrl();

/**
 * Full-screen "Update required" (BRANDS_SPEC §4.1) when the server answers
 * UPGRADE_REQUIRED (enforcement is off unless the server sets MIN_CLIENT_API;
 * this build handles it so later cutovers are clean). Stays until restart.
 */
export function UpgradeRequiredOverlay() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(
    () =>
      onCodeEvent((event) => {
        if (event.code === 'UPGRADE_REQUIRED') setVisible(true);
      }),
    [],
  );

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/70 p-6">
        <View className="w-full max-w-md items-center rounded-3xl bg-white p-6">
          <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#FEECEC' }}>
            <Ionicons name="cloud-download-outline" size={32} color="#EC2828" />
          </View>
          <Typography variant="body-xl-bold" className="mt-4 text-center text-text-primary">
            {t('Upgrade.title')}
          </Typography>
          <Typography variant="body-base-regular" className="mt-2 text-center text-gray-600">
            {t('Upgrade.body')}
          </Typography>
          {canOpenUpdate() && (
            <Pressable
              onPress={openUpdate}
              accessibilityRole="button"
              className="mt-6 w-full items-center rounded-xl py-4"
              style={{ backgroundColor: '#EC2828', minHeight: 52 }}
            >
              <Typography variant="body-base-bold" className="text-white">
                {Platform.OS === 'web' ? t('Upgrade.ctaWeb') : t('Upgrade.cta')}
              </Typography>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
