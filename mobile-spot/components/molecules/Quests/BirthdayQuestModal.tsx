import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { updateProfile } from '@/shared/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BirthdayQuestModalProps {
  visible: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

// Format a Date to the backend's expected YYYY-MM-DD (local, no timezone shift).
const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const BirthdayQuestModal = ({ visible, onClose, onCompleted }: BirthdayQuestModalProps) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Must be at least 13 years old (matches validateBirthDate) and after 1900.
  const maximumDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d;
  }, []);
  const minimumDate = useMemo(() => new Date(1900, 0, 1), []);

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    // Android fires this on dismiss/set; iOS updates inline.
    if (Platform.OS === 'android') {
      setPickerOpen(false);
      if (event.type === 'dismissed') return;
    }
    if (date) setSelectedDate(date);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      Alert.alert(t('Common.error'), t('Validation.birthDateInvalidWithAge'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateProfile({ data: { birthDate: toIsoDate(selectedDate) } });
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || t('Validation.updateFailed'));
      }

      // Keep cached user data in sync so the quest stays completed offline.
      const cached = await AsyncStorage.getItem('userData');
      if (cached) {
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({ ...JSON.parse(cached), ...result.data }),
        );
      }

      setSelectedDate(null);
      onCompleted();
    } catch (error) {
      const err = error as { message?: string };
      Alert.alert(t('Common.error'), err?.message || t('Common.saveDataFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      headerTitle={t('Tasks.birthdayModalTitle')}
      buttons={[
        <Button
          key="save"
          title={submitting ? t('Modal.activating') : t('Tasks.saveBirthday')}
          onPress={handleSave}
          variant="primary"
          width="70%"
          height={52}
          disabled={submitting || !selectedDate}
        />,
        <Pressable key="cancel" onPress={onClose}>
          <Typography variant="body-base-bold">{t('Modal.cancel')}</Typography>
        </Pressable>,
      ]}
    >
      <View className="w-full pt-2 pb-4">
        <Typography variant="body-small-regular" className="text-gray-700 mb-4">
          {t('Tasks.birthdayModalDescription')}
        </Typography>

        {/* Tappable field — opens the native picker */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center bg-white rounded-2xl px-4 py-4 border border-gray-200"
        >
          <Ionicons name="calendar-outline" size={22} color="#9E9E9E" />
          <Typography
            variant="body-base-regular"
            className={`flex-1 ml-3 ${selectedDate ? 'text-text-primary' : 'text-gray-400'}`}
          >
            {selectedDate ? toIsoDate(selectedDate) : t('Tasks.selectBirthday')}
          </Typography>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </Pressable>

        {/* iOS shows an inline spinner once opened; Android shows a dialog. */}
        {pickerOpen && Platform.OS === 'ios' && (
          <View className="mt-2 bg-white rounded-2xl">
            <DateTimePicker
              value={selectedDate ?? maximumDate}
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
            value={selectedDate ?? maximumDate}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handlePickerChange}
          />
        )}

        <View className="flex-row items-center mt-3">
          <Ionicons name="lock-closed-outline" size={14} color="#9CA3AF" />
          <Typography variant="body-very-small-regular" className="text-gray-400 ml-2 flex-1">
            {t('Tasks.birthdayImmutableNote')}
          </Typography>
        </View>
      </View>
    </Modal>
  );
};
