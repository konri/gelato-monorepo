import { logger } from "@/utils/logger";
import { FieldValues } from "react-hook-form";

type UseCreateUpdateHandlerOptions<TFormData extends FieldValues> = {
  isEditing: boolean;
  existingId?: string;
  onCreate: (data: TFormData) => Promise<any>;
  onUpdate: (data: TFormData, id: string) => Promise<any>;
  refetchFn?: () => Promise<any>;
  onStepCompleted?: () => void | Promise<void>;
  entityName: string;
  validateBeforeSubmit?: (data: TFormData) => void | Promise<void>;
};

export function useCreateUpdateHandler<TFormData extends FieldValues>({
  isEditing,
  existingId,
  onCreate,
  onUpdate,
  refetchFn,
  onStepCompleted,
  entityName,
  validateBeforeSubmit,
}: UseCreateUpdateHandlerOptions<TFormData>) {
  return async (data: TFormData) => {
    if (validateBeforeSubmit) {
      await validateBeforeSubmit(data);
    }

    if (isEditing && existingId) {
      await onUpdate(data, existingId);
      if (refetchFn) {
        await refetchFn();
      }
      if (onStepCompleted) {
        await onStepCompleted();
      }
      logger.log(`${entityName} updated successfully`);
    } else {
      await onCreate(data);
      if (refetchFn) {
        await refetchFn();
      }
      if (onStepCompleted) {
        await onStepCompleted();
      }
      logger.log(`${entityName} created successfully`);
    }
  };
}

