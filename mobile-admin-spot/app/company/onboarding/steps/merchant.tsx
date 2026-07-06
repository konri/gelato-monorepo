import { FormInput } from "@/components/atoms/FormInput";
import { CategorySelect } from "@/components/molecules/CategorySelect";
import { MerchantPhotosSection } from "@/components/molecules/MerchantPhotosSection";
import type { FormStep } from "@/components/organisms/MultiStepForm/types";
import { useCreateMerchant } from "@/hooks/graphql/mutations/useCreateMerchant";
import { useUpdateMerchant } from "@/hooks/graphql/mutations/useUpdateMerchant";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useFormImageOverride } from "@/hooks/useFormImageOverride";
import { useFormDefaults } from "@/hooks/useFormDefaults";
import { CreateMerchantInput } from "@/shared/api-client/src/graphql/mutations/merchantRequest";
import type { Category } from "@/shared/api-client/src/graphql/queries/categories/types";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCreateUpdateHandler } from "./useCreateUpdateHandler";

export type MerchantFormData = CreateMerchantInput;

type UseMerchantStepProps = {
  categories: Category[];
  hasCompanyAccess: boolean;
  onStepCompleted?: () => void;
};

export function useMerchantStep({
  categories,
  hasCompanyAccess,
  onStepCompleted,
}: UseMerchantStepProps): FormStep {
  const { t } = useTranslation();
  const [createMerchant] = useCreateMerchant();
  const [updateMerchant] = useUpdateMerchant();
  const { data: myMerchantsData } = useGetMyMerchants({
    skip: !hasCompanyAccess,
  });

  const existingMerchant = myMerchantsData?.myMerchants?.[0];
  const isEditing = !!existingMerchant?.id;

  const defaultValues = useMemo<Partial<MerchantFormData>>(() => {
    if (!existingMerchant) return {};
    return {
      name: existingMerchant.name,
      description: existingMerchant.description,
      categoryId: existingMerchant.categoryId,
      logoUrl: existingMerchant.logoUrl,
      coverUrl: existingMerchant.coverUrl,
    };
  }, [existingMerchant]);

  const form = useForm<MerchantFormData>({
    defaultValues: defaultValues as MerchantFormData,
    mode: "onChange",
  });

  useFormDefaults({
    form,
    defaultValues,
    enabled: true,
  });

  const imageResetKey = existingMerchant?.id;
  const logoPhoto = useFormImageOverride({
    form,
    fieldName: "logoUrl",
    resetKey: imageResetKey,
  });
  const coverPhoto = useFormImageOverride({
    form,
    fieldName: "coverUrl",
    resetKey: imageResetKey,
  });

  const handleSubmit = useCreateUpdateHandler<MerchantFormData>({
    isEditing,
    existingId: existingMerchant?.id,
    onCreate: async (data) => {
      const [logoUrl, coverUrl] = await Promise.all([
        logoPhoto.resolveUrlForSubmit(data.logoUrl),
        coverPhoto.resolveUrlForSubmit(data.coverUrl),
      ]);
      await createMerchant({
        variables: {
          data: { ...data, logoUrl, coverUrl },
        },
      });
    },
    onUpdate: async (data, id) => {
      const [logoUrl, coverUrl] = await Promise.all([
        logoPhoto.resolveUrlForSubmit(data.logoUrl),
        coverPhoto.resolveUrlForSubmit(data.coverUrl),
      ]);
      await updateMerchant({
        variables: {
          data: { ...data, logoUrl, coverUrl },
          merchantId: id,
        },
      });
    },
    onStepCompleted,
    entityName: "Merchant",
  });

  return {
    stepNumber: 2,
    title: t("Company.fillCompanyData"),
    subtitle: t("Company.companyVisibilityDescription"),
    form: form as any,
    fields: [
      {
        name: "logoUrl",
        component: (
          <MerchantPhotosSection
            editing={isEditing}
            merchantName={
              form.watch("name") || existingMerchant?.name || ""
            }
            coverUri={coverPhoto.displayUri}
            logoUri={logoPhoto.displayUri}
            onCoverChange={coverPhoto.onPick}
            onLogoChange={logoPhoto.onPick}
            onCoverRemove={coverPhoto.onRemovePress}
            onLogoRemove={logoPhoto.onRemovePress}
          />
        ),
      },
      {
        name: "name",
        component: (
          <FormInput
            name="name"
            label={t("Merchant.companyName")}
            placeholder={t("Merchant.companyNamePlaceholder")}
            required
            variant="compact"
          />
        ),
      },
      {
        name: "categoryId",
        component: (
          <CategorySelect
            name="categoryId"
            label={t("Merchant.category")}
            categories={categories}
            required
          />
        ),
      },
      {
        name: "description",
        component: (
          <FormInput
            name="description"
            label={t("Merchant.description")}
            placeholder={t("Merchant.descriptionPlaceholder")}
            multiline
            numberOfLines={4}
            variant="compact"
          />
        ),
      },
    ],
    onSubmit: handleSubmit as any,
    submitButtonText: isEditing
      ? t("Merchant.updateMerchant")
      : t("Merchant.createMerchant"),
  };
}
