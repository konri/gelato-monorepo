import { useActiveFilters } from '@/hooks/useActiveFilters';
import { ActivityItem, ActivityItemStatus } from '@/hooks/useAwardsFilters';
import { useFavoriteStores } from '@/hooks/useFavoriteStores';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';
import { StampCardStoreResult, StreakStoreResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type FlatStoreResult = { id: string; name: string; merchant?: { id: string; name: string; logoUrl?: string } };

export const useFavoriteMerchantsFilters = (isFiltersModalVisible = false) => {
  const { t } = useTranslation();
  const { data, actions } = useFiltersLogic();
  const { data: favorites } = useFavoriteStores();

  const favoriteStoreIds = useMemo(
    () => favorites.map((f) => f.merchantStore.id),
    [favorites]
  );
  const favSet = useMemo(() => new Set(favoriteStoreIds), [favoriteStoreIds]);

  const enabled = !data.locationLoading && !!data.userLocation;

  // Query with onlyUserActive for status enrichment
  const activeSearchInput = useMemo(() => ({
    ...data.searchInput,
    search: { ...data.searchInput.search, onlyUserActive: true },
  }), [data.searchInput]);

  const { stores: activeStores, stampCardStores: activeStamps, streakStores: activeStreaks, isLoading: isLoadingActive } = useUnifiedSearch({
    input: activeSearchInput,
    enabled,
    pageSize: 200,
  });

  // Query without onlyUserActive for ordering/all favorites
  const { stores: allStores, stampCardStores: allStamps, streakStores: allStreaks, isLoading: isLoadingAll, isLoadingMore, loadMore } = useUnifiedSearch({
    input: data.searchInput,
    enabled: enabled && favoriteStoreIds.length > 0,
    pageSize: 200,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: data.draftSearchInput,
    enabled: isFiltersModalVisible,
  });

  const favFilterCount = useMemo(() => {
    if (!filterResult?.stores) return undefined;
    return filterResult.stores.filter((s: any) => favSet.has(s.store?.id ?? s.id)).length;
  }, [filterResult, favSet]);

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
    favFilterCount,
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

  const items: ActivityItem[] = useMemo(() => {
    const activeByStoreId = new Map<string, ActivityItem>();
    [
      ...activeStores.map((s) => ({ type: 'store' as const, data: s as FlatStoreResult })),
      ...activeStamps.map((s) => ({ type: 'stamp' as const, data: s })),
      ...activeStreaks.map((s) => ({ type: 'streak' as const, data: s })),
    ].forEach((item) => {
      const id = item.type === 'store' ? item.data.id : item.data.store.id;
      if (!activeByStoreId.has(id)) activeByStoreId.set(id, item);
    });

    const seen = new Set<string>();
    const result: ActivityItem[] = [];

    const addIfFav = (storeId: string, fallback: ActivityItem) => {
      if (!favSet.has(storeId) || seen.has(storeId)) return;
      seen.add(storeId);
      result.push(activeByStoreId.get(storeId) ?? { type: 'no-activity', data: (fallback as any).data });
    };

    allStores.forEach((s) => addIfFav(s.id, { type: 'store', data: s as FlatStoreResult }));
    allStamps.forEach((s) => addIfFav(s.store.id, { type: 'stamp', data: s }));
    allStreaks.forEach((s) => addIfFav(s.store.id, { type: 'streak', data: s }));

    return result;
  }, [allStores, allStamps, allStreaks, activeStores, activeStamps, activeStreaks, favSet]);

  return {
    filters: { ...data.appliedFilters, activeFilters, activeFiltersCount },
    data: {
      items,
      favorites,
      isLoading: isLoadingActive || isLoadingAll || data.locationLoading || !data.userLocation,
      isLoadingMore,
      draftFilters,
    },
    utils: { getStatus },
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
