import React, { useState } from 'react';
import { View } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { Image } from '@/components/atoms/Image';
import { LoadingState } from '@/components/atoms/LoadingState';
import { useTranslation } from 'react-i18next';
import { useActivityTimeline } from '@/hooks/useActivityTimeline';
import { formatTimeAgo, getActivityTypeIcon, getActivityTypeColor, getDisplayAmount } from '@/utils/activityUtils';

interface PointsHistorySectionProps {}

export const PointsHistorySection = () => {
  const { t } = useTranslation();
  const { data: activities, loading } = useActivityTimeline();
  const [visibleCount, setVisibleCount] = useState(3);

  const displayedActivities = activities?.slice(0, visibleCount) || [];
  const hasMore = activities && activities.length > visibleCount;

  const handleSeeMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  if (loading) {
    return <LoadingState title={t('Profile.lastActivity')} className="px-6 mb-6" />;
  }

  return (
    <View className="px-6 mb-6">
      <Typography variant="body-lg-bold" className="mb-4">
        {t('Profile.lastActivity')}
      </Typography>

      <View className="relative">
        {displayedActivities.map((activity, index) => (
          <View key={activity.id} className="relative">
            <View className="flex-row items-start mb-3">
              <Typography 
                className="text-lg z-10"
                style={{ color: getActivityTypeColor(activity.type, activity.direction) }}
              >
                {getActivityTypeIcon(activity.type, activity.direction)}
              </Typography>
              
              <View className="w-10 ml-1 mt-0.5">
                <Typography variant="body-base-bold" className="text-right">
                  {getDisplayAmount(activity.pointsAmount, activity.stampsAmount)}
                </Typography>
              </View>
              
              <View className="flex-1 ml-4">
                <Typography variant="body-small-regular" className="text-gray-900">
                  {activity.title}
                </Typography>
                <Typography variant="body-small-regular" className="text-gray-500">
                  {formatTimeAgo(activity.timeAgoMinutes)}
                </Typography>
              </View>
              
              {activity.merchant?.logoUrl && (
                <View className="w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    url={activity.merchant.logoUrl}
                    className="w-full h-full"
                    resizeMode="cover"
                    fallbackWidth={22}
                    fallbackHeight={22}
                    fallbackLogoSize={4}
                  />
                </View>
              )}
            </View>
            
            {index < displayedActivities.length - 1 && (
              <View className="absolute left-2 w-px h-6 bg-gray-300 top-8" />
            )}
          </View>
        ))}
        
      </View>

      {hasMore && (
        <View className="relative">
          <View className="absolute left-2 w-px h-6 bg-gray-300 -top-6" />
          <Button 
            title={t('Profile.seeMore')}
            onPress={handleSeeMore}
            variant="ghost"
            textVariant="body-small-semibold"
            height={30}
            width={123}
            className="mt-2"
          />
        </View>
      )}
    </View>
  );
};