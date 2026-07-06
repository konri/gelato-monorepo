import { Button } from "@/components/atoms/Button";
import { replaceClearingDismissableStack } from "@/utils/replaceClearingDismissableStack";
import { router, type Href } from "expo-router";
import React, { useMemo } from "react";
import { FieldValues, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { FormProps } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorStatus = (error: unknown): number | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }
  const status = error["status"];
  if (typeof status === "number") {
    return status;
  }
  const response = error["response"];
  if (!isRecord(response)) {
    return undefined;
  }
  const responseStatus = response["status"];
  return typeof responseStatus === "number" ? responseStatus : undefined;
};

const getErrorMessage = (error: unknown): string | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }
  const message = error["message"];
  return typeof message === "string" ? message : undefined;
};

const ERROR_STATUS_MESSAGES: Record<number, string> = {
  409: "Validation.alreadyExists",
  401: "Validation.unauthorized",
  400: "Validation.invalidData",
};

const handleDefaultError = (error: unknown, t: (key: string) => string) => {
  const status = getErrorStatus(error);

  if (status && ERROR_STATUS_MESSAGES[status]) {
    Alert.alert(t("Common.error"), t(ERROR_STATUS_MESSAGES[status]));
    return;
  }

  const msg = getErrorMessage(error);
  if (msg && msg !== "Aborted") {
    Alert.alert(t("Common.error"), msg);
  }
};

export const Form = <TFieldValues extends FieldValues = FieldValues>({
  form,
  children,
  onSubmit,
  successRoute,
  onError,
  submitButtonText,
  submitButtonSize = "md",
  submitButtonStyle,
  className,
}: FormProps<TFieldValues>) => {
  const { t } = useTranslation();
  const config = useMemo(
    () => ({ onSubmit, successRoute, onError }),
    [onSubmit, successRoute, onError]
  );

  const handleSubmit = form.handleSubmit(async (data: TFieldValues) => {
    try {
      await config.onSubmit(data);

      if (config.successRoute) {
        const path = config.successRoute;
        const href = path as Href;
        if (
          path.startsWith("/(tabs)") ||
          path === "/location" ||
          path === "/"
        ) {
          replaceClearingDismissableStack(href);
        } else {
          router.push(href);
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
              size={submitButtonSize}
              disabled={isLoading}
              width={submitButtonStyle?.width || "100%"}
              height={submitButtonStyle?.height}
            />
          </View>
        )}
      </View>
    </FormProvider>
  );
};
