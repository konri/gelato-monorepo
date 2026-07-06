import { addFavoriteStore } from '@/shared/api-client/src/graphql/mutations/addFavoriteStoreFunction';
import { removeFavoriteStore } from '@/shared/api-client/src/graphql/mutations/removeFavoriteStoreFunction';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthState } from './useAuthState';
import { favoritesChangedEmitter } from './useFavoritesChanged';

const NOOP_ERRORS = ['Store already in favorites', 'Store not in favorites'];

interface UseFavoriteToggleOptions {
  storeId: string;
  initialIsFavorite: boolean;
  onSuccess?: () => void;
}

export const useFavoriteToggle = ({ storeId, initialIsFavorite, onSuccess }: UseFavoriteToggleOptions) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const initializedRef = useRef(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthState();

  useEffect(() => {
    if (!initializedRef.current && initialIsFavorite) {
      initializedRef.current = true;
      setIsFavorite(initialIsFavorite);
    }
  }, [initialIsFavorite]);

  const toggle = useCallback(async () => {
    if (isToggling) return;

    const previous = isFavorite;
    setIsFavorite(!previous);
    setIsToggling(true);
    setError(null);

    const fn = previous ? removeFavoriteStore : addFavoriteStore;
    const result = await fn({ merchantStoreId: storeId, token: token ?? undefined });

    if (!result.success) {
      const msg = result.error?.message ?? '';
      if (!NOOP_ERRORS.includes(msg)) {
        setError(msg || 'Failed to update favorite');
      }
      setIsFavorite(previous);
    } else {
      favoritesChangedEmitter.emit();
      onSuccess?.();
    }

    setIsToggling(false);
  }, [isFavorite, isToggling, storeId, token, onSuccess]);

  return { isFavorite, isToggling, toggle, error };
};
