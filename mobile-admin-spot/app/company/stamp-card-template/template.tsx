import { FormDatePicker } from "@/components/atoms/FormDatePicker";
import { parseFieldDate } from "@/components/atoms/FormDatePicker/utils";
import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import { RadioButtonInput } from "@/components/atoms/RadioButtonGroup";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { StampPreview } from "@/components/molecules/StampPreview";
import { StampStyleSelector } from "@/components/molecules/StampStyleSelector";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { StampCardPreview } from "@/components/organisms/StampCardPreview";
import type { StampCardFormData } from "@/components/organisms/StampCardPreview/types";
import { useGetCategories } from "@/hooks/graphql/queries/useGetCategories";
import { useGetMyStampCardTemplatesDetails } from "@/hooks/graphql/queries/useGetMyStampCardTemplates";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { StampCardTemplateDetailsForEdit } from "@/hooks/graphql/queries/utils/stampCardTemplates";
import type { Category } from "@/shared/api-client/src/graphql/queries/categories";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useStampCardForm } from "./_layout";

const STAMP_COUNT_OPTIONS = [6, 7, 8, 9, 10];

const mapTemplateToFormValues = (
  template: StampCardTemplateDetailsForEdit,
  defaultTitle: string
): Partial<StampCardFormData> => ({
  title: template.title ?? defaultTitle,
  awardType: template.formAwardType,
  minimumAmount: template.formMinimumAmount,
  stampsRequired: template.stampsRequired,
  stampStyle: template.stampStickerIconUrl,
  cardMessage: template.description ?? "",
  validFrom: template.validFrom,
  validUntil: template.validUntil,
  rewardId: template.rewardId,
  rewardType: template.rewardType,
  rewardTitle: template.rewardTitle,
  rewardDescription: template.rewardDescription,
  rewardDiscountPercent: template.rewardDiscountPercent,
  rewardDiscountAmount: template.rewardDiscountAmount,
  rewardImageUrl: template.rewardImageUrl,
  intermediateRewardRemovesStamps: template.resetStampsOnMilestoneClaim ?? true,
  milestones: template.milestones,
  isActive: template.isActive ?? true,
});

export default function TemplateScreen() {
  const { t } = useTranslation();
  const form = useStampCardForm();
  const { canWrite: canEditStampTemplate } = useFeatureAccess("stamps");
  const { mode, templateId } = useLocalSearchParams<{
    mode?: string;
    templateId?: string;
  }>();
  const { data: categoriesData } = useGetCategories();
  const { normalizedTemplates } = useGetMyStampCardTemplatesDetails({
    skip: mode !== "edit",
  });
  const categories = (categoriesData?.getCategories ?? []).filter(
    (c): c is Category => typeof c.id === "string" && typeof c.name === "string" && typeof c.slug === "string",
  );
  const [initializedTemplateId, setInitializedTemplateId] = useState<
    string | null
  >(null);
  const selectedTemplate = normalizedTemplates.find(
    (template) => template.id === templateId
  ) ?? normalizedTemplates[0];
  const lockCriticalFields =
    mode === "edit" &&
    Boolean(
      selectedTemplate?.stampCards?.some((card) => card.stampsCollected > 0),
    );

  const awardType = useWatch({ control: form.control, name: "awardType" });
  const watchedValidFrom = useWatch({ control: form.control, name: "validFrom" });
  const watchedValidUntil = useWatch({ control: form.control, name: "validUntil" });

  useEffect(() => {
    void form.trigger("validFrom");
    void form.trigger("validUntil");
  }, [watchedValidFrom, watchedValidUntil, form]);

  useEffect(() => {
    if (mode !== "edit" || !selectedTemplate?.id) {
      return;
    }

    if (initializedTemplateId === selectedTemplate.id) {
      return;
    }

    form.reset({
      ...form.getValues(),
      ...mapTemplateToFormValues(selectedTemplate, t("Loyalty.stampsForVisits")),
    });

    setInitializedTemplateId(selectedTemplate.id);
  }, [form, initializedTemplateId, mode, selectedTemplate, t]);

  const handleNext = async () => {
    if (!canEditStampTemplate) {
      return;
    }
    const isValid = await form.trigger();
    if (isValid) {
      if (mode === "edit" && templateId) {
        router.push({
          pathname: "/company/stamp-card-template/rewardPicker",
          params: {
            mode,
            templateId,
            lockCriticalFields: lockCriticalFields ? "true" : "false",
          },
        });
        return;
      }
      router.push("/company/stamp-card-template/rewardPicker");
    }
  };

  const awardTypeOptions = [
    { label: t("Loyalty.awardTypeVisit"), value: "visit" },
    { label: t("Loyalty.awardTypeAmount"), value: "amount" },
  ];

  const stampCountOptions = STAMP_COUNT_OPTIONS.map((count) => ({
    label: count.toString(),
    value: count,
    preview: <StampPreview count={count} />,
  }));

  const stampProgramStatusOptions = useMemo(
    () => [
      { label: t("Loyalty.stampProgramActive"), value: true },
      { label: t("Loyalty.stampProgramInactive"), value: false },
    ],
    [t],
  );

  const dateOrderValid = (from?: string, until?: string) => {
    if (!from || !until) {
      return true;
    }
    const start = parseFieldDate(from);
    const end = parseFieldDate(until);
    if (!start || !end) {
      return true;
    }
    return start.getTime() <= end.getTime();
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50-light"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-4 px-6 py-4">
        <StampCardPreview />
        {lockCriticalFields && (
          <InfoBanner text={t("Loyalty.templateEditLockedInfo")} />
        )}
        <View className="gap-4">
          <View className="flex-row items-center gap-4">
            <Typography
              variant="text-14-regular-spaced"
              className="text-black flex-1"
            >
              {t("Loyalty.awardStampsFor")}
            </Typography>
            <View className="flex-1">
              <FormSelect
                name="awardType"
                label=""
                placeholder={t("Loyalty.selectAwardType")}
                options={awardTypeOptions}
                variant="compact"
                editable={canEditStampTemplate && !lockCriticalFields}
              />
            </View>
          </View>

          {awardType === "amount" && (
            <View className="flex-row items-center gap-4">
              <Typography
                variant="text-14-regular-spaced"
                className="text-black flex-1"
              >
                {t("Loyalty.minimumPurchaseAmount")}
              </Typography>
              <View className="flex-1">
                <FormInput
                  name="minimumAmount"
                  label=""
                  placeholder="50"
                  type="number"
                  variant="compact"
                  editable={canEditStampTemplate && !lockCriticalFields}
                />
              </View>
            </View>
          )}

          <RadioButtonInput
            name="stampsRequired"
            label={t("Loyalty.stampsRequiredForReward")}
            options={stampCountOptions}
            required
            disabled={!canEditStampTemplate || lockCriticalFields}
          />

          <StampStyleSelector
            label={t("Loyalty.selectStampStyle")}
            categories={categories}
            disabled={!canEditStampTemplate}
            required
          />

          <FormInput
            name="cardMessage"
            label={t("Loyalty.cardMessage")}
            placeholder={t("Loyalty.stampCardDescription")}
            multiline
            required
            numberOfLines={2}
            variant="compact"
            editable={canEditStampTemplate}
          />

          <FormDatePicker
            name="validFrom"
            label={t("Loyalty.validFrom")}
            placeholder={t("Loyalty.validFromPlaceholder")}
            disabled={!canEditStampTemplate}
            customValidation={{
              validate: (value) =>
                dateOrderValid(value, form.getValues("validUntil"))
                  ? true
                  : t("Loyalty.validUntilAfterStart"),
            }}
          />

          <FormDatePicker
            name="validUntil"
            label={t("Loyalty.validUntil")}
            placeholder={t("Loyalty.validUntilPlaceholder")}
            disabled={!canEditStampTemplate}
            customValidation={{
              validate: (value) =>
                dateOrderValid(form.getValues("validFrom"), value)
                  ? true
                  : t("Loyalty.validUntilAfterStart"),
            }}
          />

          <RadioButtonInput
            name="isActive"
            label={t("Loyalty.stampProgramStatus")}
            options={stampProgramStatusOptions}
            disabled={!canEditStampTemplate}
          />
        </View>

        <ActionButtons
          onSubmit={handleNext}
          onCancel={() => router.back()}
          submitButtonText={t("Common.next")}
          cancelButtonText={t("Common.back")}
          canSubmit={canEditStampTemplate}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
