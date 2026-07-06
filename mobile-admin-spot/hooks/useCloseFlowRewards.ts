import type { CarouselRewardItem } from "@/components/molecules/RewardCarousel/types";
import type { CloseInterceptor } from "@/components/organisms/ScannedRewardPanel/types";
import { useRedeemReward } from "@/hooks/graphql/mutations/useRedeemReward";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import React, { useCallback, useEffect, useState } from "react";

type UseCloseFlowRewardsProps = {
    carouselRewards: (CarouselRewardItem & { claimedId: string })[];
    onClose: () => void;
    onBeforeCloseRef: React.RefObject<CloseInterceptor>;
};

export const useCloseFlowRewards = ({ carouselRewards, onClose, onBeforeCloseRef }: UseCloseFlowRewardsProps) => {
    const { selectedScanStoreId, stores } = useOperatorAccess();
    const storeId = effectiveScanStoreId(selectedScanStoreId, stores) ?? "";
    const [redeemReward, { loading: redeemingReward }] = useRedeemReward();
    const [closeFlowRewards, setCloseFlowRewards] = useState<(CarouselRewardItem & { claimedId: string })[]>([]);
    const [closeFlowIndex, setCloseFlowIndex] = useState(0);
    const closeFlowReward = closeFlowRewards[closeFlowIndex] ?? null;
    const closeFlowActiveRef = React.useRef(false);

    const advanceCloseFlow = useCallback(() => {
        const nextIndex = closeFlowIndex + 1;
        if (nextIndex < closeFlowRewards.length) {
            setCloseFlowIndex(nextIndex);
        } else {
            setCloseFlowRewards([]);
            setCloseFlowIndex(0);
            onClose();
        }
    }, [closeFlowIndex, closeFlowRewards.length, onClose]);

    const handleCloseFlowConfirm = async () => {
        if (!closeFlowReward) return;
        await redeemReward({
            variables: { userRewardId: closeFlowReward.claimedId, storeId },
        });
        advanceCloseFlow();
    };

    const handleCloseFlowDecline = useCallback(() => {
        advanceCloseFlow();
    }, [advanceCloseFlow]);

    useEffect(() => {
        onBeforeCloseRef.current = () => {
            if (closeFlowActiveRef.current) return false;
            if (carouselRewards.length > 0) {
                closeFlowActiveRef.current = true;
                setCloseFlowRewards(carouselRewards);
                setCloseFlowIndex(0);
                return true;
            }
            return false;
        };
        return () => {
            onBeforeCloseRef.current = null;
        };
    }, [carouselRewards, onBeforeCloseRef]);

    return {
        closeFlowReward,
        redeemingReward,
        handleCloseFlowConfirm,
        handleCloseFlowDecline,
    };
};
