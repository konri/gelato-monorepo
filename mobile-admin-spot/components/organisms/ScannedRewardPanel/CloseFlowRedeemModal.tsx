import { RedeemRewardModal } from "@/components/molecules/RedeemRewardModal";
import type { CarouselRewardItem } from "@/components/molecules/RewardCarousel/types";
import type { CloseInterceptor } from "@/components/organisms/ScannedRewardPanel/types";
import { useCloseFlowRewards } from "@/hooks/useCloseFlowRewards";
import React from "react";
import { useTranslation } from "react-i18next";

type CloseFlowRedeemModalProps = {
    carouselRewards: (CarouselRewardItem & { claimedId: string })[];
    onClose: () => void;
    onBeforeCloseRef: React.RefObject<CloseInterceptor>;
};

export const CloseFlowRedeemModal = ({ carouselRewards, onClose, onBeforeCloseRef }: CloseFlowRedeemModalProps) => {
    const { t } = useTranslation();
    const { closeFlowReward, redeemingReward, handleCloseFlowConfirm, handleCloseFlowDecline } =
        useCloseFlowRewards({ carouselRewards, onClose, onBeforeCloseRef });

    if (!closeFlowReward) return null;

    return (
        <RedeemRewardModal
            visible={!!closeFlowReward}
            onClose={handleCloseFlowDecline}
            onConfirm={handleCloseFlowConfirm}
            isLoading={redeemingReward}
            rewardTitle={closeFlowReward.title}
            rewardCost={closeFlowReward.cost}
            stampsLabel={t("Rewards.stamps")}
            imageUrl={closeFlowReward.imageUrl}
            logoUrl={closeFlowReward.logoUrl}
            showMilestoneResetInfoBanner={
                Boolean(closeFlowReward.isMilestone) &&
                Boolean(closeFlowReward.resetStampsOnMilestoneClaim)
            }
        />
    );
};
