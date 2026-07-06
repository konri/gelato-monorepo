import { useFormDefaults } from "@/hooks/useFormDefaults";
import React, { createContext, useContext, useMemo } from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";

type FormEditableContextValue = {
  editable: boolean;
};

const FormEditableContext = createContext<FormEditableContextValue | null>(null);

export const useFormEditable = (): boolean => {
  const context = useContext(FormEditableContext);
  return context?.editable ?? true;
};

export const useResolvedEditable = (explicitEditable?: boolean): boolean => {
  const contextEditable = useFormEditable();
  return explicitEditable ?? contextEditable;
};

type AppFormProviderProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  editable?: boolean;
  defaultValues?: Partial<TFieldValues>;
  defaultValuesEnabled?: boolean;
  children: React.ReactNode;
};

export const AppFormProvider = <TFieldValues extends FieldValues>({
  form,
  editable = true,
  defaultValues,
  defaultValuesEnabled,
  children,
}: AppFormProviderProps<TFieldValues>) => {
  useFormDefaults({
    form,
    defaultValues,
    enabled: defaultValuesEnabled ?? (defaultValues !== undefined),
  });

  const editableValue = useMemo(() => ({ editable }), [editable]);

  return (
    <FormEditableContext.Provider value={editableValue}>
      <FormProvider {...form}>
        {children}
      </FormProvider>
    </FormEditableContext.Provider>
  );
};
