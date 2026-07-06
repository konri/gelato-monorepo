import React from 'react';
import { View, Pressable, Alert, Clipboard } from 'react-native';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Typography } from '@/components/atoms/Typography';
import { Image } from '@/components/atoms/Image';
import { Button } from '@/components/atoms/Button';
import { StepItem } from '@/components/atoms/StepItem';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BonapkaLogo from '@/assets/images/bonapka.svg';
import { useReferralCode } from '@/hooks/useReferralCode';
import { router } from 'expo-router';

interface ReferralSectionProps {}

export const ReferAppSection = () => {
  const { t } = useTranslation();
  const { data: activities, loading } = useReferralCode();

  const handleReferPress = () => {
    router.push('/referral_usage');
  };

  const handleCopyCode = () => {
    if (activities?.code) {
      Clipboard.setString(activities.code);
      Alert.alert(t('Common.success'), t('Profile.codeCopied'));
    }
  };

  const handleQRCode = () => {
    router.push('/(tabs)/qr');
  };

  return (
    <View className="mb-6">
      <Typography variant="body-lg-bold" className="mb-4 px-6">
        {t('Profile.referAndWin')}
      </Typography>

      <RoundedCard variant="less-rounded" shadow className="pt-4 pb-4 px-4">
        <View className="flex-row items-center mb-4">
          <Image
            source={require('@/assets/images/logo_glow.png')}
            className="w-10 h-10 mr-1"
            resizeMode="contain"
            fallbackWidth={48}
            fallbackHeight={44}
            fallbackLogoSize={6}
          />
          <BonapkaLogo width={80} height={20} />
        </View>
        
        <View className="mb-4">
          <StepItem number={1} text={t('Profile.step1')} />
          <StepItem number={2} text={t('Profile.step2')} />
          <StepItem number={3} text={t('Profile.step3')} isLast />
        </View>
        
        <Typography variant="body-base-bold" className="text-center mb-2">
          {t('Profile.yourReferralCode')}
        </Typography>
        
        <View className="flex-row items-center justify-center mb-4">
          <Typography variant="body-2xl-bold" className="text-3xl tracking-widest mr-3">
            {activities?.code || 'A B C D E F'}
          </Typography>
          <Pressable onPress={handleCopyCode} className="w-8 h-8 rounded items-center justify-center">
            <Ionicons name="copy-outline" size={24} color="#6B7280" />
          </Pressable>
        </View>
        
        <View className="flex-row justify-center gap-4">
          <Button
            title={t('Profile.qrCode')}
            onPress={handleQRCode}
            variant="primary"
            textVariant="body-base-small"
            height={36}
            className="flex-1"
          />
          <Button
            title={t('Profile.copyCode')}
            onPress={handleCopyCode}
            variant="secondary"
            textVariant="body-base-small"
            textColor="text-white"
            height={36}
            className="flex-1"
            backgroundColor="#BFBFBF"
          />
        </View>
      </RoundedCard>
      
      <Pressable className="mt-4" onPress={handleReferPress}>
        <Typography variant="body-regular-semibold" className="text-center text-red-500">
          {t('Profile.seeUsageHistory')} →
        </Typography>
      </Pressable>
    </View>
  );
};