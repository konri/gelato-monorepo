import { ClientStampCardSection } from "@/components/molecules/ClientStampCardSection";
import type { UserStampCard } from "@/shared/api-client/src/graphql/queries/rewards";
import {
  getAmountPerStampThreshold,
  stampMinimumAmountDisplay,
} from "@/utils/stampTemplateAward";
import React from "react";
import { useTranslation } from "react-i18next";

type StampCardSlideProps = {
  card: UserStampCard;
  isNewest: boolean;
  stampCount: number;
  onStampCountChange: (count: number) => void;
  onAddStamp: (count: number) => Promise<boolean>;
  isAddingStamp: boolean;
  onSpentAmountFocus?: () => void;
  onSpentAmountBlur?: () => void;
};

const getNextMilestone = (card: UserStampCard) => {
  const milestones = card.template?.milestones;
  if (!milestones || milestones.length === 0) return null;

  const sorted = [...milestones].sort(
    (a, b) => (a.stampsRequired ?? 0) - (b.stampsRequired ?? 0),
  );

  const next = sorted.find(
    (m) => m.stampsRequired !== undefined && m.stampsRequired > card.stampsCollected,
  );

  return next ?? sorted[sorted.length - 1];
};

export const StampCardSlide = ({
  card,
  isNewest,
  stampCount,
  onStampCountChange,
  onAddStamp,
  isAddingStamp,
  onSpentAmountFocus,
  onSpentAmountBlur,
}: StampCardSlideProps) => {
  const { t } = useTranslation();
  const nextMilestone = getNextMilestone(card);
  const progressLabel = `${card.stampsCollected}/${card.stampsRequired}`;
  const template = card.template;
  const isAmountAward = template?.awardType === "amount";
  const minimumAmountLabel = isAmountAward
    ? stampMinimumAmountDisplay(template?.minimumAmount)
    : "";
  const amountPerStamp = isAmountAward
    ? getAmountPerStampThreshold(minimumAmountLabel)
    : undefined;
  const useAmountFlow = isAmountAward && amountPerStamp !== undefined;

  const rateText = useAmountFlow
    ? t("Loyalty.stampCardRateDynamic", { amount: minimumAmountLabel })
    : t("Loyalty.stampCardRateVisit");

  const stampCardProps = {
    title: template?.title ?? "",
    progress: progressLabel,
    description: template?.rewardTitle || "",
    rateText,
    totalStamps: card.stampsRequired,
    filledStamps: card.stampsCollected,
    milestoneStampsRequired: nextMilestone?.stampsRequired,
    milestoneTitle: nextMilestone?.title,
  };

  if (useAmountFlow && amountPerStamp !== undefined) {
    return (
      <ClientStampCardSection
        stampAwardMode="amount"
        title={t("Rewards.clientStampCard")}
        progressLabel={progressLabel}
        stampCardProps={stampCardProps}
        onAddStamp={onAddStamp}
        assignStampsLabel={t("Rewards.assignStamps")}
        isAddingStamp={isAddingStamp}
        readOnly={!isNewest}
        amountPerStamp={amountPerStamp}
        spentAmountPlaceholder={minimumAmountLabel}
        onSpentAmountFocus={onSpentAmountFocus}
        onSpentAmountBlur={onSpentAmountBlur}
      />
    );
  }

  return (
    <ClientStampCardSection
      stampAwardMode="visit"
      title={t("Rewards.clientStampCard")}
      progressLabel={progressLabel}
      stampCardProps={stampCardProps}
      stampCount={stampCount}
      onStampCountChange={onStampCountChange}
      onAddStamp={onAddStamp}
      addStampLabel={t("Rewards.addStampsCta", { count: stampCount })}
      assignStampsLabel={t("Rewards.assignStamps")}
      isAddingStamp={isAddingStamp}
      readOnly={!isNewest}
    />
  );
};
