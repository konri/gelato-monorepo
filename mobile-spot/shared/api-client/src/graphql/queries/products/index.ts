import { createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { PRODUCT_DETAIL_QUERY, SPOT_PRODUCTS_QUERY } from './query';
import { Product, ProductDetailResponse, SpotProductsResponse } from './types';

export * from './types';

export const getSpotProducts = async (
  spotId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Product[]>> =>
  createGraphQLFunction<SpotProductsResponse, Product[]>(
    SPOT_PRODUCTS_QUERY,
    data => data.spotProducts,
    'Failed to load products',
  )({ ...options, variables: { spotId, includeUnavailable: false } });

export const getProductById = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Product | null>> =>
  createGraphQLFunction<ProductDetailResponse, Product | null>(
    PRODUCT_DETAIL_QUERY,
    data => data.product,
    'Failed to load product',
  )({ ...options, variables: { id } });
