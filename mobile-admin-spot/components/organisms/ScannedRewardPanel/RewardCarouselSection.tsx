import { RedeemRewardModal } from "@/components/molecules/RedeemRewardModal";
import { RewardCarousel } from "@/components/molecules/RewardCarousel";
import type { CarouselRewardItem } from "@/components/molecules/RewardCarousel/types";
import { useRedeemFlow } from "@/hooks/useRedeemFlow";
import React from "react";
import { useTranslation } from "react-i18next";

type RewardCarouselSectionProps = {
    userId: string;
    rewards: CarouselRewardItem[];
    title: string;
    defaultExpanded?: boolean;
    claimBeforeRedeem?: boolean;
};

export const RewardCarouselSection = ({
    userId,
    rewards,
    title,
    defaultExpanded,
    claimBeforeRedeem,
}: RewardCarouselSectionProps) => {
    const { t } = useTranslation();
    const { selectedReward, redeemingReward, handleOpenRedeemModal, handleCloseRedeemModal, handleConfirmRedeem } =
        useRedeemFlow({ userId, claimBeforeRedeem });

    return (
        <>
            <RewardCarousel
                rewards={rewards}
                stampsLabel={t("Rewards.stamps")}
                title={title}
                defaultExpanded={defaultExpanded}
                onRewardPress={handleOpenRedeemModal}
            />

            {selectedReward && (
                <RedeemRewardModal
                    visible={!!selectedReward}
                    onClose={handleCloseRedeemModal}
                    onConfirm={handleConfirmRedeem}
                    isLoading={redeemingReward}
                    rewardTitle={selectedReward.title}
                    rewardCost={selectedReward.cost}
                    stampsLabel={t("Rewards.stamps")}
                    imageUrl={selectedReward.imageUrl}
                    logoUrl={selectedReward.logoUrl}
                    showMilestoneResetInfoBanner={
                        Boolean(selectedReward.isMilestone) &&
                        Boolean(selectedReward.resetStampsOnMilestoneClaim)
                    }
                />
            )}
        </>
    );
};
