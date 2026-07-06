import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { sendContactMessage } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';

interface ContactFormModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactFormModal = ({ visible, onClose }: ContactFormModalProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setEmail('');
    setTitle('');
    setMessage('');
  };

  const handleSend = async () => {
    if (!EMAIL_RE.test(email) || !title.trim() || !message.trim()) {
      Alert.alert(t('Common.error'), t('Common.fillAllFields'));
      return;
    }

    setSending(true);
    try {
      const token = await safeGetItem('access_token');
      const result = await sendContactMessage({
        email: email.trim(),
        title: title.trim(),
        message: message.trim(),
        token: token ?? undefined,
      });
      if (!result.success) {
        throw new Error(result.error?.message || t('Settings.contactFailed'));
      }
      reset();
      onClose();
      Alert.alert(t('Common.success'), t('Settings.contactSent'));
    } catch (error) {
      const err = error as { message?: string };
      Alert.alert(t('Common.error'), err?.message || t('Settings.contactFailed'));
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'bg-white rounded-2xl px-4 py-4 border border-gray-200 text-base';

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      headerTitle={t('Settings.contactTitle')}
      buttons={[
        <Button
          key="send"
          title={sending ? t('Modal.activating') : t('Settings.contactSend')}
          onPress={handleSend}
          variant="primary"
          width="70%"
          height={52}
          disabled={sending}
        />,
      ]}
    >
      <View className="w-full py-2 gap-3">
        <View>
          <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1">
            {t('Settings.contactEmail')}
          </Typography>
          <TextInput
            className={inputClass}
            style={{ fontFamily: 'Urbanist' }}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View>
          <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1">
            {t('Settings.contactSubject')}
          </Typography>
          <TextInput
            className={inputClass}
            style={{ fontFamily: 'Urbanist' }}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View>
          <Typography variant="body-small-semibold" className="text-gray-700 mb-1 ml-1">
            {t('Settings.contactMessage')}
          </Typography>
          <TextInput
            className={inputClass}
            style={{ fontFamily: 'Urbanist', minHeight: 100, textAlignVertical: 'top' }}
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
    </Modal>
  );
};
