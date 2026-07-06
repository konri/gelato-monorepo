import React from 'react';
import { MapboxSection } from './Mapbox/MapboxSection';
import { MapboxSectionRef } from './Mapbox/types';

interface MapWithStoresProps {
  onStorePress: (storeId: string) => void;
  onCameraChanged?: (center: [number, number]) => void;
  initialCenter?: [number, number];
  padding?: { paddingTop: number; paddingBottom: number; paddingLeft: number; paddingRight: number };
  stores?: any[];
}

export const MapWithStores = React.memo(React.forwardRef<MapboxSectionRef, MapWithStoresProps>(({ onStorePress, onCameraChanged, initialCenter, padding, stores }, ref) => {
  return (
    <MapboxSection 
      ref={ref}
      onStorePress={onStorePress}
      onCameraChanged={onCameraChanged}
      initialCenter={initialCenter}
      padding={padding}
      stores={stores}
    />
  );
}));