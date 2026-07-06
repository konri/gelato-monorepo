import { UnifiedSearchInput } from '@/shared/types/filters';
import { useMemo } from 'react';
import { useCurrentLocation } from './useCurrentLocation';
import { useUnifiedSearch } from './useUnifiedSearch';

export const useNearbyStreaks = () => {
  const { location, loading: locationLoading } = useCurrentLocation();

  const searchInput: UnifiedSearchInput = useMemo(() => {
    if (!location) return {};
    return {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: 10,
      },
      sort: { sortBy: 'DISTANCE' as any },
    };
  }, [location]);

  const { streakStores, isLoading } = useUnifiedSearch({
    input: searchInput,
    enabled: !locationLoading && !!location,
  });

  return {
    data: streakStores,
    loading: locationLoading || isLoading,
  };
};
