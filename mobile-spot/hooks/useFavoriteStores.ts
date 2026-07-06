import { FavoriteStore } from '@/shared/api-client/src/graphql/queries/favoriteStores/types';
import { useCallback } from 'react';

// NOTE: `myFavoriteStores` is a Bonapka-template query the Gelato backend does
// not implement (it uses spot favorites via useSpots/toggleFavoriteSpot). This
// hook is a no-op stub so the legacy Start screen doesn't spam GraphQL errors.
export const useFavoriteStores = () => {
  const refetch = useCallback(async () => {}, []);
  return { data: [] as FavoriteStore[], loading: false, error: null, refetch };
};
