import { DataStateWrapper } from '@/components/atoms/DataStateWrapper';
import React from 'react';
import { FlatList } from 'react-native';

interface SeeAllListProps<T> {
  data: T[] | null;
  loading: boolean;
  error?: Error | null;
  emptyMessage?: string;
  renderItem: (item: T) => React.ReactElement;
  keyExtractor: (item: T) => string;
  numColumns?: number;
}

export function SeeAllList<T>({
  data,
  loading,
  error,
  emptyMessage,
  renderItem,
  keyExtractor,
  numColumns = 2,
}: SeeAllListProps<T>) {
  return (
    <DataStateWrapper loading={loading} error={error} data={data} emptyMessage={emptyMessage}>
      <FlatList
        data={data}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </DataStateWrapper>
  );
}
