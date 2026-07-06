import { createGraphQLFunction } from '../../client';
import { GET_BOTTOM_MENU_IMAGES_QUERY } from './query';
import { GetBottomMenuImagesResponse, BottomMenuImages } from './types';

export const getBottomMenuImages = createGraphQLFunction<GetBottomMenuImagesResponse, BottomMenuImages>(
  GET_BOTTOM_MENU_IMAGES_QUERY,
  data => data.bottomMenuImages,
  'Failed to load menu images',
);
