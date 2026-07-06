import React, { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as StoreReview from 'expo-store-review';
import { DropdownItem } from '@/components/atoms/DropdownItem';
import { useAuthState } from '@/hooks/useAuthState';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { deleteAccount } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { CitySelectorModal } from './CitySelectorModal';
import { ContactFormModal } from './ContactFormModal';

const PRIVACY_URL = 'https://www.goodlood.com/privacy';
const TERMS_URL = 'https://www.goodlood.com/terms';

export const SettingsItems = () => {
  const { t, i18n } = useTranslation();
  const { clearAuthState } = useAuthState();
  const { data: user } = useWhoAmI();

  const [languageOpen, setLanguageOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [city, setCity] = useState<string | undefined>(undefined);

  // Preselect the city from the user's saved preference (localized name),
  // falling back to whatever was stored locally.
  useEffect(() => {
    if (city !== undefined) return;
    const nl =
      user?.preferredCity && typeof user.preferredCity.nameLocal === 'object'
        ? user.preferredCity.nameLocal
        : null;
    const lang = i18n.language.split('-')[0] as 'pl' | 'en' | 'ua';
    const fromUser = user?.preferredCity
      ? (nl && (nl[lang] || nl.en)) || user.preferredCity.name
      : undefined;
    if (fromUser) {
      setCity(fromUser);
      return;
    }
    safeGetItem('selectedCity').then((stored) => {
      if (stored) setCity(stored);
    });
  }, [user, i18n.language, city]);

  const languageLabel = i18n.language?.toUpperCase();

  const handleLogout = () => {
    Alert.alert(t('Header.logoutTitle'), t('Header.logoutMessage'), [
      { text: t('Header.cancel'), style: 'cancel' },
      {
        text: t('Header.logout'),
        style: 'destructive',
        onPress: async () => {
          await clearAuthState();
          router.replace('/welcome');
        },
      },
    ]);
  };

  const handleRate = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        Alert.alert(t('Common.error'), t('Settings.rateUnavailable'));
      }
    } catch {
      Alert.alert(t('Common.error'), t('Settings.rateUnavailable'));
    }
  };

  const handleDelete = () => {
    Alert.alert(t('Settings.deleteAccountTitle'), t('Settings.deleteAccountMessage'), [
      { text: t('Header.cancel'), style: 'cancel' },
      {
        text: t('Settings.deleteAccountConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await safeGetItem('access_token');
            const result = await deleteAccount({ token: token ?? undefined });
            if (!result.success) {
              throw new Error(result.error?.message || t('Settings.deleteAccountFailed'));
            }
            await clearAuthState();
            Alert.alert(t('Common.success'), t('Settings.accountDeleted'));
            router.replace('/welcome');
          } catch (error) {
            const err = error as { message?: string };
            Alert.alert(t('Common.error'), err?.message || t('Settings.deleteAccountFailed'));
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* Account group */}
      <View className="shadow-sm px-6 mt-2">
        <DropdownItem
          label={t('Settings.editProfile')}
          iconName="person-outline"
          position="first"
          onPress={() => router.push('/settings/edit-profile')}
        />
        <DropdownItem
          label={t('Settings.city')}
          iconName="location-outline"
          value={city ?? undefined}
          position="middle"
          onPress={() => setCityOpen(true)}
        />
        <DropdownItem
          label={t('Settings.language')}
          iconName="language-outline"
          value={languageLabel}
          position="last"
          onPress={() => setLanguageOpen(true)}
        />
      </View>

      {/* Support / legal group */}
      <View className="shadow-sm px-6 mt-6">
        <DropdownItem
          label={t('Settings.rateApp')}
          iconName="star-outline"
          position="first"
          onPress={handleRate}
        />
        <DropdownItem
          label={t('Settings.contactUs')}
          iconName="mail-outline"
          position="middle"
          onPress={() => setContactOpen(true)}
        />
        <DropdownItem
          label={t('Settings.privacyPolicy')}
          iconName="shield-checkmark-outline"
          position="middle"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <DropdownItem
          label={t('Settings.terms')}
          iconName="document-text-outline"
          position="last"
          onPress={() => Linking.openURL(TERMS_URL)}
        />
      </View>

      {/* Danger / session group */}
      <View className="shadow-sm px-6 mt-6 mb-8">
        <DropdownItem
          label={t('Settings.logout')}
          iconName="log-out-outline"
          position="first"
          showChevron={false}
          onPress={handleLogout}
        />
        <DropdownItem
          label={t('Settings.deleteAccount')}
          iconName="trash-outline"
          position="last"
          destructive
          showChevron={false}
          onPress={handleDelete}
        />
      </View>

      <LanguageSelectorModal visible={languageOpen} onClose={() => setLanguageOpen(false)} />
      <CitySelectorModal
        visible={cityOpen}
        currentCity={city}
        onClose={() => setCityOpen(false)}
        onSelected={setCity}
      />
      <ContactFormModal visible={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
};
