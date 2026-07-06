import { CheckboxInput } from "@/components/atoms/Checkbox";
import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { FormSettingsSection } from "@/components/molecules/FormSettingsSection";
import { OrderQueueTicketPreview } from "@/components/molecules/OrderQueueTicketPreview";
import { PreviewFrame } from "@/components/molecules/PreviewFrame";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import React from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { MerchantStoreOrderQueueFormProps } from "./types";

export function MerchantStoreOrderQueueForm({
  form,
  storeDisplayName,
  onSubmit,
  isSaving,
  canSubmit,
  onCancel,
}: MerchantStoreOrderQueueFormProps) {
  const { t } = useTranslation();

  const [
    autoPickUpAfterReadyWatch,
    orderReadyPushCustomWatch,
    orderReadyReminderEnabledWatch,
  ] = useWatch({
    control: form.control,
    name: [
      "autoPickUpAfterReady",
      "orderReadyPushCustom",
      "orderReadyReminderEnabled",
    ],
  });

  return (
    <View className="flex-1 gap-4">
      <ContextSwitcher storeOnly />
      <Typography variant="text-14-regular-spaced" className="text-blue-900">
        {t("OrderQueue.storeQueueScopeBanner")}
      </Typography>

      <PreviewFrame>
        <View className="items-center gap-3">
          <OrderQueueTicketPreview
            orderNumber={5}
            statusLabel={t("OrderQueue.statusReadyToCollect")}
            pickupPlaceLabel={t("OrderQueue.pickupVenueFallback")}
            pickupPlaceName={
              storeDisplayName.length > 0 ? storeDisplayName : "—"
            }
          />
        </View>
      </PreviewFrame>

      <FormSettingsSection title={t("OrderQueue.sectionQueueLimits")}>
        <FormInput
          name="maxActiveOrders"
          label={t("OrderQueue.maxActiveOrders")}
          placeholder="500"
          type="number"
          keyboardType="numeric"
          integerOnly
          min={1}
          required
          variant="compact"
          helperText={t("OrderQueue.maxActiveOrdersHelper")}
        />
      </FormSettingsSection>

      <FormSettingsSection
        title={t("OrderQueue.sectionPickup")}
        leading={
          <CheckboxInput
            name="autoPickUpAfterReady"
            label={t("OrderQueue.autoPickUpAfterReadyLabel")}
          />
        }
        description={t("OrderQueue.autoPickUpAfterReadyHelper")}
      >
        <View className={autoPickUpAfterReadyWatch ? "" : "opacity-45"}>
          <FormInput
            name="orderArchiveDelayMinutes"
            label={t("OrderQueue.archiveDelayMinutes")}
            placeholder="30"
            type="number"
            keyboardType="numeric"
            integerOnly
            min={0}
            required={Boolean(autoPickUpAfterReadyWatch)}
            variant="compact"
            helperText={t("OrderQueue.archiveDelayHelper")}
            editable={autoPickUpAfterReadyWatch ? undefined : false}
          />
        </View>
      </FormSettingsSection>

      <FormSettingsSection
        title={t("OrderQueue.sectionPush")}
        leading={
          <CheckboxInput
            name="orderReadyPushCustom"
            label={t("OrderQueue.orderReadyPushCustomLabel")}
          />
        }
        description={t("OrderQueue.orderReadyPushBackendDefaultsHint")}
      >
        <View
          className={`gap-4${orderReadyPushCustomWatch ? "" : " opacity-45"}`}
        >
          <FormInput
            name="orderReadyPushTitle"
            label={t("OrderQueue.orderReadyPushTitle")}
            placeholder={t("OrderQueue.orderReadyPushTitlePlaceholder")}
            variant="compact"
            editable={orderReadyPushCustomWatch ? undefined : false}
          />
          <FormInput
            name="orderReadyPushBody"
            label={t("OrderQueue.orderReadyPushBody")}
            placeholder={t("OrderQueue.orderReadyPushBodyPlaceholder")}
            multiline
            numberOfLines={3}
            variant="compact"
            helperText={t("OrderQueue.orderReadyPushBodyHelper")}
            editable={orderReadyPushCustomWatch ? undefined : false}
          />
        </View>
      </FormSettingsSection>

      <FormSettingsSection
        title={t("OrderQueue.sectionReadyReminder")}
        leading={
          <CheckboxInput
            name="orderReadyReminderEnabled"
            label={t("OrderQueue.orderReadyReminderLabel")}
          />
        }
        description={t("OrderQueue.orderReadyReminderHelper")}
      >
        <View className={orderReadyReminderEnabledWatch ? "" : "opacity-45"}>
          <FormInput
            name="orderReadyReminderDelayMinutes"
            label={t("OrderQueue.orderReadyReminderDelayMinutes")}
            placeholder="15"
            type="number"
            keyboardType="numeric"
            integerOnly
            min={1}
            required={Boolean(orderReadyReminderEnabledWatch)}
            variant="compact"
            helperText={t("OrderQueue.orderReadyReminderDelayMinutesHelper")}
            editable={orderReadyReminderEnabledWatch ? undefined : false}
          />
        </View>
      </FormSettingsSection>

      <FormSettingsSection title={t("OrderQueue.sectionNumbering")}>
        <FormInput
          name="orderNumberRolloverAfter"
          label={t("OrderQueue.orderNumberRolloverAfter")}
          placeholder="100"
          helperText={t("OrderQueue.orderNumberRolloverAfterHelper")}
          type="number"
          keyboardType="numeric"
          integerOnly
          min={1}
          required
          variant="compact"
        />
      </FormSettingsSection>

      <Typography variant="text-12-regular" className="text-gray-600">
        {t("OrderQueue.defaultsHint")}
      </Typography>

      <ActionButtons
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitButtonText={t("OrderQueue.save")}
        cancelButtonText={t("Common.cancel")}
        isSubmitting={form.formState.isSubmitting || isSaving}
        canSubmit={canSubmit}
      />
    </View>
  );
}
