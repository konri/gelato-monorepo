import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { TwoButtonFooter } from "@/components/molecules/TwoButtonFooter";
import { StampCardPreview } from "@/components/organisms/StampCardPreview";
import {
    buildCreateStampCardTemplateInput,
    useCreateStampCardTemplate,
} from "@/hooks/graphql/mutations/useCreateStampCardTemplate";
import { useUpdateStampCardTemplate } from "@/hooks/graphql/mutations/useUpdateStampCardTemplate";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { logger } from "@/utils/logger";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useStampCardForm } from "./_layout";

export default function StampSummaryScreen() {
    const { t } = useTranslation();
    const form = useStampCardForm();
    const { canWrite: canEditStampTemplate } = useFeatureAccess("stamps");
    const { mode, templateId } = useLocalSearchParams<{ mode?: string; templateId?: string }>();
    const isEditMode = mode === "edit" && Boolean(templateId);
    const [createStampCardTemplate, { loading }] = useCreateStampCardTemplate();
    const [updateStampCardTemplate, { loading: updating }] = useUpdateStampCardTemplate();
    const { hasCompany: hasCompanyAccess } = useOnboardingStatus();
    const { data: myMerchantsData } = useGetMyMerchants({
        skip: !hasCompanyAccess,
    });
    const merchant = myMerchantsData?.myMerchants?.[0];

    const handleBack = () => {
        router.back();
    };

    const handleSubmit = async () => {
        if (!canEditStampTemplate) {
            return;
        }
        const isValid = await form.trigger();
        if (!isValid) {
            if (isEditMode && templateId) {
                router.replace({
                    pathname: "/company/stamp-card-template",
                    params: { mode: "edit", templateId },
                });
            } else {
                router.replace("/company/stamp-card-template");
            }
            return;
        }
        const data = form.getValues();

        if (!merchant?.id) {
            logger.error("Merchant ID is missing");
            return;
        }

        const mutationData = buildCreateStampCardTemplateInput(merchant.id, data);

        if (isEditMode && templateId) {
            await updateStampCardTemplate({
                variables: {
                    id: templateId,
                    data: mutationData,
                },
            });
        } else {
            await createStampCardTemplate({
                variables: {
                    data: mutationData,
                },
            });
        }

        logger.log("Stamp card template saved successfully");
        router.replace("/(tabs)");
    };

    return (
        <View className="flex-1 bg-gray-50-light">
            <KeyboardAwareScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                <View className="gap-4 px-6 py-4">
                    <StampCardPreview />
                    <Typography
                        variant="text-14-regular-spaced"
                        className="text-gray-700 text-center"
                    >
                        {t("Loyalty.finalPreviewDescription")}
                    </Typography>
                </View>
            </KeyboardAwareScrollView>
            <View className="px-6 pb-4">
                <TwoButtonFooter
                    leftButton={{
                        title: t("Common.back"),
                        onPress: handleBack,
                        disabled: loading || updating,
                    }}
                    rightButton={{
                        title:
                            loading || updating
                                ? t("Common.loading")
                                : isEditMode
                                    ? t("Common.save")
                                    : t("Common.create"),
                        onPress: handleSubmit,
                        disabled: loading || updating || !canEditStampTemplate,
                    }}
                />
            </View>
        </View>
    );
}
