import { sendPhoneCode } from '@/shared/api-client';
import { logger } from '@/utils/logger';
import { formatPhoneNumber, unformatPhoneNumber } from '@/utils/validators';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export const usePhoneSignUp = () => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    return formatted;
  };

  const handleSendCode = async () => {
    const digitsOnly = unformatPhoneNumber(phone);
    
    // Check if phone number is entered (at least 9 digits for Polish numbers)
    if (!digitsOnly || digitsOnly.length < 9) {
      Alert.alert(t('Common.error'), t('Common.enterPhoneNumber'));
      return;
    }
    
    // Build full phone number with country code
    const formattedPhone = `+48${digitsOnly}`;
    
    setIsLoading(true);
    try {
      logger.log('[Phone SignUp] Sending code to:', formattedPhone);
      const response = await sendPhoneCode(formattedPhone);
      
      if (response.error) {
        logger.error('[Phone SignUp] Send code error:', response.error);
        Alert.alert(t('Common.error'), t('Common.smsSendFailed'));
        return;
      }
      
      logger.log('[Phone SignUp] Code sent successfully');
      await AsyncStorage.setItem('pendingPhoneNumber', formattedPhone);
      router.push('/verify-phone-code');
    } catch (error) {
      logger.error('[Phone SignUp] Unexpected error:', error);
      Alert.alert(t('Common.error'), t('Common.smsSendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return { phone, handlePhoneChange, isLoading, handleSendCode };
};
