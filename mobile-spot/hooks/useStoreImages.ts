import { useMemo } from 'react';
import { StoreForMap } from '@/shared/api-client/src/graphql/queries/stores/types';
import { config } from '@/config';

export const useStoreImages = (stores: StoreForMap[]) => {
  return useMemo(() => {
    const imageMap: Record<string, string> = {};
    
    stores.forEach(store => {
      const mainImage = store.images?.find(img => img.type === 'main');
      if (mainImage) {
        imageMap[store.id] = `${config.API_URL}${mainImage.url}`;
      }
    });
    
    return imageMap;
  }, [stores]);
};
