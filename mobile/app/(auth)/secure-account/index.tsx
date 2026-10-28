import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { SecureAccountForm } from '@/components/molecules/SecureAccountForm';
import { useSecureAccount } from '@/hooks/useSecureAccount';

export default function SecureAccountScreen() {
  const { t } = useTranslation();
  const { countryCode } = useSecureAccount();

  return (
    <>
      <HeaderWithBackButton title={t('SecureAccount.headerTitle')} variant="card" />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-8">
          <View>
            <Text className="text-[32px] font-bold text-gray-900 mb-2 font-urbanist leading-51.2">
              {t('SecureAccount.title')}
            </Text>
            <Text className="text-subtitle text-text-subtitle font-urbanist leading-28.8 tracking-0.2">
              {t('SecureAccount.subtitle')}
            </Text>
          </View>

          <SecureAccountForm countryCode={countryCode} />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
