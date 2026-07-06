import { unifiedSearch } from '@/shared/api-client/src/graphql/queries/unifiedSearch';
import { UnifiedSearchResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { UnifiedSearchInput } from '@/shared/types/filters';
import { logger } from '@/utils/logger';
import { useEffect, useRef, useState } from 'react';
import { useAuthState } from './useAuthState';

interface UseFilterResultsCountOptions {
  input: UnifiedSearchInput;
  enabled?: boolean;
}

export const useFilterResultsCount = ({ input, enabled = true }: UseFilterResultsCountOptions) => {
  const [result, setResult] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthState();
  const inputRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(input);
    if (!enabled || !token || serialized === inputRef.current) {
      if (!enabled) setIsLoading(false);
      return;
    }

    inputRef.current = serialized;

    const fetchCount = async () => {
      setIsLoading(true);
      try {
        const response = await unifiedSearch({ token, input });
        if (response.data) {
          setResult(response.data);
        }
      } catch (err) {
        logger.error('Error fetching filter results count:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [token, enabled, input]);

  return { result, isLoading };
};
