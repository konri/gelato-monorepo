import { Typography } from "@/components/atoms/Typography";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { CenteredModal } from "@/components/molecules/Modal/CenteredModal";
import { RewardCard } from "@/components/molecules/RewardCard";
import { TwoButtonFooter } from "@/components/molecules/TwoButtonFooter";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import type { RedeemRewardModalProps } from "./types";

export const RedeemRewardModal = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
  rewardTitle,
  rewardCost,
  stampsLabel,
  imageUrl,
  logoUrl,
  showMilestoneResetInfoBanner = false,
}: RedeemRewardModalProps) => {
  const { t } = useTranslation();

  return (
    <CenteredModal visible={visible} onClose={onClose} size="md">
      <View className="px-4 pt-6 pb-4 gap-4 items-center">
        <Typography
          variant="text-16-bold"
          className="text-blue-900 text-center"
        >
          {t("Rewards.rewardActivatedTitle")}
        </Typography>

        <View className="items-center justify-center">
          <RewardCard
            title={rewardTitle}
            cost={rewardCost}
            stampsLabel={stampsLabel}
            imageUrl={imageUrl ?? undefined}
            logoUrl={logoUrl ?? undefined}
          />
        </View>

        <Typography
          variant="text-16-regular-spaced"
          className="text-black text-center"
        >
          {t("Rewards.redeemConfirmQuestion")}
        </Typography>
        {showMilestoneResetInfoBanner && (
          <InfoBanner text={t("Rewards.redeemMilestoneResetInfo")} />
        )}

        {isLoading ? (
          <ActivityIndicator size="small" color="#1A4196" />
        ) : (
          <View className="w-full pt-2">
            <TwoButtonFooter
              containerClassName="flex-row gap-3"
              leftButton={{
                title: t("Rewards.redeemDecline"),
                onPress: onClose,
                variant: "outlineSecondary",
                size: "sm",
              }}
              rightButton={{
                title: t("Rewards.redeemConfirm"),
                onPress: onConfirm,
                variant: "primary",
                size: "sm",
              }}
            />
          </View>
        )}
      </View>
    </CenteredModal>
  );
};
