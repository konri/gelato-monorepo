import { useGetAvailableRewards } from "@/hooks/graphql/queries/useGetAvailableRewards";
import { useGetUserClaimedRewards } from "@/hooks/graphql/queries/useGetUserClaimedRewards";
import { useGetUserStampCards } from "@/hooks/graphql/queries/useGetUserStampCards";
import { isAccessDeniedLikeError } from "@/utils/apolloError";
import { useMemo } from "react";

type UseRewardPanelDataProps = {
    userId: string;
    merchantLogoUrl?: string | null;
};

export const useRewardPanelData = ({ userId, merchantLogoUrl }: UseRewardPanelDataProps) => {
  const {
    data: availableRewardsData,
    dataState: availableRewardsDataState,
    loading: availableRewardsLoading,
    error: availableRewardsError,
  } = useGetAvailableRewards({ userId });

  const {
    data: stampCardsData,
    dataState: stampCardsDataState,
    loading: stampCardsLoading,
    error: stampCardsError,
  } = useGetUserStampCards({ userId });

  const {
    data: claimedRewardsData,
    dataState: claimedRewardsDataState,
    loading: claimedRewardsLoading,
    error: claimedRewardsError,
  } = useGetUserClaimedRewards({ userId });

  const stampCards = useMemo(() => {
    const cards =
      stampCardsDataState === "complete" ? (stampCardsData?.getUserStampCards ?? []) : [];
    return [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [stampCardsData?.getUserStampCards, stampCardsDataState]);

  const logo = merchantLogoUrl ?? undefined;
  const resetStampsByCardId = useMemo(
    () =>
      new Map(
        stampCards.map((card) => [
          card.id,
          Boolean(card.template?.resetStampsOnMilestoneClaim),
        ]),
      ),
    [stampCards],
  );

  const carouselRewards = useMemo(() => {
    const allClaimed =
      claimedRewardsDataState === "complete"
        ? (claimedRewardsData?.getUserClaimedRewards ?? [])
        : [];
    return allClaimed
      .filter((claimedReward) => !claimedReward.isRedeemed)
      .map((claimedReward) => {
        const card = stampCards.find((stampCard) => stampCard.id === claimedReward.cardId);
        const resetFromClaimedCard = card?.template?.resetStampsOnMilestoneClaim;
        const resetStampsOnMilestoneClaim =
          typeof resetFromClaimedCard === "boolean"
            ? resetFromClaimedCard
            : (resetStampsByCardId.get(claimedReward.cardId ?? "") ?? false);
        const milestone = card?.template?.milestones?.find(
          (item) => item.id === claimedReward.milestoneId,
        );
        const isMilestone = claimedReward.source === "STAMP_MILESTONE";

        return {
          id: claimedReward.id,
          claimedId: claimedReward.id,
          title: claimedReward.title,
          cost: milestone?.stampsRequired ?? card?.stampsRequired ?? 0,
          imageUrl: null,
          logoUrl: logo,
          isMilestone,
          resetStampsOnMilestoneClaim,
        };
      });
  }, [
    claimedRewardsData?.getUserClaimedRewards,
    claimedRewardsDataState,
    logo,
    resetStampsByCardId,
    stampCards,
  ]);

  const availableRewards = useMemo(() => {
    const rewards =
      availableRewardsDataState === "complete"
        ? (availableRewardsData?.getAvailableRewards ?? [])
        : [];
    return rewards
      .filter((reward) => reward.canClaim)
      .map((reward) => {
        const card = stampCards.find((stampCard) => stampCard.id === reward.cardId);
        const resetStampsOnMilestoneClaim = Boolean(card?.template?.resetStampsOnMilestoneClaim);
        const isMilestone = reward.source === "STAMP_MILESTONE";

        return {
          id: reward.id,
          rewardId: reward.rewardId ?? undefined,
          milestoneId: reward.milestoneId ?? undefined,
          cardId: reward.cardId ?? undefined,
          title: reward.title,
          cost: reward.stampsRequired ?? reward.dayThreshold ?? card?.stampsRequired ?? 0,
          imageUrl: null,
          logoUrl: logo,
          isMilestone,
          resetStampsOnMilestoneClaim,
        };
      });
  }, [availableRewardsData?.getAvailableRewards, availableRewardsDataState, stampCards, logo]);

  const rewardErrors = [
    availableRewardsError,
    stampCardsError,
    claimedRewardsError,
  ].filter((e): e is NonNullable<typeof e> => e != null);

  const hasError = rewardErrors.some((e) => !isAccessDeniedLikeError(e));

  return {
    stampCards,
    carouselRewards,
    availableRewards,
    isLoading: availableRewardsLoading || stampCardsLoading || claimedRewardsLoading,
    hasError,
  };
};
