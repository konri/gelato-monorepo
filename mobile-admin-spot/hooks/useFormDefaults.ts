import { useEffect, useRef } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

type UseFormDefaultsOptions<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  defaultValues?: Partial<TFieldValues>;
  enabled?: boolean;
};

export const useFormDefaults = <TFieldValues extends FieldValues>({
  form,
  defaultValues,
  enabled = true,
}: UseFormDefaultsOptions<TFieldValues>) => {
  const hasInitializedRef = useRef(false);
  const previousDefaultValuesRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || !defaultValues) return;

    const hasData = Object.keys(defaultValues).length > 0;
    const defaultValuesString = JSON.stringify(defaultValues);
    const hasChanged = previousDefaultValuesRef.current !== defaultValuesString;

    if (hasData && (!hasInitializedRef.current || hasChanged)) {
      form.reset(defaultValues as TFieldValues);
      hasInitializedRef.current = true;
      previousDefaultValuesRef.current = defaultValuesString;
    }
  }, [form, defaultValues, enabled]);
};
