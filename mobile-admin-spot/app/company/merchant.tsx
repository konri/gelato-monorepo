import { FormInput } from "@/components/atoms/FormInput";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { CategorySelect } from "@/components/molecules/CategorySelect";
import { MerchantPhotosSection } from "@/components/molecules/MerchantPhotosSection";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useUpdateMerchant } from "@/hooks/graphql/mutations/useUpdateMerchant";
import { useGetCategories } from "@/hooks/graphql/queries/useGetCategories";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useFormDefaults } from "@/hooks/useFormDefaults";
import { useFormImageOverride } from "@/hooks/useFormImageOverride";
import type { Category } from "@/shared/api-client/src/graphql/queries/categories";
import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

export type MerchantFormData = {
  name: string;
  description: string;
  categoryId: string;
  logoUrl?: string;
  coverUrl?: string;
};

const isCategory = (value: unknown): value is Category => {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (!("id" in value) || !("name" in value) || !("slug" in value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string"
  );
};

export default function MerchantScreen() {
  const { t } = useTranslation();
  const { data: myMerchantsData, loading: loadingMerchant } =
    useGetMyMerchants();
  const { data: categoriesData } = useGetCategories();
  const [updateMerchant] = useUpdateMerchant();
  const { canWrite: canEditMerchant } = useFeatureAccess("merchant");
  const categories = useMemo(
    () => (categoriesData?.getCategories ?? []).filter(isCategory),
    [categoriesData?.getCategories],
  );

  const existingMerchant = myMerchantsData?.myMerchants?.[0];

  const defaultValues = useMemo<Partial<MerchantFormData>>(() => {
    if (!existingMerchant) return {};
    return {
      name: existingMerchant.name || "",
      description: existingMerchant.description || "",
      categoryId: existingMerchant.categoryId || "",
      logoUrl: existingMerchant.logoUrl || "",
      coverUrl: existingMerchant.coverUrl || "",
    };
  }, [existingMerchant]);

  const form = useForm<MerchantFormData>({
    defaultValues,
    mode: "onChange",
  });

  useFormDefaults({
    form,
    defaultValues,
    enabled: !!existingMerchant,
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

  const handleSubmit = async (data: MerchantFormData) => {
    if (!canEditMerchant) {
      return;
    }
    if (existingMerchant?.id) {
      const [logoUrl, coverUrl] = await Promise.all([
        logoPhoto.resolveUrlForSubmit(data.logoUrl),
        coverPhoto.resolveUrlForSubmit(data.coverUrl),
      ]);
      await updateMerchant({
        variables: {
          data: { ...data, logoUrl, coverUrl },
          merchantId: existingMerchant.id,
        },
      });
    }
    router.back();
  };

  if (loadingMerchant) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  const onSubmit = form.handleSubmit(handleSubmit);
  const canSubmit =
    canEditMerchant && form.formState.isValid && !form.formState.isSubmitting;

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="flex-grow-1"
    >
      <AppFormProvider
        form={form}
        editable={canEditMerchant}
        defaultValues={defaultValues}
        defaultValuesEnabled={!!existingMerchant}
      >
        <View className="flex-1 gap-4 p-4">
          <MerchantPhotosSection
            editing={!!existingMerchant}
            merchantName={form.watch("name") || existingMerchant?.name || ""}
            coverUri={coverPhoto.displayUri}
            logoUri={logoPhoto.displayUri}
            onCoverChange={coverPhoto.onPick}
            onLogoChange={logoPhoto.onPick}
            onCoverRemove={coverPhoto.onRemovePress}
            onLogoRemove={logoPhoto.onRemovePress}
          />

          <FormInput
            name="name"
            label={t("Merchant.companyName")}
            placeholder={t("Merchant.companyNamePlaceholder")}
            required
            variant="compact"
          />

          <CategorySelect
            name="categoryId"
            label={t("Merchant.category")}
            categories={categories}
            required
          />

          <FormInput
            name="description"
            label={t("Merchant.description")}
            placeholder={t("Merchant.descriptionPlaceholder")}
            multiline
            numberOfLines={4}
            variant="compact"
          />

          <ActionButtons
            onSubmit={canEditMerchant ? onSubmit : () => {}}
            onCancel={() => router.back()}
            submitButtonText={t("Common.save")}
            cancelButtonText={t("Common.cancel")}
            isSubmitting={form.formState.isSubmitting}
            canSubmit={canSubmit}
          />
        </View>
      </AppFormProvider>
    </KeyboardAwareScrollView>
  );
}
