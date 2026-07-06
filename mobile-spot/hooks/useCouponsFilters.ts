import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { useMemo } from 'react';

interface UseCouponsFiltersProps {
  displayType: CouponDisplayType;
  isFiltersModalVisible?: boolean;
}

export const useCouponsFilters = ({ displayType, isFiltersModalVisible = false }: UseCouponsFiltersProps) => {
  const { data, actions } = useFiltersLogic();

  const searchInput = useMemo(
    () => actions.buildSearchInput(data.appliedFilters, { coupon: { displayTypes: [displayType] } }),
    [actions, data.appliedFilters, displayType]
  );

  const draftSearchInput = useMemo(
    () => actions.buildSearchInput(data.draftFilters, { coupon: { displayTypes: [displayType] } }),
    [actions, data.draftFilters, displayType]
  );

  const { activeFilters, activeFiltersCount } = useActiveFilters({
    selectedCategories: data.appliedFilters.selectedCategories,
    maxDistance: data.appliedFilters.maxDistance,
    showChallenges: data.appliedFilters.showChallenges,
    loyaltyPrograms: data.appliedFilters.loyaltyPrograms,
    searchQuery: data.appliedFilters.searchQuery,
    categoriesData: data.categoriesData || undefined,
  });

  const { coupons, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: searchInput,
    enabled: !data.locationLoading,
    pageSize: 10,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: draftSearchInput,
    enabled: isFiltersModalVisible,
  });

  const { groupedByMerchant, popularGroup } = useMemo(() => {
    const popularCoupons: any[] = [];
    const groups = new Map<string, { merchant: any; coupons: any[] }>();

    coupons.forEach((coupon) => {
      if (coupon.priority && coupon.priority > 20) {
        popularCoupons.push(coupon);
      } else {
        const merchantId = coupon.merchant?.id || 'unknown';
        if (!groups.has(merchantId)) {
          groups.set(merchantId, { merchant: coupon.merchant, coupons: [] });
        }
        groups.get(merchantId)!.coupons.push(coupon);
      }
    });

    return {
      groupedByMerchant: Array.from(groups.values()),
      popularGroup: popularCoupons.length > 0 ? { coupons: popularCoupons } : null,
    };
  }, [coupons]);

  const draftFilters = buildDraftFiltersData(
    data.draftFilters,
    actions,
    filterResult?.coupons?.length,
    isLoadingCount
  );

  return {
    filters: {
      ...data.appliedFilters,
      activeFilters,
      activeFiltersCount,
    },
    data: {
      coupons,
      groupedByMerchant,
      popularGroup,
      city: data.city,
      isLoading: isLoading || data.locationLoading,
      isLoadingMore,
      draftFilters,
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
