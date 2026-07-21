import { GraphQLResult } from '@repo/api-client';
import { useCallback, useEffect, useState } from 'react';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';

interface UseGraphQLQueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseGraphQLQueryResult<T> extends UseGraphQLQueryState<T> {
  refetch: () => Promise<void>;
}

export const useGraphQLQuery = <T>(
  queryFn: (options: any) => Promise<GraphQLResult<T>>,
  options?: any,
  dependencies: any[] = []
): UseGraphQLQueryResult<T> => {
  const [state, setState] = useState<UseGraphQLQueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      // Skip the request entirely when disabled (e.g. before login) so we don't
      // fire authed queries without a valid token and trip session-expiry.
      if (options?.enabled === false) {
        setState({ data: null, loading: false, error: null });
        return;
      }
      setState(prev => ({ ...prev, loading: true, error: null }));

      const token = await safeGetItem('access_token');
      const result = await queryFn({ ...options, token });

      if (result.error) {
        setState({
          data: null,
          loading: false,
          error: result.error.message,
        });
      } else {
        setState({
          data: result.data,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    let isCancelled = false;

    void fetchData().catch(() => {
      // errors are already captured in state
    });

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};
