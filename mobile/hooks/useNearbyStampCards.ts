import { UnifiedSearchInput } from '@/shared/types/filters';
import { useMemo } from 'react';
import { useCurrentLocation } from './useCurrentLocation';
import { useUnifiedSearch } from './useUnifiedSearch';

export const useNearbyStampCards = () => {
  const { location, loading: locationLoading } = useCurrentLocation();

  const searchInput: UnifiedSearchInput = useMemo(() => {
    if (!location) return {};

    return {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: 10,
      },
      sort: {
        sortBy: 'DISTANCE' as any,
      },
    };
  }, [location]);

  const { stampCardStores, isLoading, error } = useUnifiedSearch({ 
    input: searchInput,
    enabled: !locationLoading && !!location,
  });

  return { 
    data: stampCardStores, 
    loading: locationLoading || isLoading,
    error,
  };
};
