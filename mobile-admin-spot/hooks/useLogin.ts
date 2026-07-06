import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { replaceClearingDismissableStack } from "@/utils/replaceClearingDismissableStack";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type UseLoginOptions = {
  redirectTo?: string;
};

type LoginNavigationRoute =
  | "/(tabs)"
  | "/location"
  | "/"
  | "/cooperator-invitation"
  | `/cooperator-invitation?token=${string}`;

const isLoginNavigationRoute = (route: string): route is LoginNavigationRoute =>
  route === "/(tabs)" ||
  route === "/location" ||
  route === "/" ||
  route === "/cooperator-invitation" ||
  route.startsWith("/cooperator-invitation?token=");

const navigateToRoute = (route: LoginNavigationRoute) => {
  if (route === "/(tabs)" || route === "/location" || route === "/") {
    replaceClearingDismissableStack(route);
    return;
  }
  router.push(route);
};

export const useLogin = ({ redirectTo }: UseLoginOptions = {}) => {
  const { t } = useTranslation();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } =
    useGoogleSignIn();

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        const fallbackRoute: LoginNavigationRoute =
          result.isFirstTimeGoogleLogin ? "/location" : "/(tabs)";
        const targetRoute =
          redirectTo && isLoginNavigationRoute(redirectTo)
            ? redirectTo
            : fallbackRoute;
        navigateToRoute(targetRoute);
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
    handleGoogleLogin,
    handleAppleLogin,
  };
};
