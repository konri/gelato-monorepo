import { FormInput } from "@/components/atoms/FormInput";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { MapboxLocationPicker } from "@/components/molecules/MapboxLocationPicker";
import { MerchantPhotosSection } from "@/components/molecules/MerchantPhotosSection";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useCreateMerchantStore } from "@/hooks/graphql/mutations/useCreateMerchantStore";
import { useUpdateMerchantStore } from "@/hooks/graphql/mutations/useUpdateMerchantStore";
import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { AppFormProvider, useFormEditable } from "@/hooks/useFormEditable";
import { useFormImageOverride } from "@/hooks/useFormImageOverride";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { CreateMerchantStoreInput } from "@/shared/api-client/src/graphql/mutations/merchantStore";
import { logger } from "@/utils/logger";
import type { StoreFormData } from "./types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { useCreateUpdateHandler } from "../onboarding/steps/useCreateUpdateHandler";

export default function StoreFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string }>();
  const storeId = params.storeId;
  const { selectedMerchantId, hasAnyMerchantAccess } = useOperatorAccess();
  const { canRead: canReadStore, canWrite: canWriteStore } = useFeatureAccess("store");
  const shouldLoadStoreData = hasAnyMerchantAccess && canReadStore;

  const [createStore] = useCreateMerchantStore();
  const [updateStore] = useUpdateMerchantStore();
  const {
    data: storesData,
    loading: storesLoading,
  } = useGetMerchantStores({ skip: !shouldLoadStoreData });

  const existingStore = storesData?.myStores?.find((s) => s.id === storeId);
  const isEditing = !!existingStore;

  const defaultValues = useMemo<Partial<StoreFormData>>(() => {
    if (!existingStore) return {};
    return {
      name: existingStore.name,
      address: existingStore.address,
      city: existingStore.city,
      phone: existingStore.phone,
      photoUrl: existingStore.photoUrl ?? "",
      latitude: existingStore.latitude
        ? String(existingStore.latitude)
        : undefined,
      longitude: existingStore.longitude
        ? String(existingStore.longitude)
        : undefined,
    };
  }, [existingStore]);

  const form = useForm<StoreFormData>({
    defaultValues,
    mode: "onChange",
  });

  const photo = useFormImageOverride({
    form,
    fieldName: "photoUrl",
    resetKey: existingStore?.id,
  });

  const transformStoreData = (
    data: StoreFormData,
  ): CreateMerchantStoreInput => {
    const phoneDigits = data.phone?.replace(/\D/g, "") ?? "";
    const { phone, latitude, longitude, ...rest } = data;
    return {
      ...rest,
      phone: phoneDigits.length > 0 ? phoneDigits : undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    };
  };

  const handleSubmit = useCreateUpdateHandler<StoreFormData>({
    isEditing,
    existingId: existingStore?.id,
    onCreate: async (data) => {
      if (!selectedMerchantId) {
        logger.error("Merchant ID is missing");
        throw new Error("Merchant ID is missing");
      }
      const resolvedPhotoUrl = await photo.resolveUrlForSubmit(data.photoUrl);
      await createStore({
        variables: {
          data: transformStoreData({ ...data, photoUrl: resolvedPhotoUrl }),
          merchantId: selectedMerchantId,
        },
      });
    },
    onUpdate: async (data, id) => {
      const resolvedPhotoUrl = await photo.resolveUrlForSubmit(data.photoUrl);
      await updateStore({
        variables: {
          data: transformStoreData({ ...data, photoUrl: resolvedPhotoUrl }),
          storeId: id,
        },
      });
    },
    refetchFn: async () => { router.back(); },
    entityName: "Store",
  });

  if (storesLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  const onSubmit = form.handleSubmit(handleSubmit);
  const canSubmit = form.formState.isValid && !form.formState.isSubmitting;

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="flex-grow-1"
    >
      <AppFormProvider
        form={form}
        editable={canWriteStore}
        defaultValues={defaultValues}
        defaultValuesEnabled={!!existingStore}
      >
          <View className="flex-1 gap-4 p-4">
            <MerchantPhotosSection
              layout="store"
              editing={isEditing}
              coverUri={photo.displayUri}
              logoUri={null}
              onCoverChange={
                canWriteStore ? photo.onPick : undefined
              }
              onCoverRemove={
                canWriteStore ? photo.onRemovePress : undefined
              }
              readOnly={!canWriteStore}
            />
            <FormInput
              name="name"
              label={t("Store.name")}
              placeholder={t("Store.namePlaceholder")}
              required
              variant="compact"
            />
            <FormInput
              name="address"
              label={t("Store.address")}
              placeholder={t("Store.addressPlaceholder")}
              required
              variant="compact"
            />
            <FormInput
              name="city"
              label={t("Store.city")}
              placeholder={t("Store.cityPlaceholder")}
              required
              variant="compact"
            />
            <FormInput
              name="phone"
              label={t("Store.phone")}
              placeholder={t("Store.phonePlaceholder")}
              type="phone"
              keyboardType="phone-pad"
              variant="compact"
            />
            <LocationPickerField />
            <ActionButtons
              onSubmit={onSubmit}
              onCancel={() => router.back()}
              submitButtonText={
                isEditing ? t("Store.updateStore") : t("Store.createStore")
              }
              cancelButtonText={t("Common.cancel")}
              isSubmitting={form.formState.isSubmitting}
              canSubmit={canWriteStore && canSubmit}
            />
          </View>
      </AppFormProvider>
    </KeyboardAwareScrollView>
  );
}

const LocationPickerField = () => {
  const { t } = useTranslation();
  const editable = useFormEditable();
  const { setValue, watch } = useFormContext<StoreFormData>();
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const handleLocationSelect = (lat: number, lng: number) => {
    setValue("latitude", lat, { shouldValidate: true });
    setValue("longitude", lng, { shouldValidate: true });
  };

  return (
    <MapboxLocationPicker
      onLocationSelect={handleLocationSelect}
      initialLatitude={latitude}
      initialLongitude={longitude}
      label={t("Store.location")}
      editable={editable}
    />
  );
};
