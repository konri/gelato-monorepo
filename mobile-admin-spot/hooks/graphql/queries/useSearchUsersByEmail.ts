import { useMemo } from "react";
import {
  SEARCH_USERS_BY_EMAIL_QUERY,
  SearchUsersByEmailResponse,
} from "@/shared/api-client/src/graphql/queries/user";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseSearchUsersByEmailOptions = {
  email: string;
  limit?: number;
  skip?: boolean;
};

export const useSearchUsersByEmail = ({
  email,
  limit = 8,
  skip = false,
}: UseSearchUsersByEmailOptions) => {
  const normalizedEmail = useMemo(() => email.trim(), [email]);

  return useQueryWithErrorHandling<
    SearchUsersByEmailResponse,
    { email: string; limit: number }
  >(SEARCH_USERS_BY_EMAIL_QUERY, {
    operationName: "SearchUsersByEmail",
    fetchPolicy: "network-only",
    variables: { email: normalizedEmail, limit },
    skip: skip || normalizedEmail.length < 3,
  });
};
