import { createGraphQLFunction } from '../../client';
import { WHO_AM_I_QUERY } from './query';
import { GetWhoAmIResponse, UserData } from './types';

export const getWhoAmI = createGraphQLFunction<GetWhoAmIResponse, UserData>(
  WHO_AM_I_QUERY,
  data => data.me,
  'Failed to load user data',
);
