import { useAuthState } from "@/hooks/useAuthState";
import { Redirect } from "expo-router";

export default function Index() {
  const { isLoggedIn, isLoading } = useAuthState();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isLoggedIn ? "/(tabs)" : "/welcome"} />;
}
