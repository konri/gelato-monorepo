import React from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { Form } from '@/components/molecules/Form';
import { FormInput } from '@/components/atoms/FormInput';
import { Typography } from '@/components/atoms/Typography';
import { SecureAccountFormProps, SecureAccountFormData } from './types';

export const SecureAccountForm = ({ countryCode }: SecureAccountFormProps) => {
  const { t } = useTranslation();

  const form = useForm<SecureAccountFormData>({
    defaultValues: {
      phoneNumber: '',
    },
    mode: 'onSubmit',
  });

  const handleSubmit = async (data: SecureAccountFormData) => {
    Alert.alert(t('Common.success'), t('Common.verificationCodeSent'));
  };

  return (
    <>
      <Form 
        form={form} 
        onSubmit={handleSubmit} 
        successRoute="/verify-code"
        submitButtonText={t('SecureAccount.sendCode')}
        submitButtonStyle={{ width: '100%' }}
      >
        <FormInput
          name="phoneNumber"
          type="phone"
          required={true}
          label={t('SecureAccount.phoneNumber')}
          placeholder={t('SecureAccount.phonePlaceholder')}
          prefix={countryCode}
          keyboardType="phone-pad"
        />

        <View className="mb-8">
          <Typography variant="text-16-regular" className="text-gray-600">
            {t('SecureAccount.infoText')}
          </Typography>
        </View>
      </Form>

      <View className="items-center">
        <Pressable onPress={() => router.replace('/')}>
          <Typography variant="text-18-semibold" className="text-gray-550">
            {t('SecureAccount.skip')}
          </Typography>
        </Pressable>
      </View>
    </>
  );
};
