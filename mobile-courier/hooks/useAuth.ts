import { useState } from 'react';
import { loginUser } from '@/shared/api-client';
import { useAuthState } from './useAuthState';
import { useUserSync } from './useUserSync';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { clearAuthState } = useAuthState();
  const { handlePostLogin } = useUserSync();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginUser({
        email,
        password,
        loginContext: 'MOBILE_COURIER'
      });

      if (response.error) {
        const error = new Error(response.error) as any;
        error.status = response.status;
        error.message = response.error;
        throw error;
      }

      if (response.data) {
        await handlePostLogin(response.data.user, response.data.token.access_token, 'email', response.data.refreshToken);
        return response.data;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearAuthState();
  };

  return {
    login,
    logout,
    isLoading
  };
};