import { Alert } from "react-native";

export const showBackendPendingAlert = (
  t: (key: string) => string,
  messageKey: string,
) => {
  Alert.alert(t("AccountHub.backendPendingTitle"), t(messageKey));
};
