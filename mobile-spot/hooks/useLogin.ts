import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useLogin = () => {
  const { t } = useTranslation();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } =
    useGoogleSignIn();

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        if (result.isFirstTimeGoogleLogin) {
          router.replace("/location");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      Alert.alert(
        t("Common.error"),
        error instanceof Error ? error.message : t("Common.googleLoginFailed")
      );
    }
  };

  const handleAppleLogin = async () => {
    Alert.alert(t("Common.error"), t("Common.appleNotImplemented"));
  };

  return {
    isGoogleLoading,
    handleGoogleLogin,
    handleAppleLogin,
  };
};
