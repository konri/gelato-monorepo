import { getLocation, requestLocationPermission } from '@/services/locationService';
import { useEffect, useState } from 'react';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const position = await getLocation();
      
      if (!position) {
        setError('Location permission not granted');
        setLoading(false);
        return;
      }

      setLocation(position);
    } catch (err) {
      setError('Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      getCurrentLocation();
    }
    return granted;
  };

  return { location, loading, error, requestPermission };
};