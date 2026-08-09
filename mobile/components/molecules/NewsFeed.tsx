import { Typography } from '@/components/atoms/Typography';
import { useNewsFeed } from '@/hooks/useNews';
import { router } from 'expo-router';
import React, { forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { NewsCard } from './NewsCard';
import type { TFunction } from 'i18next';

export interface NewsFeedHandle {
  reload: () => Promise<void>;
}

const timeAgo = (t: TFunction, iso?: string | null): string | undefined => {
  if (!iso) return undefined;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('News.justNow');
  if (mins < 60) return t('News.minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('News.hoursAgo', { count: hrs });
  const days = Math.floor(hrs / 24);
  return t('News.daysAgo', { count: days });
};

export const NewsFeed = forwardRef<NewsFeedHandle>((_props, ref) => {
  const { t } = useTranslation();
  const { news, loading, refetch, toggleLike } = useNewsFeed();

  useImperativeHandle(ref, () => ({ reload: refetch }));

  if (loading) {
    return (
      <View className="px-6 py-8 items-center">
        <ActivityIndicator color="#EC2828" />
      </View>
    );
  }

  if (news.length === 0) {
    return (
      <View className="px-6 py-8 items-center">
        <Typography variant="body-base-regular" className="text-gray-500 text-center">
          {t('News.empty')}
        </Typography>
      </View>
    );
  }

  return (
    <View>
      {news.map((item) => (
        <NewsCard
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          imageUrls={item.images}
          storeName={item.spot?.name}
          storeLogoUrl={item.spot?.logoUrl ?? undefined}
          timestamp={timeAgo(t, item.publishedAt ?? item.createdAt)}
          likes={item.likesCount}
          isLiked={item.isLiked}
          commentsCount={item.commentsCount}
          onLike={() => toggleLike(item.id)}
          onComment={() => router.push(`/news_comments/${item.id}`)}
        />
      ))}
    </View>
  );
});

NewsFeed.displayName = 'NewsFeed';
