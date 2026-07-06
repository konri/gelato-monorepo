import type { UserData } from "@/shared/api-client/src/graphql/queries/user/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type WhoUserInput = Partial<UserData> | null | undefined;

export const useProfileHubUserDisplay = (user: WhoUserInput) => {
  const { t } = useTranslation();

  const givenName = useMemo(() => {
    if (!user) {
      return t("AccountHub.fallbackUser");
    }
    const first = user.firstName?.trim() ?? "";
    const last = user.surname?.trim() ?? "";
    const combined = `${first} ${last}`.trim();
    if (combined) {
      return combined;
    }
    return user.name?.trim() || user.email || t("AccountHub.fallbackUser");
  }, [user, t]);

  const handleLabel = useMemo(() => {
    if (!user?.email) {
      return "";
    }
    const local = user.email.split("@")[0];
    return local ? `@${local}` : "";
  }, [user?.email]);

  return { givenName, handleLabel };
};
