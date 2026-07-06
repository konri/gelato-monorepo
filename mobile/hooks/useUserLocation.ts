import { getLocation } from '@/services/locationService';
import { useEffect, useState } from 'react';

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    (async () => {
      const location = await getLocation();
      if (location) {
        setUserLocation(location);
      }
    })();
  }, []);

  return userLocation;
};
