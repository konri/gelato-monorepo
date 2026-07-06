import { unifiedSearch } from '@/shared/api-client/src/graphql/queries/unifiedSearch';
import { UnifiedSearchResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { UnifiedSearchInput } from '@/shared/types/filters';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthState } from './useAuthState';
import { favoritesChangedEmitter } from './useFavoritesChanged';
import { refreshEmitter } from './useRefreshEmitter';

interface UseUnifiedSearchOptions {
  input: UnifiedSearchInput;
  enabled?: boolean;
  pageSize?: number;
}

export const useUnifiedSearch = ({ input, enabled = true, pageSize = 10 }: UseUnifiedSearchOptions) => {
  const [result, setResult] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token } = useAuthState();
  const inputRef = useRef<string>('');

  const fetchData = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!enabled || !token) {
      setIsLoading(false);
      return;
    }

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const paginatedInput = {
        ...input,
        pagination: {
          page: pageNum,
          pageSize,
        },
      };

      const response = await unifiedSearch({ token, input: paginatedInput });

      if (response.data) {
        setResult(prev => {
          if (!append || !prev) {
            return response.data;
          }

          return {
            ...response.data,
            coupons: [...(prev.coupons || []), ...(response.data.coupons || [])],
            stores: [...(prev.stores || []), ...(response.data.stores || [])],
            stampCardStores: [...(prev.stampCardStores || []), ...(response.data.stampCardStores || [])],
            streakStores: [...(prev.streakStores || []), ...(response.data.streakStores || [])],
          };
        });

        const hasMoreData =
          (response.data.coupons?.length === pageSize) ||
          (response.data.stores?.length === pageSize) ||
          (response.data.stampCardStores?.length === pageSize);

        // Only set hasMore=true if the source that returned data has a full page
        const activeSources = [
          response.data.coupons?.length ?? 0,
          response.data.stores?.length ?? 0,
          response.data.stampCardStores?.length ?? 0,
        ].filter(len => len > 0);
        const hasMoreFixed = activeSources.length > 0
          ? activeSources.some(len => len === pageSize)
          : false;

        setHasMore(hasMoreFixed);
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err) {
      logger.error('Error in unified search:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token, enabled, input, pageSize]);

  const enabledRef = useRef(false);

  useEffect(() => {
    const currentInput = JSON.stringify(input);
    const inputChanged = currentInput !== inputRef.current;
    const justEnabled = enabled && !enabledRef.current;

    enabledRef.current = enabled;

    if (inputChanged || justEnabled) {
      inputRef.current = currentInput;
      setPage(1);
      setHasMore(true);
      fetchData(1, false);
    }
  }, [input, fetchData, enabled]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && result) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [isLoadingMore, hasMore, isLoading, page, result, fetchData]);

  const refetch = useCallback(() => {
    inputRef.current = '';
    setPage(1);
    setHasMore(true);
    setResult(null);
    fetchData(1, false);
  }, [fetchData]);

  useEffect(() => {
    return favoritesChangedEmitter.subscribe(refetch);
  }, [refetch]);

  useEffect(() => {
    return refreshEmitter.subscribe(refetch);
  }, [refetch]);

  return { 
    coupons: result?.coupons?.map(c => ({ 
      ...c.coupon, 
      merchant: c.merchant, 
      distance: c.distanceKm 
    })) || [], 
    stores: result?.stores?.map(s => ({ 
      ...s.store, 
      merchant: s.merchant, 
      distance: s.distanceKm,
      isFavorite: s.isFavorite ?? false,
      favoriteIconUrl: s.favoriteIconUrl,
      favoriteIconPngUrl: s.favoriteIconPngUrl,
      hasStreak: s.hasStreak ?? false,
      streakIconPngUrl: s.streakIconPngUrl,
    })) || [], 
    stampCardStores: result?.stampCardStores || [],
    streakStores: result?.streakStores || [],
    totalCount: result?.metadata?.totalResults || 0,
    filteredCount: result?.metadata?.filteredResults || 0,
    isLoading, 
    isLoadingMore,
    hasMore,
    loadMore,
    refetch,
    error 
  };
};
