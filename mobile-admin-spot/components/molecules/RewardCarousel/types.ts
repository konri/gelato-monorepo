export type CarouselRewardItem = {
    id: string;
    rewardId?: string;
    milestoneId?: string;
    cardId?: string;
    title: string;
    cost: number;
    imageUrl?: string | null;
    logoUrl?: string;
    isMilestone?: boolean;
    resetStampsOnMilestoneClaim?: boolean;
};

export type RewardCarouselProps = {
    rewards: CarouselRewardItem[];
    stampsLabel: string;
    title: string;
    defaultExpanded?: boolean;
    onRewardPress?: (reward: CarouselRewardItem) => void;
};
