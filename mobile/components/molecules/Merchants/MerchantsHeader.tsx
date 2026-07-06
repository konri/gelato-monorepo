import React, {useState} from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Typography } from '@/components/atoms/Typography';
import { PopoverModal } from '@/components/atoms/PopoverModal';
import { SortButton } from '@/components/atoms/SortButton';
import { MerchantSortModal } from './MerchantSortModal';
import { MerchantFiltersModal } from './MerchantFiltersModal';
import { MerchantsHeaderProps } from './types';

export const MerchantsHeader = ({ 
  city, 
  activeFiltersCount = 1,
  sortType,
  onSortChange
}: MerchantsHeaderProps) => {
  const { t } = useTranslation();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const sortLabel = sortType === 'nearest' ? t('Merchants.nearestToYou') : t('Merchants.alphabetical');

  return (
    <>
      <View className="flex-row items-center justify-between">
        <RoundedCard className="pr-6">
          <View className="flex-row items-center">
            <Ionicons name="navigate" size={20} color="#212121" />
            <Typography variant="body-base-semibold" className="ml-2 text-text-primary">
              {city || t('Merchants.nearYou')}
            </Typography>
          </View>
        </RoundedCard>
        <RoundedCard className="ml-2">
          <Pressable className="flex-row items-center" onPress={() => setIsFiltersVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#212121" />
            <Typography variant="body-small-semibold" className="ml-1 text-text-primary">
              {t('Merchants.filters')}
            </Typography>
            {activeFiltersCount > 0 && (
              <View className="ml-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                <Typography variant="body-small-semibold" className="text-white">
                  {activeFiltersCount}
                </Typography>
              </View>
            )}
          </Pressable>
        </RoundedCard>
      </View>

      <View className="px-6 my-3">
        <SortButton
          label={sortLabel}
          modalTitle={t('Merchants.sortBy')}
          modalContent={<MerchantSortModal sortType={sortType} onSortChange={onSortChange} />}
          anchorPosition={{top: 206, right: 114}}
          width={250}
        />
      </View>

      <PopoverModal
        visible={isFiltersVisible}
        onClose={() => setIsFiltersVisible(false)}
        title={t('Merchants.filters')}
        anchorPosition={{top: 160, right: 30}}
        height={260}
      >
        <MerchantFiltersModal onClose={() => setIsFiltersVisible(false)} />
      </PopoverModal>
    </>
  );
};
