import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { MerchantStoreOrderQueueForm } from "@/components/organisms/MerchantStoreOrderQueueForm";
import { colors } from "@/constants/colors";
import { useUpdateMerchantStoreOrderQueueSettings } from "@/hooks/graphql/mutations/useUpdateMerchantStoreOrderQueueSettings";
import { useMerchantStoreOrderQueueConfig } from "@/hooks/graphql/queries/useMerchantStoreOrderQueueConfig";
import { useBootstrapScanStoreContextWhenFocused } from "@/hooks/useBootstrapScanStoreContextWhenFocused";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { getErrorMessage } from "@/utils/apolloError";
import {
  buildOrderQueueUpdateInput,
  configToOrderQueueFormValues,
  isMerchantStoreOrderQueueConfig,
  type OrderQueueFormValues,
} from "@/utils/merchantStoreOrderQueueForm";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

export default function StoreOrderQueueConfigScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string }>();
  const storeIdFromRoute =
    typeof params.storeId === "string" ? params.storeId : undefined;

  const {
    hasAnyMerchantAccess,
    availableStores,
    selectedStoreId,
    selectedScanStoreId,
    setStoreContext,
    isLoading: accessLoading,
  } = useOperatorAccess();

  const { canRead: canReadStore, canWrite: canWriteStore } =
    useFeatureAccess("store");
  const shouldLoad = hasAnyMerchantAccess && canReadStore;

  useBootstrapScanStoreContextWhenFocused({ enabled: shouldLoad });

  useEffect(() => {
    if (!storeIdFromRoute) {
      return;
    }
    void setStoreContext(storeIdFromRoute);
  }, [setStoreContext, storeIdFromRoute]);

  const merchantStoreIdForQueue = useMemo(() => {
    if (selectedStoreId != null) {
      return selectedStoreId;
    }
    if (
      selectedScanStoreId != null &&
      availableStores.some((s) => s.id === selectedScanStoreId)
    ) {
      return selectedScanStoreId;
    }
    return availableStores[0]?.id ?? null;
  }, [availableStores, selectedScanStoreId, selectedStoreId]);

  useEffect(() => {
    if (merchantStoreIdForQueue == null) {
      return;
    }
    if (selectedStoreId === merchantStoreIdForQueue) {
      return;
    }
    void setStoreContext(merchantStoreIdForQueue);
  }, [merchantStoreIdForQueue, selectedStoreId, setStoreContext]);

  const canLoadQueueConfig =
    shouldLoad && !accessLoading && merchantStoreIdForQueue != null;

  const {
    data: queueConfigData,
    loading: queueConfigLoading,
    error: queueConfigError,
    refetch: refetchQueueConfig,
  } = useMerchantStoreOrderQueueConfig({
    merchantStoreId: merchantStoreIdForQueue ?? undefined,
    skip: !canLoadQueueConfig,
  });

  const [updateQueueSettings, { loading: isSaving }] =
    useUpdateMerchantStoreOrderQueueSettings();

  const form = useForm<OrderQueueFormValues>({
    defaultValues: {
      orderArchiveDelayMinutes: "0",
      autoPickUpAfterReady: true,
      maxActiveOrders: "1",
      orderReadyPushCustom: false,
      orderReadyPushTitle: "",
      orderReadyPushBody: "",
      orderReadyReminderEnabled: false,
      orderReadyReminderDelayMinutes: "15",
      orderNumberRolloverAfter: "1",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const queueConfig = queueConfigData?.merchantStoreOrderQueueConfig;

  const lastHydratedStoreId = useRef<string | null>(null);

  useEffect(() => {
    if (!queueConfig || merchantStoreIdForQueue == null) {
      return;
    }
    if (!isMerchantStoreOrderQueueConfig(queueConfig)) {
      return;
    }
    if (lastHydratedStoreId.current === merchantStoreIdForQueue) {
      return;
    }
    lastHydratedStoreId.current = merchantStoreIdForQueue;
    form.reset(configToOrderQueueFormValues(queueConfig));
  }, [form, merchantStoreIdForQueue, queueConfig]);

  const storeDisplayName = useMemo(() => {
    if (merchantStoreIdForQueue == null) {
      return "";
    }
    return (
      availableStores.find((s) => s.id === merchantStoreIdForQueue)?.name ?? ""
    );
  }, [availableStores, merchantStoreIdForQueue]);

  const canSubmitForm =
    form.formState.isValid &&
    !form.formState.isSubmitting &&
    !isSaving &&
    canWriteStore &&
    merchantStoreIdForQueue != null;

  const onSubmit = form.handleSubmit(async (values) => {
    if (merchantStoreIdForQueue == null) {
      return;
    }
    const inputPayload = buildOrderQueueUpdateInput({
      merchantStoreId: merchantStoreIdForQueue,
      form: values,
    });

    try {
      await updateQueueSettings({
        variables: {
          input: inputPayload,
        },
      });
      await refetchQueueConfig();
      router.back();
    } catch {
      Alert.alert(t("Common.saveDataFailed"));
    }
  });

  if (queueConfigLoading && !queueConfig) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.tabBar.primary} />
      </View>
    );
  }

  if (queueConfigError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Typography variant="text-18-bold" className="text-black">
          {getErrorMessage(queueConfigError) ?? t("Common.somethingWentWrong")}
        </Typography>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 p-4"
      contentContainerClassName="flex-grow-1"
    >
      <AppFormProvider
        form={form}
        editable={canWriteStore}
        defaultValuesEnabled={false}
      >
        <MerchantStoreOrderQueueForm
          form={form}
          storeDisplayName={storeDisplayName}
          onSubmit={onSubmit}
          isSaving={isSaving}
          canSubmit={canSubmitForm}
          onCancel={() => router.back()}
        />
      </AppFormProvider>
    </KeyboardAwareScrollView>
  );
}
