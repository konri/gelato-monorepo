import type { AccessLevel } from '@/auth/levels';
import { spotStore, type SpotState, type StaffSpotVM, type SwitchReason } from '@/stores/spotStore';
import { useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

/** The whole spot context (re-renders on every change). */
export function useSpotState(): SpotState {
  return useSyncExternalStore(spotStore.subscribe, spotStore.getState, spotStore.getState);
}

/** The active spot id (null unless a spot is selected). Re-renders only when it changes. */
export function useActiveSpotId(): string | null {
  return useSyncExternalStore(spotStore.subscribe, spotStore.getActiveSpotId, spotStore.getActiveSpotId);
}

/** The localized city name of a spot (City.nameLocal by app language, else its name). */
export function spotCityName(spot: Pick<StaffSpotVM, 'cityName' | 'cityNameLocal'> | null, language: string): string | null {
  if (!spot) return null;
  const local = spot.cityNameLocal?.[language.toLowerCase()];
  return (typeof local === 'string' && local.trim()) || spot.cityName || null;
}

export type ActiveSpotInfo = {
  status: SpotState['status'];
  activeSpot: StaffSpotVM | null;
  activeSpotId: string | null;
  brandId: string | null;
  brandName: string | null;
  level: AccessLevel | null;
  /** More than one accessible spot (inactive ones count). Employees have exactly one. */
  canSwitch: boolean;
  /** The active spot's brand has spots in more than one city (show the city next to names). */
  multiCity: boolean;
  spots: StaffSpotVM[];
  cityName: string | null;
  setActiveSpot: (spotId: string, reason?: SwitchReason) => Promise<boolean>;
  refresh: () => Promise<void>;
};

export function useActiveSpot(): ActiveSpotInfo {
  const state = useSpotState();
  const { i18n } = useTranslation();
  return useMemo(() => {
    const activeSpotId = state.status === 'ready' ? state.activeSpotId : null;
    const activeSpot = activeSpotId ? state.spots.find((s) => s.spotId === activeSpotId) ?? null : null;
    const brandId = activeSpot?.brandId ?? state.brand?.id ?? null;
    const cities = new Set(
      state.spots.filter((s) => s.brandId === brandId).map((s) => s.cityId ?? ''),
    );
    return {
      status: state.status,
      activeSpot,
      activeSpotId,
      brandId,
      brandName: activeSpot?.brandName ?? state.brand?.name ?? null,
      level: activeSpot?.level ?? null,
      canSwitch: state.staffKind !== 'EMPLOYEE' && state.spots.length > 1,
      multiCity: cities.size > 1,
      spots: state.spots,
      cityName: spotCityName(activeSpot, i18n.language),
      setActiveSpot: (spotId: string, reason: SwitchReason = 'user') => spotStore.setActiveSpot(spotId, reason),
      refresh: () => spotStore.refresh('manual'),
    };
  }, [state, i18n.language]);
}
