import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';
import { StampCardStoreResult, StreakStoreResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type FlatStoreResult = {
  id: string;
  name: string;
  merchant?: { id: string; name: string; logoUrl?: string };
};

export type ActivityItem =
  | { type: 'store'; data: FlatStoreResult }
  | { type: 'stamp'; data: StampCardStoreResult }
  | { type: 'streak'; data: StreakStoreResult }
  | { type: 'no-activity'; data: FlatStoreResult };

export type ActivityItemStatus = { label: string; isReady: boolean };

interface UseAwardsFiltersOptions {
  isFiltersModalVisible?: boolean;
  pageSize?: number;
  favoriteStoreIds?: string[];
}

export const useAwardsFilters = ({
  isFiltersModalVisible = false,
  pageSize = 20,
  favoriteStoreIds = [],
}: UseAwardsFiltersOptions = {}) => {
  const { t } = useTranslation();
  const { data, actions } = useFiltersLogic();

  const enabled = !data.locationLoading && !!data.userLocation;

  // Query 1: active user items (onlyUserActive)
  const activeSearchInput = useMemo(() => ({
    ...data.searchInput,
    search: { ...data.searchInput.search, onlyUserActive: true },
  }), [data.searchInput]);

  const { stores, stampCardStores, streakStores, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: activeSearchInput,
    enabled,
    pageSize,
  });

  // Separate query for favorites — same filters/sort but without onlyUserActive
  // so all favorites appear in correct sort order
  const favSearchInput = useMemo(() => data.searchInput, [data.searchInput]);

  const { stores: favStores, stampCardStores: favStampCards, streakStores: favStreaks } = useUnifiedSearch({
    input: favSearchInput,
    enabled: enabled && favoriteStoreIds.length > 0,
    pageSize: 200,
  });

  const { activeFilters, activeFiltersCount } = useActiveFilters({
    selectedCategories: data.appliedFilters.selectedCategories,
    maxDistance: data.appliedFilters.maxDistance,
    showChallenges: data.appliedFilters.showChallenges,
    loyaltyPrograms: data.appliedFilters.loyaltyPrograms,
    searchQuery: data.appliedFilters.searchQuery,
    categoriesData: data.categoriesData || undefined,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: { ...data.draftSearchInput, search: { ...data.draftSearchInput.search, onlyUserActive: true } },
    enabled: isFiltersModalVisible,
  });

  const draftFilters = buildDraftFiltersData(
    data.draftFilters,
    actions,
    filterResult?.stores?.length,
    isLoadingCount
  );

  const getStampStatus = (item: StampCardStoreResult): ActivityItemStatus => {
    const collected = item.stampCardProgress.stampsCollected ?? 0;
    const required = item.stampCardProgress.stampsRequired ?? 0;
    const isReady = item.stampCardProgress.hasCard && collected >= required;
    return {
      label: isReady ? t('Award.stampsReady') : t('Award.stamps', { collected, required }),
      isReady,
    };
  };

  const getStreakStatus = (item: StreakStoreResult): ActivityItemStatus => {
    const isReady = item.streak.claimableRewardsCount > 0;
    return {
      label: isReady
        ? t('Award.ready')
        : `${item.streak.currentStreak}/${item.streak.requiredConsecutiveDays} ${t('Sections.streakDays')}`,
      isReady,
    };
  };

  const getStatus = (item: ActivityItem): ActivityItemStatus => {
    if (item.type === 'stamp') return getStampStatus(item.data);
    if (item.type === 'streak') return getStreakStatus(item.data);
    if (item.type === 'no-activity') return { label: t('Award.noActivity'), isReady: false };
    return { label: t('Award.ready'), isReady: true };
  };

  const activeItems: ActivityItem[] = useMemo(() => {
    const all: ActivityItem[] = [
      ...stores.map((s) => ({ type: 'store' as const, data: s as FlatStoreResult })),
      ...stampCardStores.map((s) => ({ type: 'stamp' as const, data: s })),
      ...streakStores.map((s) => ({ type: 'streak' as const, data: s })),
    ];
    const getMid = (item: ActivityItem) =>
      item.type === 'store' ? (item.data.merchant?.id ?? item.data.id) : (item.data.merchant?.id ?? 'unknown');
    const order: string[] = [];
    const orderSet = new Set<string>();
    all.forEach((item) => { const mid = getMid(item); if (!orderSet.has(mid)) { orderSet.add(mid); order.push(mid); } });
    const groups = new Map<string, ActivityItem[]>();
    order.forEach((mid) => groups.set(mid, []));
    all.forEach((item) => groups.get(getMid(item))?.push(item));
    return order.flatMap((mid) => groups.get(mid) ?? []);
  }, [stores, stampCardStores, streakStores]);

  // Filtered activity items for favorite stores — sorted by backend via separate query
  const favoriteActivityItems: ActivityItem[] = useMemo(() => {
    if (!favoriteStoreIds.length) return [];
    const favSet = new Set(favoriteStoreIds);

    // Build active items map for status enrichment
    const activeByStoreId = new Map<string, ActivityItem>();
    [...stores.map((s) => ({ type: 'store' as const, data: s as FlatStoreResult })),
     ...stampCardStores.map((s) => ({ type: 'stamp' as const, data: s })),
     ...streakStores.map((s) => ({ type: 'streak' as const, data: s })),
    ].forEach((item) => {
      const id = item.type === 'store' ? item.data.id : item.data.store.id;
      if (!activeByStoreId.has(id)) activeByStoreId.set(id, item);
    });

    // Use favStores order (sorted by backend) as the primary ordering
    const seen = new Set<string>();
    const result: ActivityItem[] = [];

    const addIfFav = (storeId: string, fallbackItem: ActivityItem) => {
      if (!favSet.has(storeId) || seen.has(storeId)) return;
      seen.add(storeId);
      const activeItem = activeByStoreId.get(storeId);
      // If no active item, mark as no-activity
      result.push(activeItem ?? { type: 'no-activity', data: (fallbackItem as any).data });
    };

    favStores.forEach((s) => addIfFav(s.id, { type: 'store', data: s as FlatStoreResult }));
    favStampCards.forEach((s) => addIfFav(s.store.id, { type: 'stamp', data: s }));
    favStreaks.forEach((s) => addIfFav(s.store.id, { type: 'streak', data: s }));

    return result;
  }, [favStores, favStampCards, favStreaks, stores, stampCardStores, streakStores, favoriteStoreIds]);

  return {
    filters: {
      ...data.appliedFilters,
      activeFilters,
      activeFiltersCount,
    },
    data: {
      activeItems,
      favoriteActivityItems,
      completedItems: [] as ActivityItem[],
      isLoading: isLoading || data.locationLoading || !data.userLocation,
      isLoadingMore,
      draftFilters,
    },
    utils: {
      getStampStatus,
      getStreakStatus,
      getStatus,
    },
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
