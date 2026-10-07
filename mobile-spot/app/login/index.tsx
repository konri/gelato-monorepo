import Lockup from '@/assets/images/loodly_lockup.svg';
import { Typography } from '@/components/atoms/Typography';
import { canOpenUpdate, openUpdate } from '@/components/organisms/UpgradeRequiredOverlay';
import { session, useSession } from '@/contexts/SessionProvider';
import {
  adminForgotPassword,
  adminResetPassword,
  changeAdminPassword,
  loginUser,
  type ApiResponse,
  type LoginResponse,
} from '@/shared/api-client';
import { spotStore } from '@/stores/spotStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SpotLoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { noticeKey } = useSession();

  // An invite email deep-links here with ?mode=reset&email=… so a newly invited
  // spot admin lands directly on the set-password form (they have their code).
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();

  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : '',
  );
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [mode, setMode] = useState<'login' | 'firstLogin' | 'forgot' | 'reset'>(
    params.mode === 'reset' ? 'reset' : 'login',
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // The server asked for a newer build (426 UPGRADE_REQUIRED).
  const [needsUpdate, setNeedsUpdate] = useState(false);

  // A notice from the session (e.g. signed out to set a new password).
  useEffect(() => {
    if (!noticeKey) return;
    setNotice(t(noticeKey));
    session.clearNotice();
  }, [noticeKey, t]);

  const subtitle =
    mode === 'firstLogin'
      ? t('Spot.changePasswordSubtitle')
      : mode === 'forgot'
      ? t('Spot.forgotSubtitle')
      : mode === 'reset'
      ? t('Spot.resetTitle')
      : t('Spot.loginSubtitle');

  const goMode = (m: typeof mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
    setNeedsUpdate(false);
  };

  // A failed login: show the server's (localized) text; 426 adds "Update app".
  const showLoginError = (res: ApiResponse<LoginResponse>) => {
    setNeedsUpdate(res.status === 426 || res.code === 'UPGRADE_REQUIRED');
    setError(res.error || t('Spot.loginFailed'));
  };

  // Signed in: seed the session + spot context, then ask for the spot when
  // there is more than one (or none), else straight to the tabs.
  const finishLogin = async (data: LoginResponse) => {
    await session.signIn(data);
    const status = spotStore.getState().status;
    router.replace(status === 'ready' ? '/(tabs)' : '/choose-spot');
  };

  const doForgot = async () => {
    setError(null);
    setLoading(true);
    try {
      await adminForgotPassword(email);
      setNotice(t('Spot.resetCodeSent'));
      setMode('reset');
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminResetPassword(email, resetCode, newPassword);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNotice(t('Spot.resetDone'));
      setPassword('');
      setNewPassword('');
      setResetCode('');
      setMode('login');
    } finally {
      setLoading(false);
    }
  };

  const doLogin = async () => {
    setError(null);
    setNeedsUpdate(false);
    setLoading(true);
    try {
      const res = await loginUser({ email, password, loginContext: 'ADMIN_WEB' });
      if (res.error || !res.data) {
        showLoginError(res);
        return;
      }
      // Staff created with a handed-over password must set their own first.
      if (res.data.user?.mustChangePassword || res.data.user?.firstLogin) {
        setMode('firstLogin');
        return;
      }
      await finishLogin(res.data);
    } finally {
      setLoading(false);
    }
  };

  const doChangePassword = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await changeAdminPassword(email, password, newPassword);
      if (res.error) {
        setError(res.error);
        return;
      }
      // Re-login with the new password to get a fresh (unrestricted) session.
      const login = await loginUser({
        email,
        password: newPassword,
        loginContext: 'ADMIN_WEB',
      });
      if (login.error || !login.data) {
        showLoginError(login);
        return;
      }
      await finishLogin(login.data);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base';

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 40 }}>
      <View className="w-full max-w-[420px] self-center px-6">
        <View className="items-center mb-8">
          {/* The lockup already reads "loodly", so the old "Loodly Spot" title
              would repeat it — SPOT is a badge under the cone instead. */}
          <View style={{ width: 180, height: 124 }}>
            <Lockup width={180} height={124} />
            <View
              style={{ position: 'absolute', left: 52, width: 114, bottom: 4, alignItems: 'center' }}
            >
              <Typography
                variant="body-base-bold"
                style={{ color: '#EC2828', letterSpacing: 4 }}
              >
                SPOT
              </Typography>
            </View>
          </View>
          <Typography variant="body-base-regular" className="text-gray-500 mt-3">
            {subtitle}
          </Typography>
        </View>

        {error && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
            <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
              {error}
            </Typography>
            {needsUpdate && canOpenUpdate() && (
              <Pressable
                onPress={openUpdate}
                accessibilityRole="button"
                className="mt-3 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#EC2828', minHeight: 48 }}
              >
                <Typography variant="body-base-bold" className="text-white">
                  {Platform.OS === 'web' ? t('Upgrade.ctaWeb') : t('Upgrade.cta')}
                </Typography>
              </Pressable>
            )}
          </View>
        )}
        {notice && (
          <View className="mb-4 rounded-xl bg-green-50 px-4 py-3">
            <Typography variant="body-small-regular" style={{ color: '#15803D' }}>
              {notice}
            </Typography>
          </View>
        )}

        {mode === 'login' ? (
          <View className="gap-4">
            <TextInput
              className={inputCls}
              placeholder={t('Spot.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className={inputCls}
              placeholder={t('Spot.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={doLogin}
              disabled={loading}
              className="rounded-xl py-4 items-center mt-2"
              style={{ backgroundColor: loading ? '#F4A3A3' : '#EC2828' }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('Spot.signIn')}
                </Typography>
              )}
            </Pressable>
            <Pressable onPress={() => goMode('forgot')} className="items-center mt-1">
              <Typography variant="body-small-semibold" style={{ color: '#EC2828' }}>
                {t('Spot.forgotPassword')}
              </Typography>
            </Pressable>
          </View>
        ) : mode === 'firstLogin' ? (
          <View className="gap-4">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {t('Spot.changePasswordTitle')}
            </Typography>
            <TextInput
              className={inputCls}
              placeholder={t('Spot.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={doChangePassword}
              disabled={loading}
              className="rounded-xl py-4 items-center mt-2"
              style={{ backgroundColor: loading ? '#F4A3A3' : '#EC2828' }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('Spot.savePassword')}
                </Typography>
              )}
            </Pressable>
          </View>
        ) : mode === 'forgot' ? (
          <View className="gap-4">
            <TextInput
              className={inputCls}
              placeholder={t('Spot.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable
              onPress={doForgot}
              disabled={loading}
              className="rounded-xl py-4 items-center mt-2"
              style={{ backgroundColor: loading ? '#F4A3A3' : '#EC2828' }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('Spot.sendResetCode')}
                </Typography>
              )}
            </Pressable>
            <Pressable onPress={() => goMode('login')} className="items-center mt-1">
              <Typography variant="body-small-semibold" className="text-gray-500">
                {t('Spot.backToLogin')}
              </Typography>
            </Pressable>
          </View>
        ) : (
          <View className="gap-4">
            <TextInput
              className={inputCls}
              placeholder={t('Spot.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className={inputCls}
              placeholder={t('Spot.resetCode')}
              value={resetCode}
              onChangeText={setResetCode}
              autoCapitalize="none"
            />
            <TextInput
              className={inputCls}
              placeholder={t('Spot.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={doReset}
              disabled={loading}
              className="rounded-xl py-4 items-center mt-2"
              style={{ backgroundColor: loading ? '#F4A3A3' : '#EC2828' }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('Spot.resetPassword')}
                </Typography>
              )}
            </Pressable>
            <Pressable onPress={() => goMode('login')} className="items-center mt-1">
              <Typography variant="body-small-semibold" className="text-gray-500">
                {t('Spot.backToLogin')}
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
