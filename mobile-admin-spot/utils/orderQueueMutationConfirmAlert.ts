import type { TFunction } from "i18next";
import { Alert } from "react-native";

export type OrderQueueMutationConfirmAlertParams = {
  t: TFunction;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonStyle?: "destructive";
  onConfirm: () => void;
};

export function alertOrderQueueMutationConfirm(
  params: OrderQueueMutationConfirmAlertParams,
): void {
  const { t, title, message, confirmText, confirmButtonStyle, onConfirm } =
    params;
  Alert.alert(title, message, [
    { text: t("Common.cancel"), style: "cancel" },
    {
      text: confirmText,
      ...(confirmButtonStyle === "destructive"
        ? { style: "destructive" as const }
        : {}),
      onPress: onConfirm,
    },
  ]);
}
