import React from 'react';
import { Alert, Clipboard, Pressable, Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { useReferralCode } from '@/hooks/useReferralCode';

interface ReferralQuestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReferralQuestModal = ({ visible, onClose }: ReferralQuestModalProps) => {
  const { t } = useTranslation();
  const { data: referral, loading, error, refetch } = useReferralCode();
  const code = referral?.code ?? '';

  const handleCopy = () => {
    if (!code) return;
    Clipboard.setString(code);
    Alert.alert(t('Common.success'), t('Profile.codeCopied'));
  };

  const handleShare = async () => {
    if (!code) {
      Alert.alert(t('Common.error'), t('Tasks.referralCodeUnavailable'));
      return;
    }
    try {
      await Share.share({
        message: t('Tasks.referralShareMessage', { code }),
      });
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert(t('Common.error'), err?.message || t('Tasks.shareFailed'));
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      headerTitle={t('Tasks.referralModalTitle')}
      buttons={[
        <Button
          key="share"
          title={loading ? t('Modal.activating') : t('Tasks.shareCode')}
          onPress={handleShare}
          variant="primary"
          width="70%"
          height={52}
          disabled={loading || !code}
          leftIcon={<Ionicons name="share-social-outline" size={20} color="#FFFFFF" />}
        />,
        <Pressable key="close" onPress={onClose}>
          <Typography variant="body-base-bold">{t('Modal.cancel')}</Typography>
        </Pressable>,
      ]}
    >
      <View className="w-full items-center pt-2 pb-4">
        {/* Code display */}
        <Typography variant="body-base-bold" className="text-center mb-2">
          {t('Profile.yourReferralCode')}
        </Typography>

        {!loading && !code ? (
          // Failed to load the code — let the user retry instead of a dead button.
          <View className="items-center mb-5">
            <Typography variant="body-small-regular" className="text-gray-500 text-center mb-3">
              {t('Tasks.referralCodeUnavailable')}
            </Typography>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center px-4 py-2 rounded-full bg-gray-100"
            >
              <Ionicons name="refresh-outline" size={18} color="#EC2828" />
              <Typography variant="body-small-bold" className="text-red-500 ml-2">
                {t('Tasks.retry')}
              </Typography>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center justify-center mb-5">
            <Typography variant="body-2xl-bold" className="text-3xl tracking-widest mr-3">
              {loading ? '· · · · · ·' : code}
            </Typography>
            <Pressable
              onPress={handleCopy}
              className="w-9 h-9 rounded items-center justify-center"
              disabled={!code}
            >
              <Ionicons name="copy-outline" size={24} color="#6B7280" />
            </Pressable>
          </View>
        )}

        {/* Reward rules */}
        <View className="w-full bg-white rounded-2xl px-4 py-3 mb-3">
          <View className="flex-row items-start mb-3">
            <Typography variant="body-lg-bold" className="text-red-500 mr-3">
              +700
            </Typography>
            <Typography variant="body-small-regular" className="text-gray-700 flex-1">
              {t('Tasks.referralRuleReferee')}
            </Typography>
          </View>
          <View className="flex-row items-start">
            <Typography variant="body-lg-bold" className="text-red-500 mr-3">
              +500
            </Typography>
            <Typography variant="body-small-regular" className="text-gray-700 flex-1">
              {t('Tasks.referralRuleReferrer')}
            </Typography>
          </View>
        </View>
      </View>
    </Modal>
  );
};
