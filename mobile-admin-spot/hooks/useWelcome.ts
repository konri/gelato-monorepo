import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { replaceClearingDismissableStack } from "@/utils/replaceClearingDismissableStack";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const useWelcome = () => {
  const { t } = useTranslation();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } =
    useGoogleSignIn();

  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        if (result.isFirstTimeGoogleLogin) {
          replaceClearingDismissableStack("/signup-details");
        } else {
          replaceClearingDismissableStack("/(tabs)");
        }
      }
    } catch (error) {
      Alert.alert(
        t("Common.error"),
        error instanceof Error ? error.message : t("Common.googleLoginFailed"),
      );
    }
  };

  const handleAppleLogin = async () => {
    Alert.alert(t("Common.error"), t("Common.appleNotImplemented"));
  };

  return {
    isGoogleLoading,
    handleSignUp,
    handleSignIn,
    handleGoogleLogin,
    handleAppleLogin,
  };
};
