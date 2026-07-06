import type { Category } from '@repo/types/category';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface MerchantTypePillsProps {
  categories: Category[];
  selectedCategory?: string;
  onCategoryPress?: (categoryId: string) => void;
}

export const MerchantTypePills = ({
  categories,
  selectedCategory,
  onCategoryPress,
}: MerchantTypePillsProps) => {
  return (
    <View className="w-full py-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <Pressable
          onPress={() => onCategoryPress?.('')}
          className={`mr-3 px-4 py-2 rounded-full border ${
            !selectedCategory ? 'bg-primary border-primary' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`body-small ${!selectedCategory ? 'text-white' : 'text-gray-700'}`}>
            All
          </Text>
        </Pressable>

        {categories.map(category => (
          <Pressable
            key={category.id}
            onPress={() => onCategoryPress?.(category.id)}
            className={`mr-3 px-4 py-2 rounded-full border ${
              selectedCategory === category.id
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={`body-small ${
                selectedCategory === category.id ? 'text-white' : 'text-gray-700'
              }`}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
