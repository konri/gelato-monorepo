import { FormInput } from "@/components/atoms/FormInput";
import type { FormStep } from "@/components/organisms/MultiStepForm/types";
import { logger } from "@/utils/logger";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type SubscriptionFormData = {
  plan: string;
};

type UseSubscriptionStepProps = {
  onStepCompleted?: () => void;
};

export function useSubscriptionStep({
  onStepCompleted,
}: UseSubscriptionStepProps = {}): FormStep {
  const { t } = useTranslation();

  const defaultValues = useMemo<Partial<SubscriptionFormData>>(() => ({}), []);

  const form = useForm<SubscriptionFormData>({
    defaultValues: defaultValues as SubscriptionFormData,
    mode: "onChange",
  });

  const handleSubmit = async (data: SubscriptionFormData) => {
    if (data?.plan) {
      logger.log("Subscription selected:", data.plan);
    } else {
      logger.log("Subscription step completed without plan selection");
    }
    if (onStepCompleted) {
      await onStepCompleted();
    }
  };

  return {
    stepNumber: 4,
    title: t("Subscription.chooseSubscription"),
    form: form as any,
    fields: [
      {
        name: "plan",
        component: (
          <FormInput
            name="plan"
            label={t("Subscription.plan")}
            placeholder={t("Subscription.planPlaceholder")}
            required
            variant="compact"
          />
        ),
      },
    ],
    onSubmit: handleSubmit as any,
    submitButtonText: t("Common.continue"),
  };
}
