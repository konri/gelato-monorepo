import { Button } from "@/components/atoms/Button";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { FieldValues, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { FormProps } from "./types";

type ErrorResponse = {
  status?: number;
  message?: string;
  response?: { status?: number };
};

const getErrorStatus = (error: ErrorResponse): number | undefined => {
  return error?.status || error?.response?.status;
};

const ERROR_STATUS_MESSAGES: Record<number, string> = {
  409: "Validation.alreadyExists",
  401: "Validation.unauthorized",
  400: "Validation.invalidData",
};

const handleDefaultError = (error: unknown, t: (key: string) => string) => {
  const err = error as ErrorResponse;
  const status = getErrorStatus(err);

  if (status && ERROR_STATUS_MESSAGES[status]) {
    Alert.alert(t("Common.error"), t(ERROR_STATUS_MESSAGES[status]));
    return;
  }

  if (err?.message && err.message !== "Aborted") {
    Alert.alert(t("Common.error"), err.message);
  }
};

export const Form = <TFieldValues extends FieldValues = FieldValues>({
  form,
  children,
  onSubmit,
  successRoute,
  onError,
  submitButtonText,
  submitButtonStyle,
  className,
}: FormProps<TFieldValues>) => {
  const { t } = useTranslation();
  const config = useMemo(
    () => ({ onSubmit, successRoute, onError }),
    [onSubmit, successRoute, onError]
  );

  const handleSubmit = form.handleSubmit(async (data: any) => {
    try {
      await config.onSubmit(data);

      if (config.successRoute) {
        if (
          config.successRoute.startsWith("/(tabs)") ||
          config.successRoute === "/location" ||
          config.successRoute === "/"
        ) {
          router.replace(config.successRoute as never);
        } else {
          router.push(config.successRoute as never);
        }
      }
    } catch (error: unknown) {
      const handled = config.onError ? config.onError(error, form) : false;

      if (!handled) {
        handleDefaultError(error, t);
      }
    }
  });

  const isLoading = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <View className={className || "gap-4"}>
        {children}
        {submitButtonText && (
          <View className="items-center my-4">
            <Button
              title={isLoading ? t("Common.loading") : submitButtonText}
              onPress={handleSubmit}
              variant="primary"
              disabled={isLoading}
              width={submitButtonStyle?.width || "100%"}
              height={submitButtonStyle?.height || 56}
            />
          </View>
        )}
      </View>
    </FormProvider>
  );
};
