import { executeGraphQLQuery } from '../client';
import { getCities } from '../queries/tastes';
import { UPDATE_PROFILE_MUTATION } from './profile/mutation';
import { ApolloServerConfig, GraphQLResult } from '../types';

export type UpdatePermissionsResult = {
  id: string;
  preferredCityId: string | null;
};

type UpdateProfileResponse = {
  updateProfile: { id: string; preferredCityId: string | null };
};

const localizedNames = (nameLocal: unknown): string[] => {
  if (nameLocal && typeof nameLocal === 'object') {
    return Object.values(nameLocal as Record<string, string>).filter(
      (v): v is string => typeof v === 'string',
    );
  }
  return [];
};

/**
 * Persist the user's preferred city. The app works with city NAMES (e.g.
 * "Warszawa") while the backend stores a city id, so we resolve the name to an
 * id via the `cities` query, then call `updateProfile`.
 */
export const updatePreferredCity = async (
  options: ApolloServerConfig & { city: string },
): Promise<GraphQLResult<UpdatePermissionsResult>> => {
  const { city, ...apolloOptions } = options;

  const citiesResult = await getCities(apolloOptions);
  if (!citiesResult.success || !citiesResult.data) {
    return {
      data: null,
      error: citiesResult.error || { message: 'Failed to load cities' },
      success: false,
    };
  }

  const target = city.toLowerCase();
  const match = citiesResult.data.find((c) =>
    [c.name, ...localizedNames(c.nameLocal)].some((n) => n.toLowerCase() === target),
  );

  if (!match) {
    return { data: null, error: { message: `Unknown city: ${city}` }, success: false };
  }

  const result = await executeGraphQLQuery<UpdateProfileResponse>(UPDATE_PROFILE_MUTATION, {
    ...apolloOptions,
    variables: { data: { preferredCityId: match.id } },
  });

  return {
    ...result,
    data: result.data ? result.data.updateProfile : null,
  };
};
