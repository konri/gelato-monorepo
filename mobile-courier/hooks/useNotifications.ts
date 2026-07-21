import NotificationService from '@/services/notificationService';
import { router } from 'expo-router';
import { useState } from 'react';

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);

  // End of the post-registration flow — route through the root gate
  // (app/index.tsx) so a new courier finishes onboarding (name/surname +
  // selfie) before landing on the tabs.
  const handleAllow = async () => {
    setIsLoading(true);
    try {
      await NotificationService.requestPermissions();
      router.replace('/');
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLater = () => {
    router.replace('/');
  };

  return {
    isLoading,
    handleAllow,
    handleLater,
  };
};
