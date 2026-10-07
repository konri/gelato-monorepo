import Lockup from '@/assets/images/loodly_lockup.svg';
import { Typography } from '@/components/atoms/Typography';
import { SpotList } from '@/components/molecules/SpotSwitcher/SpotList';
import { config } from '@/config';
import { session, useSession } from '@/contexts/SessionProvider';
import { useSpotState } from '@/hooks/useActiveSpot';
import { spotStore, type StaffSpotVM } from '@/stores/spotStore';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * "Where are you working today?" (BRANDS_SPEC §4.2, §4.3). Shown after an
 * explicit login with more than one spot, and on the first open of a day (or
 * after 8 hours) when the user can switch. Not spot-scoped.
 *
 * Also the place for "no spot at all" (admin panel for brand admins, retry,
 * sign out) and for a context that could not be loaded.
 */
export default function ChooseSpotScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sessionState = useSession();
  const state = useSpotState();
  const [retrying, setRetrying] = useState(false);

  if (sessionState.status === 'signedOut' || state.status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  const choose = async (spot: StaffSpotVM) => {
    const ok = await spotStore.setActiveSpot(spot.spotId, 'choose');
    if (ok) router.replace('/(tabs)');
  };

  const retry = async () => {
    setRetrying(true);
    try {
      await spotStore.refresh('retry');
    } finally {
      setRetrying(false);
    }
    if (spotStore.getState().status === 'ready') router.replace('/(tabs)');
  };

  const email = typeof sessionState.user?.email === 'string' ? sessionState.user.email : null;

  const signOutButton = (
    <Pressable
      onPress={() => void session.signOut()}
      accessibilityRole="button"
      className="mt-3 items-center justify-center rounded-xl border border-gray-300 bg-white"
      style={{ minHeight: 52 }}
    >
      <Typography variant="body-base-semibold" style={{ color: '#B91C1C' }}>
        {t('Spot.signOut')}
      </Typography>
    </Pressable>
  );

  if (sessionState.status === 'loading' || state.status === 'idle' || state.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  if (state.status === 'noAccess' || state.status === 'error') {
    const isError = state.status === 'error';
    const brandAdmin = state.staffKind === 'BRAND_ADMIN';
    const body = isError
      ? t('ChooseSpot.loadError')
      : brandAdmin
        ? t('ChooseSpot.noSpotsBrandAdmin')
        : state.staffKind === 'PLATFORM'
          ? t('ChooseSpot.noSpotsPlatform')
          : t('ChooseSpot.noSpotsStaff');
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }}>
        <View className="w-full max-w-[480px] flex-1 justify-center self-center px-6">
          <View className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#FEECEC' }}>
              <Ionicons name={isError ? 'cloud-offline-outline' : 'storefront-outline'} size={32} color="#EC2828" />
            </View>
            {!isError && (
              <Typography variant="body-xl-bold" className="mt-4 text-center text-text-primary">
                {t('ChooseSpot.noSpotsTitle')}
              </Typography>
            )}
            <Typography variant="body-base-regular" className="mt-2 text-center text-gray-600">
              {body}
            </Typography>
          </View>
          <View className="mt-8">
            {!isError && (brandAdmin || state.staffKind === 'PLATFORM') && !!config.ADMIN_WEB_URL && (
              <Pressable
                onPress={() => Linking.openURL(config.ADMIN_WEB_URL).catch(() => {})}
                accessibilityRole="link"
                className="items-center justify-center rounded-xl"
                style={{ backgroundColor: '#EC2828', minHeight: 52 }}
              >
                <Typography variant="body-base-bold" className="text-white">
                  {t('ChooseSpot.openAdminPanel')}
                </Typography>
              </Pressable>
            )}
            <Pressable
              onPress={retry}
              disabled={retrying}
              accessibilityRole="button"
              className="mt-3 items-center justify-center rounded-xl border border-gray-300 bg-white"
              style={{ minHeight: 52 }}
            >
              {retrying ? (
                <ActivityIndicator color="#EC2828" />
              ) : (
                <Typography variant="body-base-semibold" className="text-text-primary">
                  {t('ChooseSpot.retry')}
                </Typography>
              )}
            </Pressable>
            {signOutButton}
          </View>
        </View>
      </View>
    );
  }

  const header = (
    <View className="mb-5">
      <View style={{ width: 88, height: 61 }}>
        <Lockup width={88} height={61} />
      </View>
      <Typography variant="heading-32-bold" className="mt-4 text-text-primary" accessibilityRole="header">
        {t('ChooseSpot.title')}
      </Typography>
      <Typography variant="body-base-regular" className="mt-1 text-gray-600">
        {t('ChooseSpot.subtitle')}
      </Typography>
      {!!email && (
        <Typography variant="body-base-regular" className="mt-2 text-gray-600">
          {t('ChooseSpot.signedInAs', { email })}
        </Typography>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 24 }}>
      <View className="w-full max-w-[560px] flex-1 self-center px-4">
        <SpotList
          spots={state.spots}
          activeSpotId={state.status === 'ready' ? state.activeSpotId : null}
          lastUsedId={state.defaultSpotId}
          highlightedId={state.preselectSpotId}
          staffKind={state.staffKind}
          onSelect={choose}
          ListHeaderComponent={header}
          contentPaddingBottom={16}
          fill
        />
        <View style={{ paddingBottom: insets.bottom + 12 }}>{signOutButton}</View>
      </View>
    </View>
  );
}
