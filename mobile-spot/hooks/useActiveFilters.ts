import { ActiveFilter } from '@/components/molecules/ActiveFiltersBar/types';
import { useMemo } from 'react';

interface UseActiveFiltersInput {
  selectedCategories: string[];
  maxDistance: number;
  showChallenges: boolean;
  loyaltyPrograms: string[];
  searchQuery?: string;
  categoriesData?: { items: Array<{ id: string; name: string }> };
}

export function useActiveFilters(input: UseActiveFiltersInput): {
  activeFilters: ActiveFilter[];
  activeFiltersCount: number;
} {
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = [];

    // Categories
    if (input.selectedCategories.length > 0 && input.categoriesData) {
      input.selectedCategories.forEach((id) => {
        const category = input.categoriesData!.items.find((cat) => cat.id === id);
        if (category) {
          filters.push({
            id: `category-${id}`,
            type: 'category',
            label: category.name,
            icon: '🏷️',
            value: id,
          });
        }
      });
    }

    // Distance
    if (input.maxDistance < 10) {
      let label: string;
      if (input.maxDistance < 1) {
        label = `${Math.round(input.maxDistance * 1000)} m`;
      } else {
        // Round to 2 decimal places and remove trailing zeros
        const rounded = Math.round(input.maxDistance * 100) / 100;
        // Check if it's a whole number
        label = rounded % 1 === 0 ? `${rounded} km` : `${rounded.toFixed(2).replace(/\.?0+$/, '')} km`;
      }
      
      filters.push({
        id: 'distance-radius',
        type: 'distance',
        label,
        icon: '📍',
        value: input.maxDistance,
      });
    }

    // Challenges
    if (input.showChallenges) {
      filters.push({
        id: 'challenges',
        type: 'challenges',
        label: 'Wyzwania',
        icon: '🎯',
        value: true,
      });
    }

    // Loyalty Programs
    if (input.loyaltyPrograms.includes('stamps')) {
      filters.push({
        id: 'loyalty-stamps',
        type: 'loyaltyPrograms',
        label: 'Karty pieczątek',
        icon: '🎫',
        value: 'stamps',
      });
    }

    if (input.loyaltyPrograms.includes('points')) {
      filters.push({
        id: 'loyalty-points',
        type: 'loyaltyPrograms',
        label: 'Punkty',
        icon: '💰',
        value: 'points',
      });
    }

    // Search Query
    if (input.searchQuery && input.searchQuery.trim()) {
      filters.push({
        id: 'search',
        type: 'search',
        label: `"${input.searchQuery}"`,
        icon: '🔍',
        value: input.searchQuery,
      });
    }

    return filters;
  }, [
    input.selectedCategories,
    input.maxDistance,
    input.showChallenges,
    input.loyaltyPrograms,
    input.searchQuery,
    input.categoriesData,
  ]);

  return {
    activeFilters,
    activeFiltersCount: activeFilters.length,
  };
}
