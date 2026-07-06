import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";

export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    logger.error(`Error getting item from AsyncStorage (key: ${key}):`, error);
    return null;
  }
};

export const safeSetItem = async (
  key: string,
  value: string
): Promise<boolean> => {
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

export const safeMultiGet = async (
  keys: string[]
): Promise<readonly [string, string | null][]> => {
  try {
    return await AsyncStorage.multiGet(keys);
  } catch (error) {
    logger.error(
      `Error getting multiple items from AsyncStorage (keys: ${keys.join(
        ", "
      )}):`,
      error
    );
    return keys.map((key) => [key, null] as [string, string | null]);
  }
};

export const safeMultiSet = async (
  keyValuePairs: [string, string][]
): Promise<boolean> => {
  try {
    await AsyncStorage.multiSet(keyValuePairs);
    return true;
  } catch (error) {
    logger.error(`Error setting multiple items in AsyncStorage:`, error);
    return false;
  }
};

export const safeMultiRemove = async (keys: string[]): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    logger.error(
      `Error removing multiple items from AsyncStorage (keys: ${keys.join(
        ", "
      )}):`,
      error
    );
    return false;
  }
};
