import { StarRating } from '@/components/atoms/StarRating';
import { getSpotReviews, type PublicReview } from '@repo/api-client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

/**
 * Public reviews list for a spot (client spot page). Read-only; renders nothing
 * until at least one commented review exists.
 */
export function SpotReviews({ spotId }: { spotId: string }) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getSpotReviews(spotId, 20);
      if (active) setReviews(res.data ?? []);
    })();
    return () => {
      active = false;
    };
  }, [spotId]);

  if (reviews.length === 0) return null;

  const fmt = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <View className="mt-6">
      <Text className="font-urbanist-bold text-text-primary mb-3">{t('Review.reviewsTitle')}</Text>
      {reviews.map((r) => (
        <View key={r.id} className="bg-background-secondary rounded-2xl p-4 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-urbanist-bold text-text-primary">{r.authorName}</Text>
            <Text className="text-xs font-urbanist text-text-secondary">{fmt(r.createdAt)}</Text>
          </View>
          <View className="mt-1">
            <StarRating rating={r.rating} size={14} />
          </View>
          {r.comment ? (
            <Text className="mt-2 font-urbanist text-text-secondary">{r.comment}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
