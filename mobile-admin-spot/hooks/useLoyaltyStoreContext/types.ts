import type { ConfirmModalProps } from "@/components/molecules/ConfirmModal/types";

type LoyaltyEditScope = "global" | "storeOverride";

export type NavigateToFormParams = {
  entityId?: string;
  scope?: LoyaltyEditScope;
  overrideStoreId?: string;
};

export type LoyaltyListEntity = "coupons" | "rewards" | "streaks";

export type LoyaltyStoreContextConfig = {
  loyaltyEntity: LoyaltyListEntity;
};

export type StoreContextDialog =
  | { mode: "edit"; entityId: string }
  | { mode: "create" }
  | null;

export type StoreContextModalProps = Pick<
  ConfirmModalProps,
  "visible" | "onClose" | "onConfirm" | "title" | "message" | "confirmText" | "cancelText"
>;
