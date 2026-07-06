import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

/**
 * TODO: This is a centralized location service to manage all GPS operations
 * 
 * WHY: Multiple hooks were calling GPS APIs independently, causing:
 *   - Battery drain from excessive GPS usage
 *   - Rate limit errors on reverseGeocodeAsync (50/day limit)
 *   - Inconsistent location data across components
 * 
 * WHAT: Provides cached location data with smart invalidation:
 *   - GPS coordinates cached for 5 minutes (balance between accuracy and battery)
 *   - City name cached for 24 hours AND 10km distance threshold
 *   - Single source of truth for all location data
 * 
 * USAGE:
 *   - Use getLocation() for GPS coordinates (cached 5min)
 *   - Use getCity() for city name (cached 24h + 10km threshold)
 *   - Both methods handle permissions and errors gracefully
 */

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface CachedCity {
  city: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = 'cachedGPSLocation';
const CITY_CACHE_KEY = 'cachedCity';
const SELECTED_CITY_KEY = 'selectedCity';

const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for GPS coordinates
const CITY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for city name
const CITY_DISTANCE_THRESHOLD_KM = 10; // Refresh city if user moved >10km

/**
 * Calculates distance between two GPS coordinates using Haversine formula
 * @returns distance in kilometers
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Gets current GPS location with caching
 * 
 * ⚠️ TEMPORARY: Cache enabled for testing only
 * Set LOCATION_CACHE_DURATION = 0 to get real-time location
 */
export const getLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      logger.warn('Location permission not granted');
      return null;
    }

    // Check cache first (skip if LOCATION_CACHE_DURATION = 0)
    if (LOCATION_CACHE_DURATION > 0) {
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const cachedData: CachedLocation = JSON.parse(cached);
        const age = Date.now() - cachedData.timestamp;
        
        if (age < LOCATION_CACHE_DURATION) {
          return {
            latitude: cachedData.latitude,
            longitude: cachedData.longitude,
          };
        }
      }
    }

    // Cache miss or expired - fetch fresh location
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const locationData: CachedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: Date.now(),
    };

    // Save to cache (only if caching enabled)
    if (LOCATION_CACHE_DURATION > 0) {
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
    }

    return {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    };
  } catch (error) {
    logger.error('Failed to get location:', error);
    return null;
  }
};

/**
 * Gets city name from GPS coordinates with intelligent caching
 * 
 * ⚠️ TEMPORARY: Aggressive caching to avoid Expo API rate limits (50/day)
 * 
 * Cache invalidation rules:
 *   - Time: Cache expires after 24 hours (TEMPORARY - set to 0 for real-time)
 *   - Distance: Cache invalidates if user moved >10km
 *   - Manual: User-selected city always takes priority
 * 
 * Rate limit handling:
 *   - Falls back to expired cache if API rate limited
 *   - Better to show old city than crash
 * 
 * TO ENABLE REAL-TIME: Set CITY_CACHE_DURATION = 0 after adding API key
 */
export const getCity = async (): Promise<string> => {
  try {
    // Priority 1: User manually selected city (never expires)
    const selectedCity = await AsyncStorage.getItem(SELECTED_CITY_KEY);
    if (selectedCity) {
      return selectedCity;
    }

    // Get current location (uses cached location if available)
    const location = await getLocation();
    if (!location) {
      return '';
    }

    // Priority 2: Check city cache validity (time + distance)
    // Skip cache check if CITY_CACHE_DURATION = 0 (real-time mode)
    if (CITY_CACHE_DURATION > 0) {
      const cached = await AsyncStorage.getItem(CITY_CACHE_KEY);
      if (cached) {
        try {
          const cachedData: CachedCity = JSON.parse(cached);
          const age = Date.now() - cachedData.timestamp;
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            cachedData.latitude,
            cachedData.longitude
          );

          // Use cache if: not expired AND user hasn't moved significantly
          if (age < CITY_CACHE_DURATION && distance < CITY_DISTANCE_THRESHOLD_KM) {
            return cachedData.city;
          }
        } catch {
          // Old cache format (plain string) - clear it and fetch fresh
          await AsyncStorage.removeItem(CITY_CACHE_KEY);
        }
      }
    }

    // Priority 3: Cache invalid - fetch fresh city from API
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (reverseGeocode.length > 0) {
      const city = reverseGeocode[0].city || reverseGeocode[0].subregion || '';
      
      // Save to cache (only if caching enabled)
      if (CITY_CACHE_DURATION > 0) {
        const cityData: CachedCity = {
          city,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
        };

        await AsyncStorage.setItem(CITY_CACHE_KEY, JSON.stringify(cityData));
      }
      
      return city;
    }

    return '';
  } catch (error: any) {
    logger.error('Failed to get city:', error);

    // Fallback: If rate limited, use cached city even if expired
    if (error?.message?.includes('rate limit') || error?.message?.includes('too many requests')) {
      const cached = await AsyncStorage.getItem(CITY_CACHE_KEY);
      if (cached) {
        try {
          const cachedData: CachedCity = JSON.parse(cached);
          logger.info('Using expired cached city due to rate limit');
          return cachedData.city;
        } catch {
          // Old cache format - ignore and return empty
          await AsyncStorage.removeItem(CITY_CACHE_KEY);
        }
      }
    }

    return '';
  }
};

/**
 * Requests location permission from user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    logger.error('Failed to request location permission:', error);
    return false;
  }
};

/**
 * Clears all location caches (useful for testing or manual refresh)
 */
export const clearLocationCache = async (): Promise<void> => {
  await AsyncStorage.multiRemove([LOCATION_CACHE_KEY, CITY_CACHE_KEY]);
};
