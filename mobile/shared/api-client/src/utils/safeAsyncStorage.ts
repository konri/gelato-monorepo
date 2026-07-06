import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    logger.error(`Error getting item from AsyncStorage (key: ${key}):`, error);
    return null;
  }
};

export const safeSetItem = async (key: string, value: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    logger.error(`Error setting item in AsyncStorage (key: ${key}):`, error);
    return false;
  }
};

export const safeRemoveItem = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Error removing item from AsyncStorage (key: ${key}):`, error);
    return false;
  }
};
