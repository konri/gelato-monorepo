import { getCity } from '@/services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface UseUserContextOptions {
  includeCity?: boolean;
}

export const useUserContext = (options: UseUserContextOptions = {}) => {
  const { includeCity = false } = options;
  const [token, setToken] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      setToken(storedToken);

      if (includeCity) {
        const detectedCity = await getCity();
        setCity(detectedCity);
      }
    };
    init();
  }, [includeCity]);

  return { token, city };
};
