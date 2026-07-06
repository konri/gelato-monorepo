import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';
import { StampCardStoreResult, StreakStoreResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type RewardItem =
  | { type: 'stamp'; data: StampCardStoreResult }
  | { type: 'streak'; data: StreakStoreResult };

export type RewardItemStatus = { label: string; isReady: boolean };

interface UseSeeAllRewardsProps {
  isFiltersModalVisible?: boolean;
}

export const useSeeAllRewards = ({ isFiltersModalVisible = false }: UseSeeAllRewardsProps = {}) => {
  const { t } = useTranslation();
  const { data, actions } = useFiltersLogic();

  const searchInput = useMemo(() => ({
    ...data.searchInput,
    search: { ...data.searchInput.search, onlyUserActive: true },
  }), [data.searchInput]);

  const { stores, stampCardStores, streakStores, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: searchInput,
    enabled: !data.locationLoading && !!data.userLocation,
    pageSize: 20,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: { ...data.draftSearchInput, search: { ...data.draftSearchInput.search, onlyUserActive: true } },
    enabled: isFiltersModalVisible,
  });

  const { activeFilters, activeFiltersCount } = useActiveFilters({
    selectedCategories: data.appliedFilters.selectedCategories,
    maxDistance: data.appliedFilters.maxDistance,
    showChallenges: data.appliedFilters.showChallenges,
    loyaltyPrograms: data.appliedFilters.loyaltyPrograms,
    searchQuery: data.appliedFilters.searchQuery,
    categoriesData: data.categoriesData || undefined,
  });

  const draftFilters = buildDraftFiltersData(
    data.draftFilters,
    actions,
    filterResult?.stores?.length,
    isLoadingCount
  );

  const getStampStatus = (item: StampCardStoreResult): RewardItemStatus => {
    const collected = item.stampCardProgress.stampsCollected ?? 0;
    const required = item.stampCardProgress.stampsRequired ?? 0;
    const isReady = item.stampCardProgress.hasCard && collected >= required;
    return {
      label: isReady ? t('Award.stampsReady') : t('Award.stamps', { collected, required }),
      isReady,
    };
  };

  const getStreakStatus = (item: StreakStoreResult): RewardItemStatus => {
    const isReady = item.streak.claimableRewardsCount > 0;
    return {
      label: isReady
        ? t('Award.ready')
        : `${item.streak.currentStreak}/${item.streak.requiredConsecutiveDays} ${t('Sections.streakDays')}`,
      isReady,
    };
  };

  type FlatStore = { id: string; name: string; merchant?: { id: string; name: string; logoUrl?: string } };

  const allItems = useMemo(() => {
    const all = [
      ...stores.map((s) => ({ type: 'store' as const, data: s as FlatStore })),
      ...stampCardStores.map((s) => ({ type: 'stamp' as const, data: s })),
      ...streakStores.map((s) => ({ type: 'streak' as const, data: s })),
    ];
    const getMid = (item: typeof all[0]) =>
      item.type === 'store' ? (item.data.merchant?.id ?? item.data.id) : (item.data.merchant?.id ?? 'unknown');
    const order: string[] = [];
    const orderSet = new Set<string>();
    all.forEach((item) => { const mid = getMid(item); if (!orderSet.has(mid)) { orderSet.add(mid); order.push(mid); } });
    const groups = new Map<string, typeof all>();
    order.forEach((mid) => groups.set(mid, []));
    all.forEach((item) => groups.get(getMid(item))?.push(item));
    return order.flatMap((mid) => groups.get(mid) ?? []);
  }, [stores, stampCardStores, streakStores]);

  return {
    filters: { ...data.appliedFilters, activeFilters, activeFiltersCount },
    data: {
      allItems,
      isLoading: isLoading || data.locationLoading || !data.userLocation,
      isLoadingMore,
      draftFilters,
    },
    utils: { getStampStatus, getStreakStatus },
    actions: {
      setSortOrder: (value: any) => actions.updateAppliedFilter('sortOrder', value),
      setSearchQuery: (value: string) => actions.updateAppliedFilter('searchQuery', value),
      applyFilters: actions.applyFilters,
      resetFilters: actions.resetFilters,
      syncDraftFilters: actions.syncDraftFilters,
      removeFilter: actions.removeFilter,
      clearAllFilters: actions.clearAllFilters,
      loadMore,
    },
  };
};
