import type { CarouselRewardItem } from "@/components/molecules/RewardCarousel/types";
import { useClaimReward } from "@/hooks/graphql/mutations/useClaimReward";
import { useRedeemReward } from "@/hooks/graphql/mutations/useRedeemReward";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import {
    GET_AVAILABLE_REWARDS_QUERY,
    GET_USER_STAMP_CARDS_QUERY,
    GET_USER_CLAIMED_REWARDS_QUERY,
    MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useCallback, useState } from "react";

type UseRedeemFlowOptions = {
    userId: string;
    claimBeforeRedeem?: boolean;
};

export const useRedeemFlow = ({ userId, claimBeforeRedeem = false }: UseRedeemFlowOptions) => {
    const { selectedStoreId } = useOperatorAccess();
    const storeId = selectedStoreId ?? "";
    const [claimReward, { loading: claimingReward }] = useClaimReward();
    const [redeemReward, { loading: redeemingReward }] = useRedeemReward();
    const [selectedReward, setSelectedReward] = useState<CarouselRewardItem | null>(null);

    const handleOpenRedeemModal = useCallback((reward: CarouselRewardItem) => {
        setSelectedReward(reward);
    }, []);

    const handleCloseRedeemModal = useCallback(() => {
        setSelectedReward(null);
    }, []);

    const handleConfirmRedeem = async () => {
        if (!selectedReward) return;

        const refetchQueries = [
            { query: MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY },
            { query: GET_AVAILABLE_REWARDS_QUERY, variables: { userId } },
            { query: GET_USER_CLAIMED_REWARDS_QUERY, variables: { userId } },
            { query: GET_USER_STAMP_CARDS_QUERY, variables: { userId } },
        ];

        try {
            if (claimBeforeRedeem) {
                const claimResult = await claimReward({
                    variables: {
                        userRewardId: selectedReward.id,
                        storeId,
                    },
                    awaitRefetchQueries: true,
                    refetchQueries,
                });

                const claimedRewardId = claimResult.data?.claimUserReward?.id;
                if (!claimedRewardId) return;

                await redeemReward({
                    variables: { userRewardId: claimedRewardId, storeId },
                    awaitRefetchQueries: true,
                    refetchQueries,
                });
            } else {
                await redeemReward({
                    variables: { userRewardId: selectedReward.id, storeId },
                    awaitRefetchQueries: true,
                    refetchQueries,
                });
            }
        } catch {
            return;
        }

        handleCloseRedeemModal();
    };

    return {
        selectedReward,
        redeemingReward: claimingReward || redeemingReward,
        handleOpenRedeemModal,
        handleCloseRedeemModal,
        handleConfirmRedeem,
    };
};
