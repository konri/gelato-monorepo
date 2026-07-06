import {
    ADD_STAMP_BY_USER_ID_MUTATION,
    type AddStampByUserIdResponse,
    type AddStampByUserIdVariables,
} from "@/shared/api-client/src/graphql/mutations/rewards";
import {
  GET_USER_STAMP_CARDS_QUERY,
  MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useAddStampByUserId = () => {
  return useMutationWithErrorHandling<
    AddStampByUserIdResponse,
    AddStampByUserIdVariables
  >(ADD_STAMP_BY_USER_ID_MUTATION, {
    operationName: "AddStampByUserId",
    awaitRefetchQueries: true,
    refetchQueries: [
      { query: GET_USER_STAMP_CARDS_QUERY },
      { query: MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY },
    ],
  });
};

