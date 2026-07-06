import { FormInput } from "@/components/atoms/FormInput";
import { NipInput } from "@/components/molecules/NipInput";
import type { FormStep } from "@/components/organisms/MultiStepForm/types";
import { useCreateCompany } from "@/hooks/graphql/mutations/useCreateCompany";
import { useUpdateCompany } from "@/hooks/graphql/mutations/useUpdateCompany";
import { useGetMyCompany } from "@/hooks/graphql/queries/useGetMyCompany";
import { useFormDefaults } from "@/hooks/useFormDefaults";
import { CompanyInput } from "@/shared/api-client/src/graphql/mutations/company";
import type { Company } from "@/shared/api-client/src/graphql/queries/company/types";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCreateUpdateHandler } from "./useCreateUpdateHandler";

export type CompanyFormData = Omit<CompanyInput, "cityOperate"> & {
  cityOperate?: string | string[];
};

type UseCompanyStepProps = {
  company: Company | null | undefined;
  hasCompanyAccess: boolean;
  onStepCompleted?: () => void;
};

export function useCompanyStep({
  company: companyFromProps,
  hasCompanyAccess,
  onStepCompleted,
}: UseCompanyStepProps) {
  const { t } = useTranslation();
  const { data: companyData, loading: isLoading } = useGetMyCompany({
    skip: !hasCompanyAccess,
  });
  const [createCompany] = useCreateCompany({
    onCompanyCreated: onStepCompleted,
  });
  const [updateCompany] = useUpdateCompany();

  const company = hasCompanyAccess
    ? companyData?.getMyCompany
    : companyFromProps;
  const isEditing = !!company?.id;

  const defaultValues = useMemo<Partial<CompanyFormData>>(() => {
    if (!company) return {};
    return {
      name: company.name || "",
      taxId: company.taxId || "",
      address: company.address || "",
      city: company.city || "",
      postalCode: company.postalCode || "",
      country: company.country || "",
      cityOperate: company.cityOperate || [],
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      facebook: company.facebook || "",
      instagram: company.instagram || "",
      tiktok: company.tiktok || "",
    };
  }, [company]);

  const form = useForm<CompanyFormData>({
    defaultValues: defaultValues as CompanyFormData,
    mode: "onChange",
  });

  useFormDefaults({
    form,
    defaultValues,
    enabled: true,
  });

  const handleSubmit = useCreateUpdateHandler<CompanyFormData>({
    isEditing,
    existingId: company?.id,
    onCreate: async (data) => {
      const cityOperateArray =
        typeof data.cityOperate === "string"
          ? data.cityOperate
              .split(",")
              .map((city: string) => city.trim())
              .filter(Boolean)
          : data.cityOperate || [];

      await createCompany({
        variables: {
          data: {
            ...data,
            cityOperate: cityOperateArray,
          },
        },
      });
    },
    onUpdate: async (data) => {
      const cityOperateArray =
        typeof data.cityOperate === "string"
          ? data.cityOperate
              .split(",")
              .map((city: string) => city.trim())
              .filter(Boolean)
          : data.cityOperate || [];

      await updateCompany({
        variables: {
          data: {
            ...data,
            cityOperate: cityOperateArray,
          },
        },
      });
    },
    onStepCompleted,
    entityName: "Company",
  });

  const step: FormStep = {
    stepNumber: 1,
    title: t("Company.nipData"),
    subtitle: t("Company.nipDataSubtitle"),
    form: form as any,
    fields: [
      {
        name: "taxId",
        component: <NipInput name="taxId" />,
      },
      {
        name: "name",
        component: (
          <FormInput
            name="name"
            label={t("Company.companyName")}
            placeholder={t("Company.companyNamePlaceholder")}
            editable={false}
            variant="compact"
          />
        ),
      },
      {
        name: "address",
        component: (
          <FormInput
            name="address"
            label={t("Company.streetAddress")}
            placeholder={t("Company.streetAddressPlaceholder")}
            editable={false}
            variant="compact"
          />
        ),
      },
      {
        name: "city",
        component: (
          <FormInput
            name="city"
            label={t("Company.city")}
            placeholder={t("Company.cityPlaceholder")}
            editable={false}
            variant="compact"
          />
        ),
      },
      {
        name: "postalCode",
        component: (
          <FormInput
            name="postalCode"
            label={t("Company.postalCode")}
            placeholder={t("Company.postalCodePlaceholder")}
            editable={false}
            variant="compact"
          />
        ),
      },
      {
        name: "country",
        component: (
          <FormInput
            name="country"
            label={t("Company.country")}
            placeholder={t("Company.countryPlaceholder")}
            editable={false}
            variant="compact"
          />
        ),
      },
    ],
    onSubmit: handleSubmit as any,
    submitButtonText: isEditing
      ? t("Company.updateCompany")
      : t("Company.createCompany"),
  };

  return {
    step,
    isLoading,
    isSubmitting: form.formState.isSubmitting,
    canSubmit: form.formState.isValid,
  };
}
