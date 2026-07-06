import { useState, useRef, useEffect } from 'react';
import { TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyCode, resendVerificationCode } from '@repo/api-client';

export const useVerifyCode = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [codeValidTimer, setCodeValidTimer] = useState(300);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const getEmail = async () => {
      const pendingEmail = await AsyncStorage.getItem('pendingVerificationEmail');
      if (pendingEmail) {
        setEmail(pendingEmail);
      } else {
        router.replace('/signup');
      }
    };
    getEmail();
  }, []);

  useEffect(() => {
    if (codeValidTimer > 0) {
      const interval = setInterval(() => {
        setCodeValidTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [codeValidTimer]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const formatCodeValidTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const handleVerifyCode = async (fullCode: string) => {
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await verifyCode({
        email,
        code: fullCode
      });

      if (response.error) {
        Alert.alert(t('Common.error'), response.error);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      await AsyncStorage.removeItem('pendingVerificationEmail');

      if (response.data?.token && response.data?.user) {
        await AsyncStorage.setItem('access_token', response.data.token.access_token);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
        }
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      } else {
        Alert.alert(t('Common.error'), 'Błąd weryfikacji');
        return;
      }

      // Verified + logged in → continue to the post-registration flow.
      router.replace('/location');
    } catch {
      Alert.alert(t('Common.error'), t('Common.verificationFailed'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    // Paste (or autofill) of multiple digits: distribute across the boxes
    // starting at the current index.
    if (digits.length > 1) {
      const newCode = [...code];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);
      const lastFilled = Math.min(index + digits.length, 6) - 1;
      inputRefs.current[Math.min(lastFilled, 5)]?.focus();
      if (newCode.every((d) => d !== '')) {
        handleVerifyCode(newCode.join(''));
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = digits;
    setCode(newCode);

    if (digits && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || !email) return;

    setIsResending(true);
    try {
      const response = await resendVerificationCode(email);

      if (response.error) {
        Alert.alert(t('Common.error'), response.error);
        return;
      }

      setResendTimer(60);
      setCodeValidTimer(300);
      Alert.alert(t('Common.success'), t('VerifyCode.codeSent'));
    } catch {
      Alert.alert(t('Common.error'), t('VerifyCode.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return {
    code,
    email,
    isLoading,
    resendTimer,
    isResending,
    codeValidTimer,
    inputRefs,
    formatCodeValidTime,
    handleCodeChange,
    handleKeyPress,
    handleResendCode,
  };
};
