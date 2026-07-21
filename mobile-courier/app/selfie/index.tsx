import { Typography } from '@/components/atoms/Typography';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { sendPhoneCode, updateProfile, uploadProfileImage, verifyMyPhone } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'name' | 'phone' | 'selfie';

/**
 * First-login onboarding for couriers:
 *  1. Name + surname — the spot and customer see who is delivering.
 *  2. Phone — ONLY if the courier didn't register by phone (i.e. not yet
 *     phoneVerified); confirmed via an SMS OTP.
 *  3. Selfie — shown to the spot and customer at handover so identity is
 *     verifiable.
 * The gate in app/index.tsx sends couriers here until name, phone and photo
 * are all set.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: me, refetch } = useWhoAmI();

  const [step, setStep] = useState<Step>('name');

  // Name step state.
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Phone step state.
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);

  // Selfie step state.
  const [uri, setUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Phone step is needed only when the courier hasn't verified a phone
  // (phone signups are already verified, so they skip it).
  const needsPhone = !!me && !me.phoneVerified;

  // Prefill the name once the profile loads (e.g. a courier who set a name at
  // signup but still needs a photo). Don't clobber what the user has typed.
  useEffect(() => {
    if (!me) return;
    setFirstName((v) => v || me.firstName || '');
    setSurname((v) => v || me.surname || '');
  }, [me]);

  // Pulse the avatar while the photo uploads, so the screen doesn't look frozen.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!uploading) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [uploading, pulse]);

  const goFromName = async () => {
    const first = firstName.trim();
    const last = surname.trim();
    if (!first || !last) {
      setError(t('Onboarding.profile.nameRequired'));
      return;
    }
    setError(null);

    // Only hit the backend when something actually changed.
    const changed = first !== (me?.firstName ?? '') || last !== (me?.surname ?? '');
    if (changed) {
      setSavingName(true);
      try {
        const res = await updateProfile({ data: { firstName: first, surname: last } });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || t('Onboarding.profile.saveFailed'));
        }
        const cached = await AsyncStorage.getItem('userData');
        if (cached) {
          await AsyncStorage.setItem(
            'userData',
            JSON.stringify({ ...JSON.parse(cached), ...res.data }),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t('Onboarding.profile.saveFailed'));
        return;
      } finally {
        setSavingName(false);
      }
    }

    // Phone-registered couriers already have a verified phone → skip that step.
    setStep(needsPhone ? 'phone' : 'selfie');
  };

  // Phone step: send an SMS OTP to the entered number.
  const sendOtp = async () => {
    const num = phone.trim();
    if (!num) {
      setError(t('Onboarding.phone.numberRequired'));
      return;
    }
    setError(null);
    setPhoneBusy(true);
    try {
      const res = await sendPhoneCode(num);
      if (!res.data?.success && res.error) throw new Error(res.error);
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Onboarding.phone.sendFailed'));
    } finally {
      setPhoneBusy(false);
    }
  };

  // Phone step: verify the OTP → marks the authed user's phone verified.
  const verifyOtp = async () => {
    const num = phone.trim();
    const code = otp.trim();
    if (!code) {
      setError(t('Onboarding.phone.codeRequired'));
      return;
    }
    setError(null);
    setPhoneBusy(true);
    try {
      const res = await verifyMyPhone(num, code);
      if (res.error || !res.data?.success) {
        throw new Error(res.error || res.data?.message || t('Onboarding.phone.verifyFailed'));
      }
      const cached = await AsyncStorage.getItem('userData');
      if (cached) {
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({ ...JSON.parse(cached), phone: num, phoneVerified: true }),
        );
      }
      await refetch();
      setStep('selfie');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Onboarding.phone.verifyFailed'));
    } finally {
      setPhoneBusy(false);
    }
  };

  // Pick an existing photo from the gallery. Handy on the simulator (no camera)
  // and as a general alternative to taking a selfie. Gives a local file:// URI
  // that uploadProfileImage can send as multipart form-data.
  const pickFromGallery = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(t('Selfie.galleryPermission'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setUri(res.assets[0].uri);
  };

  const takeSelfie = async () => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(t('Selfie.permission'));
      return;
    }
    try {
      const res = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]) setUri(res.assets[0].uri);
    } catch (e) {
      // Simulator has no camera → launchCameraAsync rejects. Suggest the gallery.
      setError(e instanceof Error ? e.message : t('Selfie.error'));
    }
  };

  const confirmSelfie = async () => {
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

  // Dots reflect the actual steps this courier will see (phone is conditional).
  const dotSteps: Step[] = needsPhone ? ['name', 'phone', 'selfie'] : ['name', 'selfie'];
  const StepDots = () => (
    <View className="flex-row justify-center gap-2 mb-6">
      {dotSteps.map((s) => (
        <View
          key={s}
          className="h-2 rounded-full"
          style={{
            width: s === step ? 24 : 8,
            backgroundColor: s === step ? '#EC2828' : '#E5E7EB',
          }}
        />
      ))}
    </View>
  );

  return (
    <View
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
    >
      <StepDots />

      {step === 'name' ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            <Typography variant="heading-32-bold" className="text-text-primary text-center">
              {t('Onboarding.profile.title')}
            </Typography>
            <Typography variant="body-base-regular" className="mt-2 text-center text-gray-500">
              {t('Onboarding.profile.subtitle')}
            </Typography>
          </View>

          <View className="mt-10">
            <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1">
              {t('Onboarding.profile.firstName')}
            </Typography>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 border border-gray-200 text-base"
              style={{ fontFamily: 'Urbanist' }}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholder={t('Onboarding.profile.firstNamePlaceholder')}
              placeholderTextColor="#9CA3AF"
              returnKeyType="next"
            />

            <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1 mt-4">
              {t('Onboarding.profile.surname')}
            </Typography>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 border border-gray-200 text-base"
              style={{ fontFamily: 'Urbanist' }}
              value={surname}
              onChangeText={setSurname}
              autoCapitalize="words"
              placeholder={t('Onboarding.profile.surnamePlaceholder')}
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
            />
          </View>

          {error && (
            <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
              <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                {error}
              </Typography>
            </View>
          )}

          <Pressable
            onPress={goFromName}
            disabled={savingName}
            className="items-center rounded-2xl py-4 mt-8"
            style={{ backgroundColor: savingName ? '#F4A3A3' : '#EC2828' }}
          >
            {savingName ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-white">
                {t('Onboarding.profile.continue')}
              </Typography>
            )}
          </Pressable>
        </ScrollView>
      ) : step === 'phone' ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            <Typography variant="heading-32-bold" className="text-text-primary text-center">
              {t('Onboarding.phone.title')}
            </Typography>
            <Typography variant="body-base-regular" className="mt-2 text-center text-gray-500">
              {t('Onboarding.phone.subtitle')}
            </Typography>
          </View>

          <View className="mt-10">
            <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1">
              {t('Onboarding.phone.number')}
            </Typography>
            <TextInput
              className="bg-white rounded-2xl px-4 py-4 border border-gray-200 text-base"
              style={{ fontFamily: 'Urbanist' }}
              value={phone}
              onChangeText={setPhone}
              editable={!otpSent}
              keyboardType="phone-pad"
              placeholder="+48 123 456 789"
              placeholderTextColor="#9CA3AF"
            />

            {otpSent && (
              <>
                <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1 mt-4">
                  {t('Onboarding.phone.code')}
                </Typography>
                <TextInput
                  className="bg-white rounded-2xl px-4 py-4 border border-gray-200 text-base"
                  style={{ fontFamily: 'Urbanist', letterSpacing: 4 }}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="123456"
                  placeholderTextColor="#9CA3AF"
                  maxLength={6}
                />
              </>
            )}
          </View>

          {error && (
            <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
              <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                {error}
              </Typography>
            </View>
          )}

          <Pressable
            onPress={otpSent ? verifyOtp : sendOtp}
            disabled={phoneBusy}
            className="items-center rounded-2xl py-4 mt-8"
            style={{ backgroundColor: phoneBusy ? '#F4A3A3' : '#EC2828' }}
          >
            {phoneBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-white">
                {t(otpSent ? 'Onboarding.phone.verify' : 'Onboarding.phone.send')}
              </Typography>
            )}
          </Pressable>

          {otpSent && (
            <Pressable onPress={sendOtp} disabled={phoneBusy} className="items-center py-3 mt-1">
              <Typography variant="body-small-regular" className="text-gray-400">
                {t('Onboarding.phone.resend')}
              </Typography>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <>
          <View className="items-center">
            <Typography variant="heading-32-bold" className="text-text-primary text-center">
              {t('Selfie.title')}
            </Typography>
            <Typography variant="body-base-regular" className="mt-2 text-center text-gray-500">
              {t('Selfie.subtitle')}
            </Typography>
          </View>

          <View className="flex-1 items-center justify-center">
            <Animated.View
              className="h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-gray-100"
              style={{ borderWidth: 3, borderColor: '#EC2828', opacity: pulse }}
            >
              {uri ? (
                <Image source={{ uri }} style={{ width: 224, height: 224 }} />
              ) : (
                <Ionicons name="person" size={80} color="#9CA3AF" />
              )}
              {/* Uploading overlay so it's clear the photo is being sent. */}
              {uploading && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              )}
            </Animated.View>

            {uploading && (
              <Typography variant="body-small-semibold" className="mt-4 text-gray-500">
                {t('Selfie.uploading')}
              </Typography>
            )}

            {error && (
              <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                  {error}
                </Typography>
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

            {/* Gallery alternative — also the way to add a photo on the simulator
                (no camera there). */}
            <Pressable
              onPress={pickFromGallery}
              disabled={uploading}
              className="flex-row items-center justify-center rounded-2xl border py-4"
              style={{ borderColor: '#D1D5DB' }}
            >
              <Ionicons name="images-outline" size={20} color="#6B7280" />
              <Typography variant="body-base-bold" className="ml-2" style={{ color: '#6B7280' }}>
                {t('Selfie.chooseFromGallery')}
              </Typography>
            </Pressable>

            <Pressable
              onPress={confirmSelfie}
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
        </>
      )}
    </View>
  );
}
