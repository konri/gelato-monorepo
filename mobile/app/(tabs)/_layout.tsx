import { StandardTabsLayout } from "@/components/organisms/StandardTabsLayout";
import { useAuthState } from "@/hooks/useAuthState";
import { useNotificationRegistration } from "@/hooks/useNotificationRegistration";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function TabsLayout() {
  const { isLoggedIn, isLoading } = useAuthState();
  
  // Register device for push notifications after login
  // Hook is always called, but registration only happens when logged in
  useNotificationRegistration();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/welcome" />;
  }

  return <StandardTabsLayout />;
}
