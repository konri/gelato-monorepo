import { StandardTabsLayout } from "@/components/organisms/StandardTabsLayout";
import { useAuthState } from "@/hooks/useAuthState";
import { Redirect } from "expo-router";

export default function TabsLayout() {
  const { isLoggedIn, isLoading } = useAuthState();

  if (isLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href="/welcome" />;
  }

  return <StandardTabsLayout />;
}
