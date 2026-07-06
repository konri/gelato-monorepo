import {
  City,
  Spot,
  Taste,
  getAllSpots,
  getCities,
  getSpotById,
  getSpotTastes,
  getSpotsByCity,
  getTasteById,
} from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useCities = () => useGraphQLQuery<City[]>(getCities, {}, []);

// When a city id is resolved, scope spots to it; otherwise fall back to all
// active spots so the Tastes tab is never needlessly empty.
export const useSpotsByCity = (cityId: string | null) =>
  useGraphQLQuery<Spot[]>(
    (options) => (cityId ? getSpotsByCity(cityId, options) : getAllSpots(options)),
    {},
    [cityId],
  );

export const useSpotDetail = (id: string | null) =>
  useGraphQLQuery<Spot | null>(
    (options) => getSpotById(id ?? '', options),
    {},
    [id],
  );

export const useSpotTastes = (spotId: string | null) =>
  useGraphQLQuery<Taste[]>(
    (options) => getSpotTastes(spotId ?? '', options),
    {},
    [spotId],
  );

export const useTasteDetail = (id: string | null) =>
  useGraphQLQuery<Taste | null>(
    (options) => getTasteById(id ?? '', options),
    {},
    [id],
  );
