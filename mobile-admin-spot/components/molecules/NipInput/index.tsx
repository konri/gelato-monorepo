import { FormInput } from "@/components/atoms/FormInput";
import { useGetCompanyByNip } from "@/hooks/graphql/queries/useGetCompanyByNip";
import { logger } from "@/utils/logger";
import {
  isValidPolishNip,
  normalizeNip,
  validateNipOrMessage,
} from "@/utils/nip";
import React, { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

type NipInputProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  onDataFetched?: (data: any) => void;
};

export const NipInput = ({
  name = "taxId",
  label,
  placeholder,
  onDataFetched,
}: NipInputProps) => {
  const { t } = useTranslation();
  const { watch, setValue, setError, clearErrors, formState } =
    useFormContext();
  const [getCompanyByNip, { loading: isLoading }] = useGetCompanyByNip();

  const taxIdValue = watch(name);
  const normalizedTaxId = useMemo(
    () => normalizeNip(taxIdValue ?? ""),
    [taxIdValue]
  );
  const initialTaxIdRef = useRef(normalizedTaxId);

  useEffect(() => {
    if (!formState.isDirty || !normalizedTaxId) return;
    if (initialTaxIdRef.current === normalizedTaxId) return;
    if (normalizedTaxId.length !== 10 || !isValidPolishNip(normalizedTaxId))
      return;

    let isActive = true;

    const fetchCompany = async () => {
      clearErrors(name);
      try {
        const result = await getCompanyByNip({
          variables: { nip: normalizedTaxId },
        });

        if (!isActive) return;

        const company = result.data?.getCompanyByNip;
        if (!company) {
          logger.warn("No company data returned for NIP:", normalizedTaxId);
          setError(name, {
            type: "manual",
            message: t("Validation.nipNotFound"),
          });
          return;
        }

        if (company.name) setValue("name", company.name);
        if (company.address) setValue("address", company.address);
        if (company.city) setValue("city", company.city);
        if (company.postalCode) setValue("postalCode", company.postalCode);
        setValue("country", "Poland");

        initialTaxIdRef.current = normalizedTaxId;
        onDataFetched?.(company);
      } catch (error) {
        logger.warn("Failed to fetch company by NIP:", error);
        setError(name, {
          type: "manual",
          message: t("Validation.nipFetchError"),
        });
      }
    };

    fetchCompany();
    return () => {
      isActive = false;
    };
  }, [
    normalizedTaxId,
    formState.isDirty,
    setValue,
    setError,
    clearErrors,
    onDataFetched,
    getCompanyByNip,
    name,
  ]);

  const nipValidation = (value: string): boolean | string => {
    const normalized = normalizeNip(value || "");

    if (normalized.length === 0) {
      return t("Validation.fieldRequired");
    }

    return validateNipOrMessage(value, t("Validation.nipInvalid"));
  };

  return (
    <View>
      <FormInput
        name={name}
        label={label || t("Company.taxId")}
        placeholder={placeholder || t("Company.taxIdPlaceholder")}
        required
        customValidation={{
          validate: nipValidation,
          message: t("Validation.nipInvalid"),
        }}
        keyboardType="numeric"
        variant="compact"
        rightIcon={
          isLoading ? (
            <ActivityIndicator size="small" color="#1A4196" />
          ) : undefined
        }
      />
    </View>
  );
};
