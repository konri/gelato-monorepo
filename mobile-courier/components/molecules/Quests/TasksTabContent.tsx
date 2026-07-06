import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/atoms/Typography';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { QuestCard } from './QuestCard';
import { ReferralQuestModal } from './ReferralQuestModal';
import { BirthdayQuestModal } from './BirthdayQuestModal';

export const TasksTabContent = () => {
  const { t } = useTranslation();
  const { data: user, refetch: refetchUser } = useWhoAmI();
  const [refreshing, setRefreshing] = useState(false);
  const [referralVisible, setReferralVisible] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);

  const birthdayCompleted = Boolean(user?.birthDate);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchUser();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBirthdayCompleted = async () => {
    setBirthdayVisible(false);
    await refetchUser();
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8, paddingTop: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EC2828"
            colors={['#EC2828']}
          />
        }
      >
        <View className="px-6 mb-4">
          <Typography variant="body-lg-bold" className="text-text-primary mb-1">
            {t('Tasks.title')}
          </Typography>
          <Typography variant="body-small-regular" className="text-gray-600">
            {t('Tasks.subtitle')}
          </Typography>
        </View>

        {/* Default quest 1: referral */}
        <QuestCard
          points={500}
          title={t('Tasks.referralTitle')}
          description={t('Tasks.referralDescription')}
          iconName="people-outline"
          onPress={() => setReferralVisible(true)}
        />

        {/* Default quest 2: birthday */}
        <QuestCard
          points={700}
          title={t('Tasks.birthdayTitle')}
          description={
            birthdayCompleted
              ? t('Tasks.birthdayCompleted')
              : t('Tasks.birthdayDescription')
          }
          iconName="gift-outline"
          completed={birthdayCompleted}
          onPress={birthdayCompleted ? undefined : () => setBirthdayVisible(true)}
        />
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
