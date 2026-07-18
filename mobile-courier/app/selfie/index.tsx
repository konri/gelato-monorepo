import { Typography } from '@/components/atoms/Typography';
import { uploadProfileImage } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * First-login selfie for couriers. The spot and customer see this photo when
 * the courier accepts their order, so identity is verifiable at handover.
 */
export default function SelfieScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [uri, setUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takeSelfie = async () => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(t('Selfie.permission'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setUri(res.assets[0].uri);
  };

  const confirm = async () => {
    if (!uri) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadProfileImage(uri, 'selfie.jpg');
      if (res.error) throw new Error(res.error);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Selfie.error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}>
      <View className="items-center">
        <Typography variant="heading-32-bold" className="text-text-primary text-center">
          {t('Selfie.title')}
        </Typography>
        <Typography variant="body-base-regular" className="mt-2 text-center text-gray-500">
          {t('Selfie.subtitle')}
        </Typography>
      </View>

      <View className="flex-1 items-center justify-center">
        <View
          className="h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-gray-100"
          style={{ borderWidth: 3, borderColor: '#EC2828' }}
        >
          {uri ? (
            <Image source={{ uri }} style={{ width: 224, height: 224 }} />
          ) : (
            <Ionicons name="person" size={80} color="#9CA3AF" />
          )}
        </View>

        {error && (
          <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
            <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>{error}</Typography>
          </View>
        )}
      </View>

      <View className="gap-3">
        <Pressable
          onPress={takeSelfie}
          disabled={uploading}
          className="flex-row items-center justify-center rounded-2xl border py-4"
          style={{ borderColor: '#EC2828' }}
        >
          <Ionicons name="camera" size={20} color="#EC2828" />
          <Typography variant="body-base-bold" className="ml-2" style={{ color: '#EC2828' }}>
            {t(uri ? 'Selfie.retake' : 'Selfie.take')}
          </Typography>
        </Pressable>

        <Pressable
          onPress={confirm}
          disabled={!uri || uploading}
          className="items-center rounded-2xl py-4"
          style={{ backgroundColor: !uri || uploading ? '#F4A3A3' : '#EC2828' }}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="body-base-bold" className="text-white">
              {t('Selfie.confirm')}
            </Typography>
          )}
        </Pressable>
      </View>
    </View>
  );
}
