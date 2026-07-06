import { LoyaltyButton } from "@/components/atoms/LoyaltyButton";
import { Typography } from "@/components/atoms/Typography";
import { shadows } from "@/constants/shadows";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type LoyaltyProgramSectionProps = {
  title: string;
  buttonText: string;
  onButtonPress: () => void;
  buttonDisabled?: boolean;
  infoText?: string;
  secondInfoText?: string;
  exampleCard?: React.ReactNode;
};

export const LoyaltyProgramSection = ({
  title,
  buttonText,
  onButtonPress,
  buttonDisabled = false,
  infoText,
  secondInfoText,
  exampleCard,
}: LoyaltyProgramSectionProps) => {
  const { t } = useTranslation();

  return (
    <View className="gap-4 w-full">
      <Typography
        variant="text-18-black-spaced-lineHeight-22"
        className="text-black text-center"
      >
        {title}
      </Typography>

      <View className="w-full">
        <View className="relative">
          <View className="gap-2 px-6 pt-3 pb-0 overflow-visible">
            <View
              className="bg-white rounded-t-3xl gap-4 p-4 w-full"
              style={shadows.loyaltyCard}
            >
              {exampleCard}
            </View>
          </View>
          <View className="absolute bg-blue-900 rounded-full z-10 items-center justify-center py-1 px-3 min-w-24 h-6 left-1/2 top-0 -translate-x-12">
            <Typography
              variant="text-13-bold-spaced"
              className="text-white text-center"
            >
              {t("Loyalty.example")}
            </Typography>
          </View>

          <View
            className="bg-white border border-blue-900 rounded-2xl gap-2 w-full p-4 overflow-visible"
            style={shadows.loyaltyInfo}
          >
            <Typography
              variant="text-13-bold-spaced"
              className="text-blue-900 text-center w-full"
            >
              {infoText}
            </Typography>
            {secondInfoText && (
              <>
                <View className="border-t-2 self-center border-blue-200 w-1/4" />
                <Typography
                  variant="text-13-bold-spaced"
                  className="text-blue-900 text-center w-full"
                >
                  {secondInfoText}
                </Typography>
              </>
            )}
            <View className="items-center">
              <LoyaltyButton
                title={buttonText}
                onPress={onButtonPress}
                disabled={buttonDisabled}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
