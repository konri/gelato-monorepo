import { useWhoAmI } from "@/hooks/graphql/queries/useWhoAmI";
import { buildSignUpDetailsDefaultsFromUser } from "@/utils/signUpDetailsFormDefaults";
import { useMemo } from "react";

export const useEditProfileScreen = () => {
  const { data: whoData, loading: whoLoading } = useWhoAmI();
  const user = whoData?.whoAmI;
  const accountDefaults = useMemo(
    () => buildSignUpDetailsDefaultsFromUser(user),
    [user],
  );

  return { whoLoading, user, accountDefaults };
};
