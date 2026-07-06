import { useEffect, useState } from 'react';
import { getBottomMenuImages } from '@/shared/api-client/src/graphql/queries/menu/getBottomMenuImages';
import { BottomMenuImages } from '@/shared/api-client/src/graphql/queries/menu/types';

export const useBottomMenuImages = () => {
  const [icons, setIcons] = useState<BottomMenuImages | null>(null);

  useEffect(() => {
    getBottomMenuImages().then(result => {
      if (result.data) {
        setIcons(result.data);
      }
    });
  }, []);

  return icons;
};
