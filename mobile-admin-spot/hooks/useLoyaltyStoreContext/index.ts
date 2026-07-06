import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { OperatorAccessContextValue } from "@/hooks/useOperatorAccess/types";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type {
  LoyaltyStoreContextConfig,
  NavigateToFormParams,
  StoreContextDialog,
  StoreContextModalProps,
} from "./types";
import { navigateToLoyaltyForm } from "./utils";

const getEditCapabilities = (
  loyaltyEntity: LoyaltyStoreContextConfig["loyaltyEntity"],
  operator: OperatorAccessContextValue,
) => {
  switch (loyaltyEntity) {
    case "coupons":
      return {
        canEditGlobal: operator.canEditGlobalCoupons,
        canEditStoreOverrides: operator.canEditCouponStoreOverrides,
      };
    case "rewards":
      return {
        canEditGlobal: operator.canEditGlobalRewards,
        canEditStoreOverrides: operator.canEditRewardStoreOverrides,
      };
    case "streaks":
      return {
        canEditGlobal: operator.canEditGlobalStreaks,
        canEditStoreOverrides: operator.canEditStreakStoreOverrides,
      };
  }
};

export const useLoyaltyStoreContext = ({
  loyaltyEntity,
}: LoyaltyStoreContextConfig) => {
  const { t } = useTranslation();
  const operator = useOperatorAccess();
  const { availableStores, selectedStoreId, hasAnyMerchantAccess } = operator;
  const { canEditGlobal, canEditStoreOverrides } = getEditCapabilities(
    loyaltyEntity,
    operator,
  );

  const navigateToForm = useCallback(
    (params: NavigateToFormParams) => {
      navigateToLoyaltyForm(loyaltyEntity, params);
    },
    [loyaltyEntity],
  );

  const [storeContextDialog, setStoreContextDialog] =
    useState<StoreContextDialog>(null);

  const storeNameById = useMemo(
    () => new Map(availableStores.map((store) => [store.id, store.name])),
    [availableStores],
  );

  const getScopeLabel = useCallback(
    (availableStoreIds: string[] | undefined | null) => {
      if ((availableStoreIds?.length ?? 0) === 0) {
        return t("LoyaltyConfig.scopeGlobal");
      }
      return t("LoyaltyConfig.scopeStoreOnly", {
        storeNames: (availableStoreIds ?? [])
          .map((storeId) => storeNameById.get(storeId))
          .filter((name): name is string => Boolean(name))
          .join(", "),
      });
    },
    [storeNameById, t],
  );

  const openStoreOverride = useCallback(
    (entityId: string) => {
      if (availableStores.length === 0) {
        return;
      }
      if (availableStores.length === 1) {
        navigateToForm({
          entityId,
          scope: "storeOverride",
          overrideStoreId: availableStores[0].id,
        });
        return;
      }
      Alert.alert(t("LoyaltyConfig.pickStoreForOverride"), undefined, [
        ...availableStores.map((store) => ({
          text: store.name,
          onPress: () =>
            navigateToForm({
              entityId,
              scope: "storeOverride",
              overrideStoreId: store.id,
            }),
        })),
        { text: t("Common.cancel"), style: "cancel" as const },
      ]);
    },
    [availableStores, navigateToForm, t],
  );

  const openSelectedStoreOverride = useCallback(
    (entityId: string) => {
      if (!selectedStoreId) {
        openStoreOverride(entityId);
        return;
      }
      navigateToForm({
        entityId,
        scope: "storeOverride",
        overrideStoreId: selectedStoreId,
      });
    },
    [navigateToForm, openStoreOverride, selectedStoreId],
  );

  const handleSelectEntity = useCallback(
    (entityId: string) => {
      if (selectedStoreId && canEditStoreOverrides) {
        const hasAlternativeEditPath =
          canEditGlobal || availableStores.length > 1;
        if (hasAlternativeEditPath) {
          setStoreContextDialog({ mode: "edit", entityId });
          return;
        }
        openSelectedStoreOverride(entityId);
        return;
      }
      if (canEditGlobal) {
        navigateToForm({ entityId, scope: "global" });
        return;
      }
      if (canEditStoreOverrides) {
        openStoreOverride(entityId);
        return;
      }
      navigateToForm({ entityId, scope: "global" });
    },
    [
      availableStores.length,
      canEditGlobal,
      canEditStoreOverrides,
      navigateToForm,
      openSelectedStoreOverride,
      openStoreOverride,
      selectedStoreId,
    ],
  );

  const handleCreateEntity = useCallback(() => {
    if (!selectedStoreId) {
      navigateToForm({});
      return;
    }
    setStoreContextDialog({ mode: "create" });
  }, [navigateToForm, selectedStoreId]);

  const isCreateDisabled = selectedStoreId
    ? !canEditStoreOverrides
    : !canEditGlobal;

  const closeDialog = useCallback(() => setStoreContextDialog(null), []);

  const confirmDialog = useCallback(() => {
    if (!storeContextDialog) {
      return;
    }
    const dialog = storeContextDialog;
    setStoreContextDialog(null);
    if (dialog.mode === "create") {
      navigateToForm({});
    } else {
      openSelectedStoreOverride(dialog.entityId);
    }
  }, [navigateToForm, openSelectedStoreOverride, storeContextDialog]);

  const storeContextModalProps: StoreContextModalProps = {
    visible: storeContextDialog !== null,
    onClose: closeDialog,
    onConfirm: confirmDialog,
    title:
      storeContextDialog?.mode === "create"
        ? t("LoyaltyConfig.storeContextCreateConfirmationTitle")
        : t("LoyaltyConfig.storeContextEditConfirmationTitle"),
    message:
      storeContextDialog && selectedStoreId
        ? storeContextDialog.mode === "create"
          ? t("LoyaltyConfig.storeContextCreateConfirmationMessage", {
              storeName:
                storeNameById.get(selectedStoreId) ?? selectedStoreId,
            })
          : t("LoyaltyConfig.storeContextEditConfirmationMessage", {
              storeName:
                storeNameById.get(selectedStoreId) ?? selectedStoreId,
            })
        : undefined,
    confirmText:
      storeContextDialog?.mode === "create"
        ? t("LoyaltyConfig.confirmStoreContextCreate")
        : t("LoyaltyConfig.confirmStoreContextEdit"),
    cancelText: t("Common.cancel"),
  };

  return {
    hasAnyMerchantAccess,
    selectedStoreId,
    canEditGlobal,
    canEditStoreOverrides,
    getScopeLabel,
    handleSelectEntity,
    handleCreateEntity,
    isCreateDisabled,
    storeContextModalProps,
  };
};
