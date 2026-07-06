import { Typography } from '@/components/atoms/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useAuthState } from '@/hooks/useAuthState';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthState();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <Typography variant="body-lg-bold" className="text-text-primary">
          {t('Spot.profileTitle')}
        </Typography>
      </View>

      <View className="p-6">
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-light" style={{ backgroundColor: '#FEF2F2' }}>
            <Ionicons name="person" size={36} color="#EC2828" />
          </View>
          <Typography variant="body-lg-bold" className="mt-3 text-text-primary">
            {user?.firstName || user?.email}
          </Typography>
          <Typography variant="body-small-regular" className="text-gray-500">
            {user?.email}
          </Typography>
        </View>

        <View className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <Typography variant="body-small-regular" className="text-gray-500">
            {t('Spot.role')}
          </Typography>
          <Typography variant="body-base-semibold" className="text-text-primary">
            {user?.roles?.join(', ') || '—'}
          </Typography>
        </View>

        <Pressable
          onPress={handleLogout}
          className="mt-6 items-center rounded-xl border border-gray-200 bg-white py-3.5"
        >
          <Typography variant="body-base-semibold" style={{ color: '#EC2828' }}>
            {t('Spot.signOut')}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
