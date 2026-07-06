import { Dropdown } from '@/components/atoms/Dropdown';
import { Typography } from '@/components/atoms/Typography';
import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

interface SortSectionProps {
  sortOrder: SearchSortOrder;
  onSortChange: (value: SearchSortOrder) => void;
  options?: SearchSortOrder[];
  variant?: 'dropdown' | 'list';
  onClose?: () => void;
}

export const SortSection: React.FC<SortSectionProps> = ({
  sortOrder,
  onSortChange,
  options = [
    SearchSortOrder.DISTANCE,
    SearchSortOrder.ALPHABETICAL,
    SearchSortOrder.ALPHABETICAL_DESC,
    SearchSortOrder.PRIORITY,
    SearchSortOrder.NEWEST,
    SearchSortOrder.OLDEST,
    SearchSortOrder.POINTS_ASC,
    SearchSortOrder.POINTS_DESC,
    SearchSortOrder.EXPIRING_SOON,
    SearchSortOrder.POPULARITY,
  ],
  variant = 'dropdown',
  onClose,
}) => {
  const { t } = useTranslation();

  const sortOptions = options.map((option) => ({
    label: t(`Filters.sort.${option}`),
    value: option,
  }));

  if (variant === 'list') {
    return (
      <View className="py-4">
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              onSortChange(option);
              if (onClose) onClose();
            }}
            className="py-3 border-b border-gray-200"
          >
            <Typography 
              variant="body-base-semibold" 
              className={sortOrder === option ? "text-accent" : "text-text-primary"}
            >
              {t(`Filters.sort.${option}`)}
            </Typography>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View className="py-4">
      <View className="flex-row items-center justify-between">
        <Typography variant="body-base-semibold">
          {t('Filters.sortBy')}
        </Typography>
        <View style={{ width: 145 }}>
          <Dropdown
            options={sortOptions}
            value={sortOrder}
            onChange={onSortChange}
            placeholder={t('Filters.selectSort')}
            compact
          />
        </View>
      </View>
    </View>
  );
};
