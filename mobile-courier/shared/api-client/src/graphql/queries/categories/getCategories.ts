import { createGraphQLFunction } from '../../client';
import { GET_CATEGORIES_QUERY } from './query';
import { GetCategoriesResponse, GetCategoriesResult } from './types';

export const getCategories = createGraphQLFunction<GetCategoriesResponse, GetCategoriesResult>(
  GET_CATEGORIES_QUERY,
  data => ({
    items: data.getCategories || [],
    total: data.getCategories?.length || 0,
  }),
  'Failed to load categories',
  'cache-first',
);
