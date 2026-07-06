import React from 'react';
import { StoreDetails } from './types';
import { StoreBasicInfo } from './StoreBasicInfo';
import { AddressCard } from './AddressCard';

interface StoreInfoSectionProps {
  store: StoreDetails;
  descriptionExpanded: boolean;
  onToggleDescription: () => void;
  t: (key: string) => string;
}

export const StoreInfoSection = ({ 
  store, 
  descriptionExpanded, 
  onToggleDescription, 
  t 
}: StoreInfoSectionProps) => {
  return (
    <>
      <StoreBasicInfo
        store={store}
        descriptionExpanded={descriptionExpanded}
        onToggleDescription={onToggleDescription}
        t={t}
      />
      <AddressCard store={store} />
    </>
  );
};