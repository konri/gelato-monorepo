import { Button } from '@/components/atoms/Button';
import { InputField } from '@/components/InputField';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { usePhoneSignUp } from '@/hooks/usePhoneSignUp';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function PhoneSignUpScreen() {
  const { t } = useTranslation();
  const { phone, handlePhoneChange, isLoading, handleSendCode } = usePhoneSignUp();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader title={t('PhoneSignUp.title')} subtitle={t('PhoneSignUp.subtitle')} />
        <View className="gap-5">
          <InputField
            label={t('PhoneSignUp.phoneNumber')}
            placeholder="123 456 789"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            iconName="call-outline"
            prefix="+48"
          />
          <Button
            title={isLoading ? t('Common.loading') : t('PhoneSignUp.sendCode')}
            onPress={handleSendCode}
            variant="primary"
            width="100%"
            height={58}
            disabled={isLoading}
          />
        </View>
      </View>
    </ScrollView>
  );
}
