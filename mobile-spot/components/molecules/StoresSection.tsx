import type { Store } from '@repo/types/merchants';
import { FlatList, View } from 'react-native';
import { StoreCard } from './StoreCard';
import { StateView } from '@/components/atoms/StateView';
import { Typography } from '@/components/atoms/Typography';

interface StoresSectionProps {
  stores: Store[];
}

export const StoresSection = ({ stores }: StoresSectionProps) => {
  const renderStore = ({ item }: { item: Store }) => <StoreCard store={item} />;

  const renderEmptyComponent = () => (
    <View className="py-12">
      <StateView message="No stores found" />
    </View>
  );

  return (
    <View className="p-4">
      <Typography variant="body-lg-bold" className="mb-4">Stores</Typography>

      <FlatList
        data={stores}
        renderItem={renderStore}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};
