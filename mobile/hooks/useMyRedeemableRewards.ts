import { getMyRedeemableRewards } from '@/shared/api-client/src/graphql/queries/rewards/getMyRedeemableRewards';
import { MyRedeemableReward } from '@/shared/api-client/src/graphql/queries/rewards/types';
import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';
import { useAuthState } from './useAuthState';

export const useMyRedeemableRewards = () => {
  const [rewards, setRewards] = useState<MyRedeemableReward[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthState();

  useEffect(() => {
    const fetchRewards = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getMyRedeemableRewards({ token });
        
        if (result.data) {
          setRewards(result.data);
        }
      } catch (error) {
        logger.error('Error fetching redeemable rewards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, [token]);

  return { data: rewards, loading: isLoading };
};
