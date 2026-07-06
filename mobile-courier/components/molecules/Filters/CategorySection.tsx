import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface CategorySectionProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onSeeAll?: () => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedIds,
  onChange,
  onSeeAll,
}) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = React.useState(false);

  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((catId) => catId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const hasMore = categories.length > 4;
  const displayCategories = showAll ? categories : categories.slice(0, 4);

  return (
    <View className="py-4">
      <Typography variant="body-base-semibold" className="mb-3">
        {t('Filters.category')}
      </Typography>
      <View className="flex-row flex-wrap gap-2">
        {displayCategories.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          return (
            <Pressable
              key={category.id}
              className={`px-4 py-2 rounded-full border flex-1 items-center ${
                isSelected ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'
              }`}
              style={{ minWidth: '48%' }}
              onPress={() => toggleCategory(category.id)}
            >
              <Typography
                variant="body-small-regular"
                className={isSelected ? 'text-red-500' : 'text-text-primary'}
              >
                {category.name}
              </Typography>
            </Pressable>
          );
        })}
      </View>
      {hasMore && (
        <Pressable className="mt-3" onPress={() => setShowAll(!showAll)}>
          <Typography variant="body-small-semibold" className="text-red-500 text-center">
            {showAll ? t('Filters.seeLess') : t('Filters.seeAll')} {showAll ? '↑' : '↓'}
          </Typography>
        </Pressable>
      )}
    </View>
  );
};
