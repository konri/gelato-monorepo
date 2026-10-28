import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  SPOT_TASTES_QUERY,
  SPOT_PRODUCTS_QUERY,
  CREATE_TASTE_MUTATION,
  UPDATE_TASTE_MUTATION,
  UPDATE_TASTE_AVAILABILITY_MUTATION,
  DELETE_TASTE_MUTATION,
  CREATE_PRODUCT_MUTATION,
  UPDATE_PRODUCT_MUTATION,
  SPOT_MENU_CATEGORIES_QUERY,
  CREATE_MENU_CATEGORY_MUTATION,
  UPDATE_PRODUCT_AVAILABILITY_MUTATION,
  DELETE_PRODUCT_MUTATION,
  BRAND_MENU_SOURCES_QUERY,
  MENU_TO_COPY_QUERY,
  COPY_SPOT_MENU_MUTATION,
} from './query';
import {
  MenuTaste,
  MenuProduct,
  MenuCategory,
  ManagedTastesResponse,
  ManagedProductsResponse,
  MenuCategoriesResponse,
  MenuSourceSpot,
  MenuCopyPreview,
  CopySpotMenuResult,
} from './types';

export * from './types';

export const getManagedTastes = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<MenuTaste[]>> => {
  const res = await executeGraphQLQuery<ManagedTastesResponse>(SPOT_TASTES_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotTastes : null };
};

export const getManagedProducts = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<MenuProduct[]>> => {
  const res = await executeGraphQLQuery<ManagedProductsResponse>(SPOT_PRODUCTS_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotProducts : null };
};

// Generic mutation runner (all menu mutations return a simple ok/id shape).
const run = async (query: any, variables: Record<string, unknown>, options: ApolloServerConfig) => {
  const res = await executeGraphQLQuery<any>(query, { ...options, variables });
  return { ...res, data: res.error ? null : res.data };
};

export const createTaste = (vars: Record<string, unknown>, o: ApolloServerConfig = {}) =>
  run(CREATE_TASTE_MUTATION, vars, o);
export const updateTaste = (vars: Record<string, unknown>, o: ApolloServerConfig = {}) =>
  run(UPDATE_TASTE_MUTATION, vars, o);
export const updateTasteAvailability = (id: string, isAvailable: boolean, o: ApolloServerConfig = {}) =>
  run(UPDATE_TASTE_AVAILABILITY_MUTATION, { id, isAvailable }, o);
export const deleteTaste = (id: string, o: ApolloServerConfig = {}) =>
  run(DELETE_TASTE_MUTATION, { id }, o);

export const getSpotMenuCategories = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<MenuCategory[]>> => {
  const res = await executeGraphQLQuery<MenuCategoriesResponse>(SPOT_MENU_CATEGORIES_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.spotMenuCategories : null };
};

export const createMenuCategory = (vars: Record<string, unknown>, o: ApolloServerConfig = {}) =>
  run(CREATE_MENU_CATEGORY_MUTATION, vars, o);

export const createProduct = (vars: Record<string, unknown>, o: ApolloServerConfig = {}) =>
  run(CREATE_PRODUCT_MUTATION, vars, o);
export const updateProduct = (vars: Record<string, unknown>, o: ApolloServerConfig = {}) =>
  run(UPDATE_PRODUCT_MUTATION, vars, o);
export const updateProductAvailability = (id: string, isAvailable: boolean, o: ApolloServerConfig = {}) =>
  run(UPDATE_PRODUCT_AVAILABILITY_MUTATION, { id, isAvailable }, o);
export const deleteProduct = (id: string, o: ApolloServerConfig = {}) =>
  run(DELETE_PRODUCT_MUTATION, { id }, o);

export const getBrandMenuSources = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<MenuSourceSpot[]>> => {
  const res = await executeGraphQLQuery<{ brandMenuSources: MenuSourceSpot[] }>(BRAND_MENU_SOURCES_QUERY, {
    ...options,
    variables: { spotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.brandMenuSources : null };
};

export const getMenuToCopy = async (
  targetSpotId: string,
  sourceSpotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<MenuCopyPreview>> => {
  const res = await executeGraphQLQuery<{ menuToCopy: MenuCopyPreview }>(MENU_TO_COPY_QUERY, {
    ...options,
    variables: { targetSpotId, sourceSpotId },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.menuToCopy : null };
};

export const copySpotMenu = async (
  vars: { targetSpotId: string; sourceSpotId: string; tasteIds: string[]; productIds: string[] },
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<CopySpotMenuResult>> => {
  const res = await executeGraphQLQuery<{ copySpotMenu: CopySpotMenuResult }>(COPY_SPOT_MENU_MUTATION, {
    ...options,
    variables: vars,
  });
  return { ...res, data: res.data ? res.data.copySpotMenu : null };
};
