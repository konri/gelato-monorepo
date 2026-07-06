import { getStoresForMap } from '@/shared/api-client/src/graphql/queries/stores/getStoresForMap';
import { StoreForMap } from '@/shared/api-client/src/graphql/queries/stores/types';
import { useGraphQLQuery } from './useGraphQLQuery';

export interface UseStoresForMapProps {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export const useStoresForMap = ({ latitude, longitude, radiusKm }: UseStoresForMapProps = {}) => {
  
  return useGraphQLQuery<StoreForMap[]>(
    getStoresForMap,
    { variables: { latitude, longitude, radiusKm } },
    [latitude, longitude, radiusKm]
  );
};