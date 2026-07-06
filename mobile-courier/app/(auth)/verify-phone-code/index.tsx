import { Typography } from '@/components/atoms/Typography';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { CodeInput } from '@/components/molecules/CodeInput';
import { ResendCodeButton } from '@/components/molecules/ResendCodeButton';
import { useVerifyPhoneCode } from '@/hooks/useVerifyPhoneCode';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function VerifyPhoneCodeScreen() {
  const { t } = useTranslation();
  const {
    code, phone, isLoading, resendTimer, isResending, codeValidTimer,
    inputRefs, formatTime, handleCodeChange, handleKeyPress, handleResend,
  } = useVerifyPhoneCode();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader
          title={t('VerifyPhoneCode.title')}
          subtitle={`${t('VerifyPhoneCode.subtitle')} ${phone}`}
        />
        <View className="gap-6">
          <View className="items-center">
            <Typography
              variant="body-small-regular"
              className={codeValidTimer > 0 ? 'text-text-subtitle' : 'text-accent'}
            >
              {codeValidTimer > 0
                ? `${t('VerifyPhoneCode.codeValidFor')} ${formatTime(codeValidTimer)}`
                : t('VerifyPhoneCode.codeExpired')}
            </Typography>
          </View>
          <View>
            <Typography variant="body-lg-semibold-spaced" className="text-text-primary mb-4">
              {t('VerifyPhoneCode.codeLabel')}
            </Typography>
            <CodeInput
              code={code}
              inputRefs={inputRefs}
              isLoading={isLoading}
              onCodeChange={handleCodeChange}
              onKeyPress={handleKeyPress}
            />
          </View>
          <View className="items-center">
            <ResendCodeButton
              resendTimer={resendTimer}
              isResending={isResending}
              onResend={handleResend}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
