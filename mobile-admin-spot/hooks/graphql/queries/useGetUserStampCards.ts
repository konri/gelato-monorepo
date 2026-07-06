import {
    GET_USER_STAMP_CARDS_QUERY,
    type GetUserStampCardsResponse,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseGetUserStampCardsOptions = {
    userId: string;
    skip?: boolean;
};

export const useGetUserStampCards = ({ userId, skip = false }: UseGetUserStampCardsOptions) => {
  return useQueryWithErrorHandling<GetUserStampCardsResponse, { userId: string }>(
    GET_USER_STAMP_CARDS_QUERY,
    {
      operationName: "GetUserStampCards",
      fetchPolicy: "network-only",
      variables: { userId },
      skip: skip || !userId,
    }
  );
};
