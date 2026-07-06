import { usePreviewCooperatorInvitation } from "@/hooks/graphql/queries/usePreviewCooperatorInvitation";
import { PENDING_COOPERATOR_INVITATION_TOKEN_KEY } from "@/utils/deepLink";
import { safeGetItem, safeRemoveItem } from "@/utils/safeAsyncStorage";
import { useEffect, useState } from "react";

export const usePendingInvitation = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const {
    data,
    loading,
    error,
  } = usePreviewCooperatorInvitation({
    token: token ?? undefined,
    skip: !token,
  });

  useEffect(() => {
    const loadToken = async () => {
      const stored = await safeGetItem(PENDING_COOPERATOR_INVITATION_TOKEN_KEY);
      setToken(stored && stored.length > 0 ? stored : null);
      setIsReady(true);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (!token || loading) {
      return;
    }
    const invitation = data?.previewCooperatorInvitation;
    if (invitation?.valid) {
      return;
    }
    if (error || invitation?.valid === false) {
      void safeRemoveItem(PENDING_COOPERATOR_INVITATION_TOKEN_KEY);
      setToken(null);
    }
  }, [data?.previewCooperatorInvitation, error, loading, token]);

  const hasPendingInvitation = Boolean(data?.previewCooperatorInvitation?.valid);

  return { token, isReady, hasPendingInvitation };
};
