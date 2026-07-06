import { executeGraphQLQuery } from '../../client';
import { UPDATE_PROFILE_MUTATION } from './mutation';
import { UpdateProfileResponse, UserProfileData, UpdateProfileOptions } from './types';

export const updateProfile = async (options: UpdateProfileOptions) => {
  const { data, ...apolloOptions } = options;

  const result = await executeGraphQLQuery<UpdateProfileResponse>(UPDATE_PROFILE_MUTATION, {
    ...apolloOptions,
    variables: { data }
  });

  return {
    ...result,
    data: result.data ? result.data.updateProfile : null
  };
};
