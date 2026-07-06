import type { Category } from '@repo/types/category';
import { ApolloServerConfig } from '../../types';

export type GetCategoriesResult = {
  items: Category[];
  total: number;
};

export type GetCategoriesResponse = {
  getCategories: Category[];
};

export type GetCategoriesOptions = ApolloServerConfig;
