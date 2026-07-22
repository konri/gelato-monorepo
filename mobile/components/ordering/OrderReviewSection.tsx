import { StarRating } from '@/components/atoms/StarRating';
import { createReview, getMyReview } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

type Props = {
  orderId: string;
  /** Only delivered orders can be reviewed. */
  delivered: boolean;
  /** Whether the order had a courier (show the courier-rating row). */
  hasCourier: boolean;
};

/**
 * Post-delivery review prompt shown on the order-tracking screen. Fetches any
 * existing review; if none and the order is delivered, shows a "rate this
 * order" card that opens the rating modal (spot + optional courier + comment).
 */
export function OrderReviewSection({ orderId, delivered, hasCourier }: Props) {
  const { t } = useTranslation();
  const [reviewed, setReviewed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!delivered) {
      setReviewed(false);
      return;
    }
    (async () => {
      const token = (await safeGetItem('access_token')) ?? undefined;
      const res = await getMyReview(orderId, { token });
      if (active) setReviewed(!!res.data);
    })();
    return () => {
      active = false;
    };
  }, [orderId, delivered]);

  if (!delivered || reviewed === null) return null;

  if (reviewed) {
    return (
      <View className="mt-4 flex-row items-center justify-center rounded-2xl bg-green-50 py-3">
        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
        <Text className="ml-2 font-urbanist-semibold" style={{ color: '#15803D' }}>
          {t('Review.thanks')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="mt-4 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
      >
        <View className="flex-1">
          <Text className="font-urbanist-bold text-text-primary">{t('Review.rateTitle')}</Text>
          <Text className="mt-0.5 font-urbanist text-text-secondary">{t('Review.rateSubtitle')}</Text>
        </View>
        <StarRating rating={0} size={20} />
      </Pressable>
      {open && (
        <ReviewModal
          orderId={orderId}
          hasCourier={hasCourier}
          onClose={() => setOpen(false)}
          onDone={() => {
            setReviewed(true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

const ReviewModal = ({
  orderId,
  hasCourier,
  onClose,
  onDone,
}: {
  orderId: string;
  hasCourier: boolean;
  onClose: () => void;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const [spotRating, setSpotRating] = useState(0);
  const [courierRating, setCourierRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (spotRating < 1) {
      setError(t('Review.pickSpotRating'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = (await safeGetItem('access_token')) ?? undefined;
      // Overall = spot rating, or the average of spot + courier when both given.
      const overall =
        hasCourier && courierRating > 0
          ? Math.round((spotRating + courierRating) / 2)
          : spotRating;
      const res = await createReview(
        {
          orderId,
          spotRating,
          overallRating: overall,
          courierRating: hasCourier && courierRating > 0 ? courierRating : undefined,
          comment: comment.trim() || undefined,
        },
        { token },
      );
      if (res.error) throw new Error(res.error.message);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white p-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-urbanist-bold text-text-primary">{t('Review.modalTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          <Text className="mb-1 font-urbanist-semibold text-text-primary">{t('Review.spotRating')}</Text>
          <StarRating rating={spotRating} onChange={setSpotRating} size={32} />

          {hasCourier && (
            <>
              <Text className="mb-1 mt-4 font-urbanist-semibold text-text-primary">
                {t('Review.courierRating')}
              </Text>
              <StarRating rating={courierRating} onChange={setCourierRating} size={32} />
            </>
          )}

          <Text className="mb-1 mt-4 font-urbanist-semibold text-text-primary">{t('Review.comment')}</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('Review.commentPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            className="rounded-xl border border-gray-300 px-4 py-3"
            style={{ minHeight: 80, textAlignVertical: 'top', fontFamily: 'Urbanist' }}
          />

          {error && (
            <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
              <Text className="font-urbanist text-red-700">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={submit}
            disabled={submitting}
            className="mt-4 items-center rounded-2xl py-4"
            style={{ backgroundColor: submitting ? '#F4A3A3' : '#EC2828' }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-urbanist-bold text-white">{t('Review.submit')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
