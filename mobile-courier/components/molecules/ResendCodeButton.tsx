import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

interface ResendCodeButtonProps {
  resendTimer: number;
  isResending: boolean;
  onResend: () => void;
}

export const ResendCodeButton = ({ resendTimer, isResending, onResend }: ResendCodeButtonProps) => {
  const { t } = useTranslation();

  return (
    <View className="items-center">
      <Pressable
        onPress={onResend}
        disabled={resendTimer > 0 || isResending}
        className={`px-6 py-3 rounded-full ${
          resendTimer > 0 || isResending ? 'bg-gray-300' : 'bg-red-500'
        }`}
      >
        <Text
          className={`text-center font-semibold ${
            resendTimer > 0 || isResending ? 'text-gray-500' : 'text-white'
          }`}
          style={{ fontFamily: 'Urbanist' }}
        >
          {isResending
            ? t('Common.loading')
            : resendTimer > 0
            ? `${t('VerifyPhoneCode.resendCode')} (${resendTimer}s)`
            : t('VerifyPhoneCode.resendCode')}
        </Text>
      </Pressable>
    </View>
  );
};
