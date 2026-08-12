import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      // @react-native-firebase/messaging is native-only; push isn't
      // implemented for web yet, so skip straight past the permission ask.
      if (Platform.OS !== 'web') {
        const NotificationService = require('@/services/notificationService').default;
        await NotificationService.requestPermissions();
      }
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLater = () => {
    router.replace('/(tabs)');
  };

  return {
    isLoading,
    handleAllow,
    handleLater,
  };
};
