import { Typography } from '@/components/atoms/Typography';
import { useNewsFeed } from '@/hooks/useNews';
import { router } from 'expo-router';
import React, { forwardRef, useImperativeHandle } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NewsCard } from './NewsCard';

export interface NewsFeedHandle {
  reload: () => Promise<void>;
}

const timeAgo = (iso?: string | null): string | undefined => {
  if (!iso) return undefined;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const NewsFeed = forwardRef<NewsFeedHandle>((_props, ref) => {
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
          No news available at the moment
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
          timestamp={timeAgo(item.publishedAt ?? item.createdAt)}
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
