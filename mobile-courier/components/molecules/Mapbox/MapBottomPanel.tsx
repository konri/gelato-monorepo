import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Typography } from '@/components/atoms/Typography';
import { FilterChip } from '@/components/molecules/ActiveFiltersBar/FilterChip';
import { FiltersModal } from '@/components/molecules/Filters/FiltersModal';
import { MAP_BOTTOM_SHEET_CARD_SHADOW } from '@/components/molecules/MapBottomSheetSurface/sheetShadowStyle';
import { StoresHorizontalScroll } from '@/components/molecules/StoresHorizontalScroll';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { StoreForMap } from '@/shared/api-client/src/graphql/queries/stores/types';
import { StampCardStoreResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { FilterModalData } from '@/shared/types/filterModal';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

type ActiveFilter = { id: string; icon: string; label: string };

type MapBottomPanelProps = {
  stores: StoreForMap[];
  stampCardStores?: StampCardStoreResult[];
  onStorePress?: (storeId: string) => void;
  isFiltersVisible: boolean;
  setIsFiltersVisible: (v: boolean) => void;
  draftFilters: FilterModalData;
  activeFilters: ActiveFilter[];
  activeFiltersCount: number;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onSyncDraftFilters: () => void;
  onRemoveFilter: (id: string) => void;
  onClearAllFilters: () => void;
};

export const MapBottomPanel = ({
  stores,
  stampCardStores = [],
  onStorePress,
  isFiltersVisible,
  setIsFiltersVisible,
  draftFilters,
  activeFilters,
  activeFiltersCount,
  onApplyFilters,
  onResetFilters,
  onSyncDraftFilters,
  onRemoveFilter,
  onClearAllFilters,
}: MapBottomPanelProps) => {
  const { t } = useTranslation();

  return (
    <>
      <View
        className="bg-white rounded-t-3xl px-4 pt-3"
        style={[MAP_BOTTOM_SHEET_CARD_SHADOW, { paddingBottom: TAB_BAR_TOTAL_HEIGHT }]}
      >
        <View className="flex-row items-center mb-3 gap-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                icon={filter.icon}
                label={filter.label}
                onRemove={() => onRemoveFilter(filter.id)}
                onPress={() => {
                  onSyncDraftFilters();
                  setIsFiltersVisible(true);
                }}
              />
            ))}
            {activeFilters.length > 0 && (
              <Pressable onPress={onClearAllFilters} className="px-3 py-1.5 justify-center">
                <Typography variant="body-small-semibold" className="text-red-500">
                  {t('ActiveFilters.clearAll')}
                </Typography>
              </Pressable>
            )}
            {activeFilters.length === 0 && (
              <Pressable onPress={() => router.push('/(tabs)/merchants')} className="px-3 py-1.5 justify-center">
                <Typography variant="body-small-semibold" className="text-text-primary">
                  {t('Common.showList')}
                </Typography>
              </Pressable>
            )}
          </ScrollView>

          <RoundedCard className="ml-auto">
            <Pressable
              className="flex-row items-center"
              onPress={() => {
                onSyncDraftFilters();
                setIsFiltersVisible(true);
              }}
            >
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

        <StoresHorizontalScroll stores={stores} stampCardStores={stampCardStores} onStorePress={onStorePress} />
      </View>

      <FiltersModal
        visible={isFiltersVisible}
        onClose={() => setIsFiltersVisible(false)}
        onApply={() => { onApplyFilters(); setIsFiltersVisible(false); }}
        onReset={onResetFilters}
        draftFilters={draftFilters}
      />
    </>
  );
};
