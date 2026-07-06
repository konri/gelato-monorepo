import { StoreDetails } from '@/shared/api-client/src/graphql/queries/stores/types';

export interface MapboxSectionProps {
  onStorePress?: (storeId: string) => void;
  onCameraChanged?: (center: [number, number]) => void;
  initialCenter?: [number, number];
  padding?: { paddingTop: number; paddingBottom: number; paddingLeft: number; paddingRight: number };
  stores?: any[];
}

export interface MapboxSectionRef {
  flyToStore: (storeId: string) => void;
}

export interface StoreDetailsSheetProps {
  store: StoreDetails;
  onClose: () => void;
}
