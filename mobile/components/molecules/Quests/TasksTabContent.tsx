import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BrandPromotionBanner } from '@/components/molecules/Loyalty/BrandPromotionBanner';
import { COLORS, LText, SectionTitle } from '@/components/molecules/Loyalty/ui';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBrands } from '@/hooks/useBrands';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { QuestCard } from './QuestCard';
import { ReferralQuestModal } from './ReferralQuestModal';
import { BirthdayQuestModal } from './BirthdayQuestModal';
import { THEME } from '@/constants/palette';

/**
 * Tasks (BRANDS_SPEC §5.6, A2): running promotions, the invitation (paid at
 * the friend's first purchase where invitations are rewarded) and the
 * birthday gift (per brand, only where the user already collects points).
 * No hard-coded bonus: every number comes from the brands.
 */
export const TasksTabContent = () => {
  const { t } = useTranslation();
  const { data: user, refetch: refetchUser } = useWhoAmI();
  const { wallets, refresh } = useBrands();
  const [refreshing, setRefreshing] = useState(false);
  const [referralVisible, setReferralVisible] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);

  const birthdayCompleted = Boolean(user?.birthDate);
  const active = wallets.filter((w) => !w.paused);

  const promotions = active
    .map((w) => w.activePromotion)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => Number(b.isActiveNow) - Number(a.isActiveNow));

  // D3: birthday gifts only where the user already has a wallet.
  const birthdayBrands = active
    .filter((w) => w.hasWallet && w.brand.birthdayBonusPoints > 0)
    .map((w) => w.brand.name);
  // A2: invitations pay out at brands with a referral bonus.
  const referralBrands = active.filter((w) => w.brand.referralBonusPoints > 0).map((w) => w.brand.name);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchUser(), refresh({ maxAgeMs: 0 })]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchUser, refresh]);

  const handleBirthdayCompleted = async () => {
    setBirthdayVisible(false);
    await refetchUser();
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      >
        <View className="px-6 mb-3 mt-2">
          <LText size={22} weight="700" accessibilityRole="header">
            {t('Tasks.title')}
          </LText>
          <LText size={16} color={COLORS.secondary}>
            {t('Tasks.subtitle')}
          </LText>
        </View>

        <QuestCard
          title={t('Tasks.referralTitle')}
          description={t('Tasks.referralDescription')}
          details={[referralBrands.length ? t('Tasks.referralWhere', { brands: referralBrands.join(', ') }) : null]}
          iconName="people-outline"
          onPress={() => setReferralVisible(true)}
        />

        <QuestCard
          title={t('Tasks.birthdayTitle')}
          description={birthdayCompleted ? t('Tasks.birthdayCompleted') : t('Tasks.birthdayDescription')}
          details={[
            birthdayBrands.length ? t('Tasks.birthdayFrom', { brands: birthdayBrands.join(', ') }) : null,
            birthdayCompleted ? null : t('Tasks.birthdayNote30'),
          ]}
          iconName="balloon-outline"
          completed={birthdayCompleted}
          onPress={birthdayCompleted ? undefined : () => setBirthdayVisible(true)}
        />

        {promotions.length > 0 ? (
          <>
            <SectionTitle text={t('Tasks.promotionsTitle')} />
            {promotions.map((p) => (
              <BrandPromotionBanner key={p.taskId} promotion={p} showBrand />
            ))}
          </>
        ) : null}
      </ScrollView>

      <ReferralQuestModal
        visible={referralVisible}
        onClose={() => setReferralVisible(false)}
      />
      <BirthdayQuestModal
        visible={birthdayVisible}
        onClose={() => setBirthdayVisible(false)}
        onCompleted={handleBirthdayCompleted}
      />
    </>
  );
};
