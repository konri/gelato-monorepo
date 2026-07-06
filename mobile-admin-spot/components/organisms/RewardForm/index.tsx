import { Button } from "@/components/atoms/Button";
import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import { Typography } from "@/components/atoms/Typography";
import { ImagePicker } from "@/components/molecules/ImagePicker";
import { PreviewFrame } from "@/components/molecules/PreviewFrame";
import { RewardCard } from "@/components/molecules/RewardCard";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useFormImageOverride } from "@/hooks/useFormImageOverride";
import type { RewardFormData } from "@/utils/rewardForm";
import { getRewardValueTypeOptions } from "@/utils/rewardForm";
import { getRewardPreviewBadgeLabel } from "@/utils/rewardPreviewBadge";
import React, { useCallback, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

type RewardFormProps = {
  logoUrl?: string;
  onSave?: (data: RewardFormData) => void;
  isEditMode?: boolean;
  initialData?: Partial<RewardFormData>;
  editable?: boolean;
  imageOverrideResetKey?: string | null;
};

const InfoIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      fill="#0B1719"
    />
  </Svg>
);

export const RewardForm = ({
  logoUrl,
  onSave,
  isEditMode = true,
  initialData,
  editable = true,
  imageOverrideResetKey,
}: RewardFormProps) => {
  const { t } = useTranslation();

  const form = useForm<RewardFormData>({
    defaultValues: {
      title: "",
      description: "",
      valueType: "FREE_SERVICE",
    },
  });

  const imageOverride = useFormImageOverride({
    form,
    fieldName: "imageUrl",
    resetKey: imageOverrideResetKey,
  });

  const valueType = useWatch({ control: form.control, name: "valueType" });
  const title = useWatch({ control: form.control, name: "title" }) || "";
  const discountPercent = useWatch({
    control: form.control,
    name: "discountPercent",
  });
  const discountAmount = useWatch({
    control: form.control,
    name: "discountAmount",
  });
  const pointsValue = useWatch({
    control: form.control,
    name: "pointsValue",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title ?? "",
        description: initialData.description ?? "",
        imageUrl: initialData.imageUrl || undefined,
        valueType: initialData.valueType ?? "FREE_SERVICE",
        discountPercent: initialData.discountPercent,
        discountAmount: initialData.discountAmount,
        pointsValue: initialData.pointsValue,
        validFrom: initialData.validFrom,
        validUntil: initialData.validUntil,
      });
    }
  }, [initialData, form]);

  const rewardTypeOptions = useMemo(() => getRewardValueTypeOptions(t), [t]);

  const rewardValueFieldLabel = useMemo(() => {
    switch (valueType) {
      case "DISCOUNT_PERCENT":
        return t("Loyalty.discountPercent");
      case "DISCOUNT_AMOUNT":
        return t("Loyalty.discountAmount");
      case "POINTS":
        return t("Loyalty.pointsReward");
      default:
        return "";
    }
  }, [valueType, t]);

  const infoBannerText = useMemo(() => {
    if (valueType === "DISCOUNT_PERCENT" && discountPercent) {
      return t("Loyalty.rewardInfoPercent", { value: discountPercent });
    }
    if (valueType === "DISCOUNT_AMOUNT" && discountAmount) {
      return t("Loyalty.rewardInfoAmount", { value: discountAmount });
    }
    if (valueType === "FREE_SERVICE") {
      return t("Loyalty.rewardInfoFreeService");
    }
    if (valueType === "POINTS") {
      return t("Loyalty.rewardInfoPoints", {
        value: pointsValue?.trim() ? pointsValue : "0",
      });
    }
    return t("Loyalty.rewardInfoDefault");
  }, [valueType, discountPercent, discountAmount, pointsValue, t]);

  const rewardPreviewSummary = useMemo(
    () =>
      getRewardPreviewBadgeLabel(
        { valueType, discountPercent, discountAmount, pointsValue },
        t,
      ),
    [valueType, discountPercent, discountAmount, pointsValue, t],
  );

  const handleSave = useCallback(() => {
    if (!editable) {
      return;
    }
    void form.handleSubmit(async (values) => {
      const resolvedImageUrl = await imageOverride.resolveUrlForSubmit(values.imageUrl);
      onSave?.({ ...values, imageUrl: resolvedImageUrl });
    })();
  }, [editable, form, imageOverride, onSave]);

  return (
    <AppFormProvider form={form} editable={editable}>
        <View className="gap-4 pb-4">
          <PreviewFrame>
            <View className="flex-col items-center py-6 gap-4 justify-center px-16">
              <RewardCard
                title={title}
                cost={1}
                stampsLabel={t("Loyalty.stamps")}
                imageUrl={imageOverride.displayUri ?? undefined}
                logoUrl={logoUrl}
                valueSummary={rewardPreviewSummary}
                imageContent={
                  isEditMode ? (
                    <ImagePicker
                      value={imageOverride.displayUri}
                      readOnly={!editable}
                      onRemove={
                        editable ? imageOverride.onRemovePress : undefined
                      }
                      removeAccessibilityLabel={t("Loyalty.removeRewardImage")}
                      onChange={
                        editable
                          ? (uri) => {
                              imageOverride.onPick(uri);
                            }
                          : () => {}
                      }
                    />
                  ) : undefined
                }
              />
            </View>
          </PreviewFrame>

          <FormInput
            name="title"
            label={t("Loyalty.title")}
            placeholder={t("Loyalty.rewardTitlePlaceholder")}
            type="text"
            required
            variant="compact"
            helperText={t("Loyalty.rewardTitleHelper")}
          />

          <FormInput
            name="description"
            label={t("Loyalty.promotionRules")}
            placeholder={t("Loyalty.rewardDescriptionPlaceholder")}
            type="text"
            variant="compact"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            helperText={t("Loyalty.definePromotionConditions")}
          />

          <View className="flex-row items-center gap-4">
            <Typography
              variant="text-14-regular-spaced"
              className="text-black min-w-0 shrink flex-1"
            >
              {t("Loyalty.rewardType")}
            </Typography>
            <View className="min-w-0 flex-1">
              <FormSelect
                name="valueType"
                label=""
                placeholder={t("Loyalty.selectMilestoneType")}
                options={rewardTypeOptions}
                variant="compact"
                helperText={t("Loyalty.rewardTypeHelper")}
              />
            </View>
          </View>

          {(valueType === "DISCOUNT_PERCENT" ||
            valueType === "DISCOUNT_AMOUNT" ||
            valueType === "POINTS") && (
            <View className="flex-row items-center gap-4">
              <Typography
                variant="text-14-regular-spaced"
                className="text-black min-w-0 shrink flex-1"
              >
                {rewardValueFieldLabel}
              </Typography>
              <View className="min-w-0 flex-1">
                <FormInput
                  name={
                    valueType === "DISCOUNT_PERCENT"
                      ? "discountPercent"
                      : valueType === "DISCOUNT_AMOUNT"
                        ? "discountAmount"
                        : "pointsValue"
                  }
                  label=""
                  placeholder="0"
                  type="number"
                  suffix={
                    valueType === "DISCOUNT_PERCENT"
                      ? "%"
                      : valueType === "DISCOUNT_AMOUNT"
                        ? "zł"
                        : t("Loyalty.points")
                  }
                  variant="compact"
                  keyboardType="numeric"
                  helperText={
                    valueType === "DISCOUNT_PERCENT"
                      ? t("Loyalty.rewardValueHelperDiscountPercent")
                      : valueType === "DISCOUNT_AMOUNT"
                        ? t("Loyalty.rewardValueHelperDiscountAmount")
                        : t("Loyalty.rewardValueHelperPoints")
                  }
                />
              </View>
            </View>
          )}

          <View className="flex-row bg-blue-200-gray rounded-2xl p-4 gap-3 items-center">
            <InfoIcon />
            <Typography variant="text-16-regular" className="text-black flex-1">
              {infoBannerText}
            </Typography>
          </View>

          <View className="flex-row justify-center mt-2">
            <Button
              title={t("Loyalty.done")}
              onPress={handleSave}
              variant="primary"
              size="sm"
              width={184}
              disabled={!editable || form.formState.isSubmitting}
            />
          </View>
        </View>
    </AppFormProvider>
  );
};
