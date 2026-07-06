import { PreviewFrame } from "@/components/molecules/PreviewFrame";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { StampCard } from "@/components/molecules/StampCard";
import { Typography } from "@/components/atoms/Typography";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getStampTemplatePreviewScheduleMessage } from "@/utils/stampTemplateSchedule";
import type { StampCardFormData } from "./types";

const formatPreviewDate = (value?: string, locale?: string): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

export const StampCardPreview = () => {
    const { t, i18n } = useTranslation();
    const form = useFormContext<StampCardFormData>();

    const formValues = form.watch();
    const {
        awardType,
        minimumAmount,
        cardMessage,
        stampsRequired,
        stampStyle,
        milestones,
        validFrom,
        validUntil,
        isActive,
    } = formValues;
    const milestoneStampsRequired = milestones?.[0]?.stampsRequired;
    const milestoneTitle = milestones?.[0]?.title;
    const activityDatesText = useMemo(() => {
        const formattedValidFrom = formatPreviewDate(validFrom, i18n.language);
        const formattedValidUntil = formatPreviewDate(validUntil, i18n.language);

        return [
            formattedValidFrom ? `${t("Loyalty.validFrom")}: ${formattedValidFrom}` : null,
            formattedValidUntil ? `${t("Loyalty.validUntil")}: ${formattedValidUntil}` : null,
        ]
            .filter((value): value is string => Boolean(value))
            .join(" • ");
    }, [i18n.language, t, validFrom, validUntil]);

    const schedulePreviewMessage = useMemo(
        () =>
            getStampTemplatePreviewScheduleMessage(t, {
                isActive,
                validFrom,
                validUntil,
            }),
        [validFrom, validUntil, isActive, t],
    );

    const stampCardPreview = useMemo(() => {
        const totalStamps = stampsRequired || 8;
        const filledStamps = Math.floor(totalStamps * 0.25);
        const description = cardMessage || "";
        const rateText =
            awardType === "visit"
                ? t("Loyalty.stampCardRateVisit")
                : t("Loyalty.stampCardRateDynamic", {
                    amount: minimumAmount,
                });

        const milestoneStampsRequiredValue = milestoneStampsRequired
            ? Number(milestoneStampsRequired)
            : undefined;

        return {
            title: t("Loyalty.stampCardTitle"),
            progress: `${filledStamps}/${totalStamps}`,
            description,
            rateText,
            totalStamps,
            filledStamps,
            milestoneStampsRequired: milestoneStampsRequiredValue,
            milestoneTitle,
            stampStyleUrl: stampStyle,
        };
    }, [awardType, minimumAmount, stampsRequired, cardMessage, stampStyle, milestoneStampsRequired, milestoneTitle, t]);

    return (
        <PreviewFrame>
            <View className="gap-3">
                {schedulePreviewMessage ? (
                    <InfoBanner text={schedulePreviewMessage} variant="compact" />
                ) : null}
                <StampCard {...stampCardPreview} />
                {activityDatesText ? (
                    <Typography variant="text-12-regular" className="text-gray-500 text-right">
                        {activityDatesText}
                    </Typography>
                ) : null}
            </View>
        </PreviewFrame>
    );
};
