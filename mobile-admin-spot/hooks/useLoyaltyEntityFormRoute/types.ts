export type LoyaltyEntityFormRouteInput = {
  entityId: string | undefined;
  loyaltyEditScope: string | undefined;
  overrideStoreId: string | undefined;
  selectedStoreId: string | null | undefined;
  canEditGlobal: boolean;
  canEditStoreOverrides: boolean;
};

export type LoyaltyEntityFormRouteResult = {
  isEditMode: boolean;
  isStoreOverrideEdit: boolean;
  isStoreContextCreate: boolean;
  canMutate: boolean;
  resolvedStoreId: string | undefined;
  overrideStoreId: string | undefined;
  scopeCreateStoreId: string | undefined;
};
