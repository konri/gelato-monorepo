import { useNotificationRegistration } from './useNotificationRegistration';

export const useNotificationInitialization = () => {
  const { isRegistered } = useNotificationRegistration();
  return { isInitialized: isRegistered };
};
