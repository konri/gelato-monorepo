import type { Merchant } from '@repo/types/merchants';
import { FlatList, View } from 'react-native';
import { StateView } from '@/components/atoms/StateView';
import { Typography } from '@/components/atoms/Typography';

interface GridSectionProps {
  title?: string;
  items: Merchant[];
  CardComponent: React.ComponentType<{ merchant: Merchant }>;
  numColumns?: number;
  fallbackItem?: {
    emptyTitle?: string;
    emptyDescription?: string;
  };
}

export const GridSection = ({
  title,
  items,
  CardComponent,
  numColumns = 2,
  fallbackItem,
}: GridSectionProps) => {
  const renderItem = ({ item }: { item: Merchant }) => (
    <View className="flex-1 mx-2 mb-4">
      <CardComponent merchant={item} />
    </View>
  );

  const renderEmptyComponent = () => {
    if (!fallbackItem) return null;

    return (
      <View className="py-12">
        <StateView message={fallbackItem.emptyTitle || 'No items found'} />
      </View>
    );
  };

  return (
    <View className="w-full">
      {title && (
        <View className="px-4 mb-4">
          <Typography variant="body-xl-bold">{title}</Typography>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
      />
    </View>
  );
};
