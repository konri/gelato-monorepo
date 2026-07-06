import AsyncStorage from '@react-native-async-storage/async-storage';

type User = any;

let cachedUser: User | null = null;
let cacheKey: string | null = null;

export const getUserFromCache = async (): Promise<User | null> => {
  const stored = await AsyncStorage.getItem('userData');
  
  if (stored === cacheKey && cachedUser) {
    return cachedUser;
  }
  
  if (stored) {
    cacheKey = stored;
    cachedUser = JSON.parse(stored);
    return cachedUser;
  }
  
  return null;
};

export const setUserCache = async (user: User): Promise<void> => {
  const stringified = JSON.stringify(user);
  cacheKey = stringified;
  cachedUser = user;
  await AsyncStorage.setItem('userData', stringified);
};

export const clearUserCache = () => {
  cachedUser = null;
  cacheKey = null;
};

