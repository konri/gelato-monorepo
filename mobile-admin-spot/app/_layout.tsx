import "../translations";
import "./global.css";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppLanguageInitialization } from "@/hooks/useAppLanguageInitialization";
import { useCooperatorDeepLink } from "@/hooks/useCooperatorDeepLink";
import { useGoogleSignInConfig } from "@/hooks/useGoogleSignInConfig";
import { OperatorAccessProvider } from "@/hooks/useOperatorAccess";
// import { useNotificationHandling } from "@/hooks/useNotificationHandling";
import { getApolloClient } from "@/shared/api-client/src/graphql/apollo-client";
import { ApolloProvider } from "@apollo/client/react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

export default function RootLayout() {
  useGoogleSignInConfig();
  useCooperatorDeepLink();
  const isLanguageReady = useAppLanguageInitialization();

  // useNotificationHandling();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Urbanist: require("../assets/fonts/urbanist/static/Urbanist-Bold.ttf"),
    "Urbanist-ExtraLight": require("../assets/fonts/urbanist/static/Urbanist-ExtraLight.ttf"),
    "Urbanist-Light": require("../assets/fonts/urbanist/static/Urbanist-Light.ttf"),
  });

  if (!fontsLoaded || !isLanguageReady) {
    return null;
  }

  const apolloClient = getApolloClient();

  return (
    <GestureHandlerRootView className="flex-1">
      <ApolloProvider client={apolloClient}>
        <OperatorAccessProvider>
          <BottomSheetModalProvider>
            <SafeAreaProvider>
              <ErrorBoundary>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" options={{ headerShown: true }} />
                </Stack>
              </ErrorBoundary>
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </OperatorAccessProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
