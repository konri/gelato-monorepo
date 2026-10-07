import { COLORS, LText, PrimaryButton, SecondaryButton } from '@/components/molecules/Loyalty/ui';
import { redeemPrize } from '@/shared/api-client/src/graphql/mutations/prize';
import type { UserPrize } from '@/shared/api-client/src/graphql/queries/prizes/types';
import type { GraphQLError } from '@/shared/api-client/src/graphql/types';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { pointsText } from '@/utils/formatPoints';
import { newRequestId } from '@/utils/requestId';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { TFunction } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  reward: { id: string; title: string; pointsCost: number };
  brandName: string;
  /** The points of the reward's brand right now. */
  points: number;
  onSuccess: (claimed: UserPrize) => void;
  /** A domain error that needs fresh data (wallet or stock changed). */
  onStale?: () => void;
};

type Failure = { message: string; final: boolean };

/** Maps the claim's error codes (CONTRACTS §4) to a sentence for the user. */
export const claimFailure = (t: TFunction, error: GraphQLError | null, brandName: string): Failure => {
  const code = error?.code;
  const ext = (error?.extensions ?? {}) as Record<string, unknown>;
  if (code === 'INSUFFICIENT_POINTS') {
    const missing = Number(ext.missingPoints);
    return {
      message: Number.isFinite(missing) && missing > 0
        ? t('Prizes.errorInsufficient', { count: missing, brand: brandName })
        : t('Prizes.errorInsufficientPlain', { brand: brandName }),
      final: true,
    };
  }
  if (code === 'REWARD_UNAVAILABLE') {
    return {
      message: ext.reason === 'OUT_OF_STOCK' ? t('Prizes.errorOutOfStock') : t('Prizes.errorUnavailable'),
      final: true,
    };
  }
  if (code === 'BRAND_INACTIVE') {
    return { message: t('Brand.pausedTitle', { brand: brandName }), final: true };
  }
  return { message: t('Prizes.errorGeneric'), final: false };
};

/**
 * "Get this reward?" (BRANDS_SPEC §5.5): what it costs at which brand, what
 * is left, and the 7-day pick-up window. One `requestId` per opening of the
 * sheet: a retry after a network error reuses it, so the server never claims
 * twice.
 */
export function ConfirmRedeemSheet({ visible, onClose, reward, brandName, points, onSuccess, onStale }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const requestId = useRef<string>(newRequestId());
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    if (visible) {
      requestId.current = newRequestId();
      setFailure(null);
      setSubmitting(false);
    }
  }, [visible]);

  const left = Math.max(0, points - reward.pointsCost);

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setFailure(null);
    const token = (await safeGetItem('access_token')) ?? undefined;
    const res = await redeemPrize(reward.id, requestId.current, { token });
    if (res.success && res.data) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(res.data);
      return;
    }
    const f = claimFailure(t, res.error, brandName);
    setFailure(f);
    setSubmitting(false);
    AccessibilityInfo.announceForAccessibility(f.message);
    if (f.final) onStale?.();
  };

  const close = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      {!visible ? null : (
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <Pressable className="flex-1" onPress={close} accessibilityRole="button" accessibilityLabel={t('Prizes.notNow')} />
          <View
            className="rounded-t-3xl bg-white px-5 pt-5"
            style={{ paddingBottom: insets.bottom + 16 }}
            accessibilityViewIsModal
          >
            <LText size={26} lineHeight={32} weight="700" accessibilityRole="header" max={1.3}>
              {t('Prizes.confirmTitle')}
            </LText>
            <LText size={20} weight="700" className="mt-3">
              {t('Prizes.confirmWhat', { reward: reward.title, brand: brandName, costText: pointsText(t, reward.pointsCost) })}
            </LText>
            <LText size={18} className="mt-2" color="#374151">
              {t('Prizes.confirmLeft', { leftText: pointsText(t, left) })}
            </LText>
            <LText size={18} className="mt-2" color="#374151">
              {t('Prizes.confirmPickup', { brand: brandName })}
            </LText>

            {failure ? (
              <View className="mt-4 flex-row items-start rounded-2xl bg-red-50 p-3" accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={22} color={COLORS.red} style={{ marginTop: 1 }} />
                <LText size={18} weight="600" color={COLORS.red} className="ml-2 flex-1">
                  {failure.message}
                </LText>
              </View>
            ) : null}

            <View className="mt-5">
              {failure?.final ? (
                <PrimaryButton label={t('Loyalty.close')} onPress={onClose} />
              ) : (
                <PrimaryButton
                  label={failure ? t('Loyalty.retry') : t('Prizes.confirmYes')}
                  icon={failure ? 'refresh' : 'gift'}
                  loading={submitting}
                  onPress={() => void confirm()}
                />
              )}
            </View>
            {failure?.final ? null : (
              <View className="mt-3">
                <SecondaryButton label={t('Prizes.notNow')} onPress={close} disabled={submitting} />
              </View>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
}
