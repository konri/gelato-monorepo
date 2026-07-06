import Logo from '@/assets/images/logo.svg';
import { Typography } from '@/components/atoms/Typography';
import { useUserSync } from '@/hooks/useUserSync';
import { storeSpotContext } from '@/hooks/useSpotOrders';
import {
  adminForgotPassword,
  adminResetPassword,
  changeAdminPassword,
  loginUser,
} from '@/shared/api-client';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SpotLoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { handlePostLogin } = useUserSync();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [mode, setMode] = useState<'login' | 'firstLogin' | 'forgot' | 'reset'>(
    'login',
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const res = await loginUser({ email, password, loginContext: 'ADMIN_WEB' });
      if (res.error || !res.data) {
        setError(res.error || t('Spot.loginFailed'));
        return;
      }
      // Force a password change on first employee login.
      if (res.data.user?.firstLogin) {
        setMode('firstLogin');
        return;
      }
      const u = res.data.user as any;
      await storeSpotContext({
        spotId: u?.spotId ?? null,
        userId: u?.id ?? null,
        roles: u?.roles ?? [],
      });
      await handlePostLogin(
        res.data.user,
        res.data.token.access_token,
        'email',
        res.data.refreshToken,
      );
      router.replace('/(tabs)');
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
      // Re-login with the new password to get a fresh (first-login-cleared) session.
      const login = await loginUser({
        email,
        password: newPassword,
        loginContext: 'ADMIN_WEB',
      });
      if (login.data) {
        const u = login.data.user as any;
        await storeSpotContext({
          spotId: u?.spotId ?? null,
          userId: u?.id ?? null,
          roles: u?.roles ?? [],
        });
        await handlePostLogin(
          login.data.user,
          login.data.token.access_token,
          'email',
          login.data.refreshToken,
        );
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base';

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 40 }}>
      <View className="px-6">
        <View className="items-center mb-8">
          <Logo width={56} height={56} />
          <Typography variant="heading-32-bold" className="text-text-primary mt-3">
            {t('Spot.loginTitle')}
          </Typography>
          <Typography variant="body-base-regular" className="text-gray-500 mt-1">
            {subtitle}
          </Typography>
        </View>

        {error && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
            <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
              {error}
            </Typography>
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
