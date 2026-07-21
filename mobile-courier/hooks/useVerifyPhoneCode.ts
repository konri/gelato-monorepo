import { sendPhoneCode, verifyPhoneCode } from '@/shared/api-client';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TextInput } from 'react-native';
import { useUserSync } from './useUserSync';

export const useVerifyPhoneCode = () => {
  const { t } = useTranslation();
  const { handlePostLogin } = useUserSync();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(240); // 4 minutes rate limit
  const [isResending, setIsResending] = useState(false);
  const [codeValidTimer, setCodeValidTimer] = useState(300); // 5 minutes code validity
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('pendingPhoneNumber').then((val) => {
      if (val) setPhone(val);
      else router.replace('/phone-signup');
    });
  }, []);

  useEffect(() => {
    if (codeValidTimer <= 0) return;
    const interval = setInterval(() => setCodeValidTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [codeValidTimer]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  const handleVerify = async (fullCode: string) => {
    if (!phone) return;
    setIsLoading(true);
    try {
      logger.log('[Phone Verify] Verifying code for phone:', phone);
      const response = await verifyPhoneCode(phone, fullCode);

      if (response.error || !response.data) {
        logger.error('[Phone Verify] Verification failed:', response.error);
        Alert.alert(t('Common.error'), t('Common.invalidCode'));
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      logger.log('[Phone Verify] Verification successful, isNewUser:', response.data.isNewUser);
      await handlePostLogin(response.data.user, response.data.token.access_token, 'phone', response.data.refreshToken);
      await AsyncStorage.removeItem('pendingPhoneNumber');

      if (response.data.isNewUser) {
        await AsyncStorage.setItem('isFirstTimeLogin', 'true');
        // New user → post-registration flow (location → city select → notifications).
        router.replace('/location');
      } else {
        // Route through the root gate (app/index.tsx) so couriers with an
        // incomplete profile finish onboarding before reaching the tabs.
        router.replace('/');
      }
    } catch (error) {
      logger.error('[Phone Verify] Unexpected error:', error);
      Alert.alert(t('Common.error'), t('Common.verificationFailed'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    // Paste of the full code: distribute across the boxes from this index.
    if (digits.length > 1) {
      const newCode = [...code];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);
      const lastFilled = Math.min(index + digits.length, 6) - 1;
      inputRefs.current[Math.min(lastFilled, 5)]?.focus();
      if (newCode.every((d) => d !== '')) handleVerify(newCode.join(''));
      return;
    }

    const newCode = [...code];
    newCode[index] = digits;
    setCode(newCode);
    if (digits && index < 5) inputRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !phone) return;
    setIsResending(true);
    try {
      logger.log('[Phone Verify] Resending code to:', phone);
      const response = await sendPhoneCode(phone);
      
      if (response.error) {
        logger.error('[Phone Verify] Resend failed:', response.error);
        Alert.alert(t('Common.error'), t('VerifyPhoneCode.resendFailed'));
        return;
      }
      
      logger.log('[Phone Verify] Code resent successfully');
      setResendTimer(240);
      setCodeValidTimer(300);
      Alert.alert(t('Common.success'), t('VerifyPhoneCode.codeSent'));
    } catch (error) {
      logger.error('[Phone Verify] Resend unexpected error:', error);
      Alert.alert(t('Common.error'), t('VerifyPhoneCode.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return {
    code, phone, isLoading, resendTimer, isResending, codeValidTimer,
    inputRefs, formatTime, handleCodeChange, handleKeyPress, handleResend,
  };
};
