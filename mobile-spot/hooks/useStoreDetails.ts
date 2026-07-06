import { getStoreDetails } from '@/shared/api-client/src/graphql/queries/stores/getStoreDetails';
import { StoreDetails } from '@/shared/api-client/src/graphql/queries/stores/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { refreshEmitter } from './useRefreshEmitter';

export interface UseStoreDetailsState {
  data: StoreDetails | null;
  loading: boolean;
  error: string | null;
}

export const useStoreDetails = (storeId: string | undefined): UseStoreDetailsState & { refetch: () => Promise<void> } => {
  const [data, setData] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);
  const storeIdRef = useRef(storeId);
  storeIdRef.current = storeId;

  const fetchData = useCallback(async () => {
    const id = storeIdRef.current;
    if (!id) return;

    if (!hasData.current) setLoading(true);
    setError(null);

    try {
      const result = await getStoreDetails({ variables: { id } });
      if (result.error) {
        setError(result.error.message);
      } else {
        setData(result.data);
        hasData.current = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hasData.current = false;
    setData(null);
    fetchData();
  }, [storeId, fetchData]);

  useEffect(() => {
    return refreshEmitter.subscribe(() => { fetchData(); });
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
