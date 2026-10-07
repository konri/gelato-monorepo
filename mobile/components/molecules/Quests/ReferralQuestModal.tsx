import React from 'react';
import { Alert, Clipboard, Pressable, Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { useBrands } from '@/hooks/useBrands';
import { useGraphQLQuery } from '@/hooks/useGraphQLQuery';
import { useReferralCode } from '@/hooks/useReferralCode';
import { getMyReferralStats } from '@/shared/api-client/src/graphql/queries/referralCode/getMyReferralCode';
import type { ReferralStats } from '@/shared/api-client/src/graphql/queries/referralCode/types';
import { pointsText } from '@/utils/formatPoints';

interface ReferralQuestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReferralQuestModal = ({ visible, onClose }: ReferralQuestModalProps) => {
  const { t } = useTranslation();
  const { data: referral, loading, refetch } = useReferralCode();
  // Loaded when the modal opens (it stays mounted under the Tasks tab).
  const { data: stats } = useGraphQLQuery<ReferralStats>(
    (options) =>
      visible ? getMyReferralStats(options) : Promise.resolve({ data: null, error: null, success: true }),
    { silent: true },
    [visible],
  );
  const { wallets } = useBrands();
  const code = referral?.code ?? '';
  // A2: both sides get the brand's own bonus after the friend's first purchase there.
  const referralBrands = wallets.filter((w) => !w.paused && w.brand.referralBonusPoints > 0);

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

        {/* Reward rules: the brands' own numbers, never a fixed amount (A2). */}
        <View className="w-full bg-white rounded-2xl px-4 py-3 mb-3">
          <LText size={16} color="#374151">
            {t('Tasks.referralRuleIntro')}
          </LText>
          {referralBrands.length > 0 ? (
            referralBrands.map((w) => (
              <View key={w.brand.id} className="flex-row items-start mt-2">
                <Ionicons name="people-outline" size={20} color={COLORS.red} style={{ marginTop: 1 }} />
                <LText size={16} weight="600" className="ml-2 flex-1">
                  {t('Tasks.referralRuleBrand', {
                    brand: w.brand.name,
                    pointsText: pointsText(t, w.brand.referralBonusPoints),
                  })}
                </LText>
              </View>
            ))
          ) : (
            <LText size={16} color={COLORS.secondary} className="mt-2">
              {t('Tasks.referralRuleNone')}
            </LText>
          )}
        </View>

        {/* My invitations */}
        {stats && stats.totalReferrals > 0 ? (
          <View className="w-full bg-white rounded-2xl px-4 py-3 mb-3">
            <LText size={16} weight="700">
              {t('Tasks.referralStatsInvited', { count: stats.totalReferrals })}
            </LText>
            {stats.pendingReferrals > 0 ? (
              <LText size={16} color={COLORS.secondary} className="mt-1">
                {t('Tasks.referralStatsPending', { count: stats.pendingReferrals })}
              </LText>
            ) : null}
            {stats.earnedByBrand.map((e) => (
              <LText key={e.brandId} size={16} weight="600" color={COLORS.green} className="mt-1">
                {t('Tasks.referralStatsEarned', { brand: e.brandName, pointsText: pointsText(t, e.points) })}
              </LText>
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
};
