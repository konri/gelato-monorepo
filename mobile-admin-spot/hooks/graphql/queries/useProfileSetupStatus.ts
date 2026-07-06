import { useAuthState } from "@/hooks/useAuthState";
import {
    GET_PROFILE_SETUP_STATUS_QUERY,
    GetProfileSetupStatusResponse,
} from "@/shared/api-client/src/graphql/queries/profileSetupStatus";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

import { UseQueryOptions } from "./types";

export const useProfileSetupStatus = (options?: UseQueryOptions) => {
  const { isLoggedIn } = useAuthState();
  return useQueryWithErrorHandling<GetProfileSetupStatusResponse>(
    GET_PROFILE_SETUP_STATUS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: !isLoggedIn || options?.skip,
      operationName: "MyProfileSetupStatus",
    }
  );
};
