import type { OrderQueueFormValues } from "@/utils/merchantStoreOrderQueueForm";
import type { UseFormReturn } from "react-hook-form";

export type MerchantStoreOrderQueueFormProps = {
  form: UseFormReturn<OrderQueueFormValues>;
  storeDisplayName: string;
  onSubmit: () => void | Promise<void>;
  isSaving: boolean;
  canSubmit: boolean;
  onCancel: () => void;
};
