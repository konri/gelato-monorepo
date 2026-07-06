import { uploadSingleFile } from "@/shared/api-client/src/api/upload";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form";

type OptionalUnsetPath<T extends FieldValues> = {
  [P in FieldPath<T>]: undefined extends PathValue<T, P> ? P : never;
}[FieldPath<T>];

type UseFormImageOverrideParams<T extends FieldValues, K extends OptionalUnsetPath<T>> = {
  form: UseFormReturn<T>;
  fieldName: K;
  resetKey?: string | null;
};

function normalizeOptionalImageUrl(
  value: string | undefined | null,
): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function useFormImageOverride<T extends FieldValues, K extends OptionalUnsetPath<T>>({
  form,
  fieldName,
  resetKey,
}: UseFormImageOverrideParams<T, K>) {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    setPickedUri(null);
    setRemoved(false);
  }, [resetKey]);

  const raw = form.watch(fieldName);
  const formUrl = useMemo(() => {
    if (typeof raw !== "string" || raw.length === 0) {
      return null;
    }
    return raw;
  }, [raw]);

  const displayUri = removed ? null : (pickedUri ?? formUrl);

  const onPick = useCallback((uri: string) => {
    setRemoved(false);
    setPickedUri(uri);
  }, []);

  const onRemove = useCallback(() => {
    setPickedUri(null);
    setRemoved(true);
    form.setValue(fieldName, undefined as PathValue<T, K>, { shouldDirty: true });
  }, [form, fieldName]);

  const onRemovePress = displayUri ? onRemove : undefined;

  const resolveUrlForSubmit = useCallback(
    async (currentFormValue: string | undefined | null) => {
      if (pickedUri) {
        const r = await uploadSingleFile({ uri: pickedUri });
        return normalizeOptionalImageUrl(r.data?.filePath ?? currentFormValue);
      }
      if (removed) {
        return undefined;
      }
      return normalizeOptionalImageUrl(currentFormValue);
    },
    [pickedUri, removed],
  );

  return {
    displayUri,
    onPick,
    onRemovePress,
    resolveUrlForSubmit,
  };
}
