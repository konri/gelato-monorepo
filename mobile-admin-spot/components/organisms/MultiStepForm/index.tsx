import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { FormSection } from "@/components/molecules/FormSection";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { logger } from "@/utils/logger";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { ActionButtons } from "./ActionButtons";
import { NavigationButtons } from "./NavigationButtons";
import { MultiStepFormProps } from "./types";

export const MultiStepForm = ({
  title,
  steps,
  onSubmit,
  onCancel,
  submitButtonText,
  cancelButtonText,
  currentStep: controlledStep,
  onStepChange,
  initialStep = 1,
  initialCompletedSteps = new Set(),
}: MultiStepFormProps) => {
  const [internalStep, setInternalStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    initialCompletedSteps
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set([initialStep])
  );

  const syncedPropsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const completedSorted = [...initialCompletedSteps].sort((a, b) => a - b);
    const key = `${initialStep}:${completedSorted.join(",")}`;
    if (syncedPropsKeyRef.current === key) {
      return;
    }
    syncedPropsKeyRef.current = key;
    setInternalStep(initialStep);
    setCompletedSteps(new Set(initialCompletedSteps));
    setExpandedSteps(new Set([initialStep]));
  }, [initialStep, initialCompletedSteps]);

  const totalSteps = steps.length;
  const currentStep = Math.min(controlledStep ?? internalStep, totalSteps);
  const isLastStep = currentStep === totalSteps;
  const canGoBack = currentStep > 1;

  const currentStepData = steps[currentStep - 1];
  const currentForm = currentStepData.form;

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      next.has(stepNumber) ? next.delete(stepNumber) : next.add(stepNumber);
      return next;
    });
  };

  const goToStep = (newStep: number) => {
    if (controlledStep === undefined) {
      setInternalStep(newStep);
    }
    onStepChange?.(newStep);
  };

  const handleStepNext = async (stepNumber: number) => {
    const stepData = steps[stepNumber - 1];
    const stepForm = stepData.form;

    if (stepData.fields?.length) {
      const fieldNames = stepData.fields.map((f) => f.name);
      const isValid = await stepForm.trigger(fieldNames as any[]);
      if (!isValid) {
        return;
      }
    }

    if (stepData.validate && !(await stepData.validate(stepForm))) {
      return;
    }

    if (stepData.onSubmit) {
      const formData = stepForm.getValues();
      try {
        await stepData.onSubmit(formData);
        setCompletedSteps((prev) => new Set(prev).add(stepNumber));

        if (stepNumber === totalSteps) {
          router.replace("/(tabs)");
          return;
        }

        if (stepNumber < totalSteps) {
          setExpandedSteps((prev) => {
            const next = new Set(prev);
            next.delete(stepNumber);
            next.add(stepNumber + 1);
            return next;
          });
          goToStep(stepNumber + 1);
        }
      } catch (error) {
        logger.error("Step submit error:", error);
        throw error;
      }
    } else {
      setCompletedSteps((prev) => new Set(prev).add(stepNumber));

      if (stepNumber === totalSteps) {
        router.push("/company/onboarding/loyalty-setup");
        return;
      }

      if (stepNumber < totalSteps) {
        setExpandedSteps((prev) => {
          const next = new Set(prev);
          next.delete(stepNumber);
          next.add(stepNumber + 1);
          return next;
        });
        goToStep(stepNumber + 1);
      }
    }
  };

  const handleStepBack = (stepNumber: number) => {
    if (stepNumber > 1) {
      setExpandedSteps((prev) => {
        const next = new Set(prev);
        next.delete(stepNumber);
        next.add(stepNumber - 1);
        return next;
      });
      goToStep(stepNumber - 1);
    }
  };

  const handleNext = async () => {
    await handleStepNext(currentStep);
  };

  const handleBack = () => {
    handleStepBack(currentStep);
  };

  const canGoNext = useMemo(() => {
    const fields = currentStepData?.fields;
    if (!fields?.length) return true;

    const fieldNames = fields.map((f) => f.name);
    const errors = currentForm.formState.errors;
    return !fieldNames.some((name) => errors[name]);
  }, [currentStepData, currentForm.formState.errors]);

  const getStepCanGoNext = (stepData: (typeof steps)[0]) => {
    const fields = stepData.fields;
    if (!fields?.length) return true;
    const fieldNames = fields.map((f) => f.name);
    const errors = stepData.form.formState.errors;
    return !fieldNames.some((name) => errors[name]);
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardVerticalOffset={90}
    >
      <View className="px-6 pt-6 pb-4 gap-4">
        {title && (
          <View className="px-0 py-4 gap-2.5">
            <Typography variant="text-18-black-spaced" className="text-black">
              {title}
            </Typography>
          </View>
        )}

        <View className="gap-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = completedSteps.has(stepNumber);
            const isExpanded = expandedSteps.has(stepNumber);
            const canAccess =
              stepNumber === 1 ||
              completedSteps.has(stepNumber - 1) ||
              stepNumber <= currentStep;

            const isStepLast = stepNumber === totalSteps;
            const navigationButtons =
              isExpanded && canAccess && !isStepLast ? (
                <NavigationButtons
                  onBack={() => handleStepBack(stepNumber)}
                  onNext={() => handleStepNext(stepNumber)}
                  canGoBack={stepNumber > 1}
                  canGoNext={getStepCanGoNext(step)}
                  nextButtonText={undefined}
                />
              ) : undefined;

            const renderFields = () => {
              return (
                <AppFormProvider form={step.form}>
                  <View className="gap-2.5">
                    {step.fields.map((field) => (
                      <View key={field.name}>{field.component}</View>
                    ))}
                  </View>
                </AppFormProvider>
              );
            };

            return (
              <FormSection
                key={stepNumber}
                stepNumber={stepNumber}
                title={step.title}
                subtitle={step.subtitle}
                isCompleted={isCompleted}
                isActive={isActive}
                isExpanded={isExpanded && canAccess}
                showConnector={true}
                navigationButtons={navigationButtons}
                onTitlePress={() => {
                  if (canAccess) {
                    toggleStep(stepNumber);
                    goToStep(stepNumber);
                  }
                }}
              >
                {canAccess ? renderFields() : null}
              </FormSection>
            );
          })}
        </View>
        {isLastStep && (
          <View className="pt-4">
            <ActionButtons
              onSubmit={async () => {
                if (currentStepData.onSubmit) {
                  const formData = currentForm.getValues();
                  try {
                    await currentStepData.onSubmit(formData);
                    setCompletedSteps((prev) => new Set(prev).add(currentStep));
                    await onSubmit?.();
                    if (currentStep === totalSteps) {
                      router.replace("/(tabs)");
                    }
                  } catch (error) {
                    logger.error("Step submit error:", error);
                    throw error;
                  }
                } else {
                  await currentForm.handleSubmit(async () => {
                    try {
                      await onSubmit?.();
                    } catch (error) {
                      logger.error("Submit error:", error);
                      throw error;
                    }
                  })();
                }
              }}
              onCancel={onCancel}
              submitButtonText={
                currentStepData.submitButtonText || submitButtonText
              }
              cancelButtonText={cancelButtonText}
              isSubmitting={currentForm.formState.isSubmitting}
              canSubmit={canGoNext}
            />
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
};
