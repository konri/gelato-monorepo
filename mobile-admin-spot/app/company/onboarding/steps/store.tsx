import { FormInput } from "@/components/atoms/FormInput";
import { MapboxLocationPicker } from "@/components/molecules/MapboxLocationPicker";
import { MerchantPhotosSection } from "@/components/molecules/MerchantPhotosSection";
import type { FormStep } from "@/components/organisms/MultiStepForm/types";
import { useCreateMerchantStore } from "@/hooks/graphql/mutations/useCreateMerchantStore";
import { useUpdateMerchantStore } from "@/hooks/graphql/mutations/useUpdateMerchantStore";
import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useFormDefaults } from "@/hooks/useFormDefaults";
import { useFormImageOverride } from "@/hooks/useFormImageOverride";
import type { StoreFormData } from "@/app/company/store/types";
import { CreateMerchantStoreInput } from "@/shared/api-client/src/graphql/mutations/merchantStore";
import { logger } from "@/utils/logger";
import React, { useMemo } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCreateUpdateHandler } from "./useCreateUpdateHandler";

const LocationPickerField = () => {
  const { t } = useTranslation();
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
      label={t("Store.location") || "Lokalizacja"}
    />
  );
};

type UseStoreStepProps = {
  hasCompanyAccess: boolean;
  onStepCompleted?: () => void;
  createSubmitButtonText?: string;
};

export function useStoreStep({
  hasCompanyAccess,
  onStepCompleted,
  createSubmitButtonText,
}: UseStoreStepProps): FormStep {
  const { t } = useTranslation();
  const [createStore] = useCreateMerchantStore();
  const [updateStore] = useUpdateMerchantStore();
  const { data: storesData } = useGetMerchantStores({
    skip: !hasCompanyAccess,
  });
  const { data: myMerchantsData } = useGetMyMerchants({
    skip: !hasCompanyAccess,
  });

  const merchant = myMerchantsData?.myMerchants?.[0];
  const existingStore = storesData?.myStores?.[0];
  const isEditing = !!existingStore?.id;

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
    defaultValues: defaultValues as StoreFormData,
    mode: "onChange",
  });

  useFormDefaults({
    form,
    defaultValues,
    enabled: true,
  });

  const photo = useFormImageOverride({
    form,
    fieldName: "photoUrl",
    resetKey: existingStore?.id,
  });

  const transformStoreData = (data: StoreFormData): CreateMerchantStoreInput => {
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
      if (!merchant?.id) {
        logger.error("Merchant ID is missing");
        throw new Error("Merchant ID is missing");
      }

      const resolvedPhotoUrl = await photo.resolveUrlForSubmit(data.photoUrl);
      await createStore({
        variables: {
          data: transformStoreData({ ...data, photoUrl: resolvedPhotoUrl }),
          merchantId: merchant.id,
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
    onStepCompleted,
    entityName: "Store",
  });

  return {
    stepNumber: 3,
    title: t("Store.fillStoreData"),
    form: form as any,
    fields: [
      {
        name: "photoUrl",
        component: (
          <MerchantPhotosSection
            layout="store"
            editing={isEditing}
            coverUri={photo.displayUri}
            logoUri={null}
            onCoverChange={photo.onPick}
            onCoverRemove={photo.onRemovePress}
            readOnly={false}
          />
        ),
      },
      {
        name: "name",
        component: (
          <FormInput
            name="name"
            label={t("Store.name")}
            placeholder={t("Store.namePlaceholder")}
            required
            variant="compact"
          />
        ),
      },
      {
        name: "address",
        component: (
          <FormInput
            name="address"
            label={t("Store.address")}
            placeholder={t("Store.addressPlaceholder")}
            required
            variant="compact"
          />
        ),
      },
      {
        name: "city",
        component: (
          <FormInput
            name="city"
            label={t("Store.city")}
            placeholder={t("Store.cityPlaceholder")}
            required
            variant="compact"
          />
        ),
      },
      {
        name: "phone",
        component: (
          <FormInput
            name="phone"
            label={t("Store.phone")}
            placeholder={t("Store.phonePlaceholder")}
            type="phone"
            keyboardType="phone-pad"
            variant="compact"
          />
        ),
      },
      {
        name: "location",
        component: <LocationPickerField />,
      },
    ],
    onSubmit: handleSubmit as any,
    submitButtonText: isEditing
      ? t("Store.updateStore")
      : (createSubmitButtonText ?? t("Store.createStore")),
  };
}
