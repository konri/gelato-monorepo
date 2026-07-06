import {
  Prize,
  UserPrize,
  getMyPrizes,
  getPrizeById,
  getPrizes,
  redeemPrize,
} from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { useCallback, useState } from 'react';
import { useGraphQLQuery } from './useGraphQLQuery';

export const usePrizes = () => useGraphQLQuery<Prize[]>(getPrizes, {}, []);

export const useMyPrizes = () => useGraphQLQuery<UserPrize[]>(getMyPrizes, {}, []);

export const usePrizeDetail = (id: string | null) =>
  useGraphQLQuery<Prize | null>((options) => getPrizeById(id ?? '', options), {}, [id]);

// Imperative redeem (called from the prize detail "activate" button).
export const useRedeemPrize = () => {
  const [redeeming, setRedeeming] = useState(false);

  const redeem = useCallback(async (prizeId: string) => {
    setRedeeming(true);
    try {
      const token = await safeGetItem('access_token');
      const res = await redeemPrize(prizeId, { token: token ?? undefined });
      return res;
    } finally {
      setRedeeming(false);
    }
  }, []);

  return { redeem, redeeming };
};
