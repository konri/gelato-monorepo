import { getCategories, GetCategoriesResult } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useCategories = () => {
  return useGraphQLQuery<GetCategoriesResult>(
    getCategories,
    {},
    []
  );
};
