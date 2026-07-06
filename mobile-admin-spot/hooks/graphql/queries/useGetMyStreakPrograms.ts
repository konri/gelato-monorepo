import {
  GET_MY_STREAK_PROGRAMS_QUERY,
  type GetMyStreakProgramsResponse,
  type GetMyStreakProgramsVariables,
} from "@/shared/api-client/src/graphql/queries/streaks";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import { UseQueryOptions } from "./types";

type UseGetMyStreakProgramsOptions = UseQueryOptions & {
  storeId?: string | null;
};

export const useGetMyStreakPrograms = (options?: UseGetMyStreakProgramsOptions) => {
  const { selectedStoreId } = useOperatorAccess();
  const effectiveStoreId =
    options?.storeId !== undefined ? options.storeId : selectedStoreId;
  const variables: GetMyStreakProgramsVariables | undefined = effectiveStoreId
    ? { storeId: effectiveStoreId }
    : undefined;
  return useQueryWithErrorHandling<GetMyStreakProgramsResponse, GetMyStreakProgramsVariables>(
    GET_MY_STREAK_PROGRAMS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "GetMyStreakPrograms",
      variables,
    },
  );
};

