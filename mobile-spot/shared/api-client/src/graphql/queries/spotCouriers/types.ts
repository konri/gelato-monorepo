export type SpotCourier = {
  courierId: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  totalDeliveries: number;
  totalEarnings: number;
  averageRating?: number | null;
  activeHere: boolean;
};

export type SpotCourierApplication = {
  id: string;
  courierId: string;
  courierName: string;
  courierPhone?: string | null;
  totalDeliveries: number;
  status: string;
  appliedAt: string;
};

export type SpotCourierEarning = {
  courierId: string;
  name: string;
  amount: number;
  deliveries: number;
};

export type SpotCourierEarningsSummary = {
  totalAmount: number;
  totalDeliveries: number;
  couriers: SpotCourierEarning[];
};

export type SpotCouriersResponse = { spotCouriers: SpotCourier[] };
export type SpotCourierApplicationsResponse = { spotCourierApplications: SpotCourierApplication[] };
export type SpotCourierEarningsResponse = { spotCourierEarnings: SpotCourierEarningsSummary };
