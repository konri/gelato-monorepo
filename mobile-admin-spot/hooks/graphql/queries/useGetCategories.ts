import {
    GET_CATEGORIES_QUERY,
    GetCategoriesResponse,
} from "@/shared/api-client/src/graphql/queries/categories";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

export const useGetCategories = () => {
  return useQueryWithErrorHandling<GetCategoriesResponse>(GET_CATEGORIES_QUERY, {
    fetchPolicy: "cache-first",
    operationName: "GetCategories",
  });
};
