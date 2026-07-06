import NotificationService from '@/services/notificationService';
import { router } from 'expo-router';
import { useState } from 'react';

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      await NotificationService.requestPermissions();
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
