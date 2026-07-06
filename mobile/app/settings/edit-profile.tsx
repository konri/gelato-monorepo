import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomSafeAreaView } from '@/components/CustomSafeAreaView';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { updateProfile, uploadProfileImage } from '@repo/api-client';

const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { data: user, refetch } = useWhoAmI();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [surname, setSurname] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fall back to fetched values until the user edits a field.
  const firstNameValue = firstName ?? user?.firstName ?? '';
  const surnameValue = surname ?? user?.surname ?? '';
  const phoneValue = phone ?? user?.phone ?? '';
  const birthdayLocked = Boolean(user?.birthDate);
  const avatarValue = avatarUrl ?? user?.profilePicture ?? null;

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('Common.error'), t('Settings.photoPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'avatar.jpg';
      const mimeType = asset.mimeType || 'image/jpeg';
      const uploaded = await uploadProfileImage(asset.uri, fileName, mimeType);
      if (uploaded.error || !uploaded.data?.imageUrl) {
        throw new Error(uploaded.error || t('Settings.avatarUploadFailed'));
      }

      setAvatarUrl(uploaded.data.imageUrl);

      // Keep cached user data in sync immediately.
      const cached = await AsyncStorage.getItem('userData');
      if (cached) {
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({ ...JSON.parse(cached), profilePicture: uploaded.data.imageUrl }),
        );
      }
      await refetch();
    } catch (error) {
      const err = error as { message?: string };
      Alert.alert(t('Common.error'), err?.message || t('Settings.avatarUploadFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const maximumDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d;
  }, []);
  const minimumDate = useMemo(() => new Date(1900, 0, 1), []);

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setPickerOpen(false);
      if (event.type === 'dismissed') return;
    }
    if (date) setBirthDate(date);
  };

  const handleSave = async () => {
    const data: Record<string, string> = {};
    if (firstNameValue !== (user?.firstName ?? '')) data.firstName = firstNameValue;
    if (surnameValue !== (user?.surname ?? '')) data.surname = surnameValue;
    if (phoneValue !== (user?.phone ?? '')) data.phone = phoneValue;
    if (!birthdayLocked && birthDate) data.birthDate = toIsoDate(birthDate);

    if (Object.keys(data).length === 0) {
      router.back();
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({ data });
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || t('Validation.updateFailed'));
      }
      const cached = await AsyncStorage.getItem('userData');
      if (cached) {
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({ ...JSON.parse(cached), ...result.data }),
        );
      }
      Alert.alert(t('Common.success'), t('Settings.profileUpdated'));
      router.back();
    } catch (error) {
      const err = error as { message?: string };
      Alert.alert(t('Common.error'), err?.message || t('Common.saveDataFailed'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'bg-white rounded-2xl px-4 py-4 border border-gray-200 text-base';
  const labelClass = 'text-gray-700 mb-1 ml-1 mt-3';

  return (
    <CustomSafeAreaView>
      <HeaderWithBackButton title={t('Settings.editProfile')} variant="card" />

      <ScrollView
        className="px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Avatar */}
        <View className="items-center mt-4 mb-2">
          <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar}>
            <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center overflow-hidden border border-gray-200">
              {uploadingAvatar ? (
                <ActivityIndicator color="#EC2828" />
              ) : avatarValue ? (
                <Image source={{ uri: avatarValue }} className="w-24 h-24" resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={40} color="#9CA3AF" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-red-500 items-center justify-center border-2 border-white">
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        <Typography variant="body-small-semibold" className={labelClass}>
          {t('Settings.firstName')}
        </Typography>
        <TextInput
          className={inputClass}
          style={{ fontFamily: 'Urbanist' }}
          value={firstNameValue}
          onChangeText={setFirstName}
          autoCapitalize="words"
          placeholderTextColor="#9CA3AF"
        />

        <Typography variant="body-small-semibold" className={labelClass}>
          {t('Settings.surname')}
        </Typography>
        <TextInput
          className={inputClass}
          style={{ fontFamily: 'Urbanist' }}
          value={surnameValue}
          onChangeText={setSurname}
          autoCapitalize="words"
          placeholderTextColor="#9CA3AF"
        />

        <Typography variant="body-small-semibold" className={labelClass}>
          {t('Settings.phone')}
        </Typography>
        <TextInput
          className={inputClass}
          style={{ fontFamily: 'Urbanist' }}
          value={phoneValue}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />

        <Typography variant="body-small-semibold" className={labelClass}>
          {t('Settings.birthday')}
        </Typography>
        <Pressable
          onPress={() => !birthdayLocked && setPickerOpen(true)}
          disabled={birthdayLocked}
          className={`flex-row items-center ${inputClass} ${birthdayLocked ? 'opacity-60' : ''}`}
        >
          <Ionicons name="calendar-outline" size={20} color="#9E9E9E" />
          <Typography
            variant="body-base-regular"
            className={`flex-1 ml-3 ${
              birthdayLocked || birthDate ? 'text-text-primary' : 'text-gray-400'
            }`}
          >
            {user?.birthDate
              ? user.birthDate
              : birthDate
                ? toIsoDate(birthDate)
                : t('Settings.notSet')}
          </Typography>
          {birthdayLocked && <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />}
        </Pressable>
        {birthdayLocked && (
          <Typography variant="body-very-small-regular" className="text-gray-400 mt-1 ml-1">
            {t('Settings.birthdayLocked')}
          </Typography>
        )}

        {pickerOpen && Platform.OS === 'ios' && (
          <View className="mt-2 bg-white rounded-2xl">
            <DateTimePicker
              value={birthDate ?? maximumDate}
              mode="date"
              display="spinner"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={handlePickerChange}
            />
            <Pressable className="items-center py-3" onPress={() => setPickerOpen(false)}>
              <Typography variant="body-base-bold" className="text-red-500">
                {t('Tasks.done')}
              </Typography>
            </Pressable>
          </View>
        )}
        {pickerOpen && Platform.OS !== 'ios' && (
          <DateTimePicker
            value={birthDate ?? maximumDate}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handlePickerChange}
          />
        )}

        <View className="items-center mt-8">
          <Button
            title={saving ? t('Common.loading') : t('Settings.save')}
            onPress={handleSave}
            variant="primary"
            width="100%"
            height={56}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </CustomSafeAreaView>
  );
}
