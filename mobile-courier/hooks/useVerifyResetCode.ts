import { useState, useRef, useEffect } from 'react';
import { TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPasswordResetCode, resetPasswordWithCode } from '@repo/api-client';

export const useVerifyResetCode = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [codeValidTimer, setCodeValidTimer] = useState(300);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const getEmail = async () => {
      const pendingEmail = await AsyncStorage.getItem('pendingPasswordResetEmail');
      if (pendingEmail) {
        setEmail(pendingEmail);
      } else {
        router.replace('/forgot-password');
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

  const handleCodeChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    // Paste of multiple digits: distribute across the boxes from this index.
    if (digits.length > 1) {
      const newCode = [...code];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);
      const lastFilled = Math.min(index + digits.length, 6) - 1;
      inputRefs.current[Math.min(lastFilled, 5)]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = digits;
    setCode(newCode);

    if (digits && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('Common.error'), t('Common.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('Common.error'), t('Common.passwordsNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('Common.error'), t('Common.passwordTooShort'));
      return;
    }

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert(t('Common.error'), t('Common.enterSixDigitCode'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPasswordWithCode(email, fullCode, password);

      if (response.error) {
        Alert.alert(t('Common.error'), response.error);
        return;
      }

      await AsyncStorage.removeItem('pendingPasswordResetEmail');
      Alert.alert(t('Common.success'), t('Common.passwordChanged'));
      router.replace('/login');
    } catch {
      Alert.alert(t('Common.error'), t('Common.passwordResetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || !email) return;

    setIsResending(true);
    try {
      const response = await requestPasswordResetCode(email);

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
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    resendTimer,
    isResending,
    codeValidTimer,
    inputRefs,
    formatCodeValidTime,
    handleCodeChange,
    handleKeyPress,
    handleResetPassword,
    handleResendCode,
  };
};
