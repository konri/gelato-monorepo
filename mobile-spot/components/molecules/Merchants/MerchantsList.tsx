import React from 'react';
import { FlatList } from 'react-native';
import { DataStateWrapper } from '@/components/atoms/DataStateWrapper';
import { StoreCard } from './StoreCard';
import { MerchantsListProps } from './types';

export const MerchantsList = ({ stores, loading, error, emptyMessage }: MerchantsListProps) => {
  return (
    <DataStateWrapper loading={loading} error={error} data={stores} emptyMessage={emptyMessage}>
      <FlatList
        data={stores}
        renderItem={({ item }) => <StoreCard item={item} />}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </DataStateWrapper>
  );
};
