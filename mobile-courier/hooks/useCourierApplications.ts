import {
  City,
  CourierApplication,
  CourierApprovedSpot,
  CourierDelivery,
  CourierEarningsSummary,
  CourierProfile,
  Spot,
  WorkSession,
  applyCourierToSpot,
  getAllSpots,
  getAvailableDeliveries,
  getCities,
  getCourierProfile,
  getMyEarnings,
  getMyActiveDelivery,
  getMyDeliveryHistory,
  getMyActiveWorkSession,
  getMyApprovedSpots,
  getMyCourierApplications,
  getSpotsByCity,
} from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

// Active cities (for the apply-to-spot city picker).
export const useCities = () => useGraphQLQuery<City[]>(getCities, {}, []);

// Spots scoped to the chosen city (falls back to all spots when none picked).
export const useSpotsByCity = (cityId: string | null) =>
  useGraphQLQuery<Spot[]>(
    (options) => (cityId ? getSpotsByCity(cityId, options) : getAllSpots(options)),
    {},
    [cityId],
  );

// The current courier's spot applications (pending / approved / rejected).
export const useMyCourierApplications = () =>
  useGraphQLQuery<CourierApplication[]>(getMyCourierApplications, {}, []);

// Apply to a spot; returns the created application (or throws on error).
export const applyToSpot = applyCourierToSpot;

// Spots the courier is approved to work at (for the go-online picker).
export const useMyApprovedSpots = () =>
  useGraphQLQuery<CourierApprovedSpot[]>(getMyApprovedSpots, {}, []);

// The courier's currently-active work session (null if offline).
export const useMyActiveWorkSession = () =>
  useGraphQLQuery<WorkSession | null>(getMyActiveWorkSession, {}, []);

// Deliveries offered to the courier right now (READY, unassigned, my spots).
export const useAvailableDeliveries = () =>
  useGraphQLQuery<CourierDelivery[]>(getAvailableDeliveries, {}, []);

// The courier's current in-progress delivery (null if none).
export const useMyActiveDelivery = () =>
  useGraphQLQuery<CourierDelivery | null>(getMyActiveDelivery, {}, []);

// The courier's completed deliveries (history tab).
export const useMyDeliveryHistory = () =>
  useGraphQLQuery<CourierDelivery[]>(getMyDeliveryHistory, {}, []);

// The courier's own profile stats (total deliveries + average rating).
export const useCourierProfile = () =>
  useGraphQLQuery<CourierProfile | null>(getCourierProfile, {}, []);

// Earnings dashboard summary (today/month/total + per-day breakdown).
export const useMyEarnings = () =>
  useGraphQLQuery<CourierEarningsSummary>(getMyEarnings, {}, []);
