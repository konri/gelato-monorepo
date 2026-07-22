export type CourierApplicationStatus = 'pending' | 'approved' | 'rejected';

export type CourierApplication = {
  id: string;
  spotId: string;
  status: CourierApplicationStatus;
  appliedAt: string;
  reviewedAt?: string | null;
  spotName?: string | null;
  spotAddress?: string | null;
  cityName?: string | null;
};

export type MyCourierApplicationsResponse = {
  myCourierApplications: CourierApplication[];
};

export type ApplyCourierToSpotResponse = {
  applyCourierToSpot: CourierApplication;
};

export type CourierApprovedSpot = {
  spotId: string;
  spotName: string;
  spotAddress?: string | null;
  cityName?: string | null;
  isActive: boolean;
};

export type WorkSession = {
  id: string;
  courierId: string;
  selectedSpotIds: string[];
  startedAt: string;
  endedAt?: string | null;
};

export type MyApprovedSpotsResponse = {
  myApprovedSpots: CourierApprovedSpot[];
};

export type MyActiveWorkSessionResponse = {
  myActiveWorkSession: WorkSession | null;
};

export type StartWorkSessionResponse = {
  startWorkSession: WorkSession;
};

export type EndWorkSessionResponse = {
  endWorkSession: boolean;
};

export type CourierDeliveryStatus =
  | 'READY'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export type CourierDelivery = {
  id: string;
  orderNumber: string;
  status: CourierDeliveryStatus | string;
  total: number;
  payout: number;
  itemCount: number;
  spotId: string;
  spotName: string;
  spotAddress?: string | null;
  spotLatitude: number;
  spotLongitude: number;
  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  apartmentNumber?: string | null;
  floor?: string | null;
  noteForCourier?: string | null;
  distanceKm?: number | null;
  readyAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  courierRating?: number | null;
  reviewComment?: string | null;
};

export type AvailableDeliveriesResponse = {
  availableDeliveries: CourierDelivery[];
};

export type MyActiveDeliveryResponse = {
  myActiveDelivery: CourierDelivery | null;
};

export type MyDeliveryHistoryResponse = {
  myDeliveryHistory: CourierDelivery[];
};

export type CourierProfile = {
  id: string;
  totalDeliveries: number;
  averageRating?: number | null;
  totalEarnings: number;
};

export type CourierProfileResponse = {
  courierProfile: CourierProfile | null;
};

export type CourierDailyEarning = {
  date: string;
  amount: number;
  deliveries: number;
};

export type CourierEarningsSummary = {
  todayAmount: number;
  todayDeliveries: number;
  monthAmount: number;
  monthDeliveries: number;
  totalAmount: number;
  daily: CourierDailyEarning[];
};

export type MyEarningsResponse = {
  myEarnings: CourierEarningsSummary;
};

export type AcceptDeliveryResponse = {
  acceptDelivery: CourierDelivery;
};

export type UpdateDeliveryStatusResponse = {
  updateDeliveryStatus: boolean;
};

export type UpdateCourierLocationResponse = {
  updateCourierLocation: boolean;
};
