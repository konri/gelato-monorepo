export type DashboardEmployeeStat = {
  preparedById?: string | null;
  name: string;
  orders: number;
  revenue: number;
};

export type DashboardDailyStat = {
  date: string;
  revenue: number;
  orders: number;
};

export type SpotDashboard = {
  revenue: number;
  orders: number;
  averageOrder: number;
  byEmployee: DashboardEmployeeStat[];
  daily: DashboardDailyStat[];
};

export type SpotEmployee = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  surname?: string | null;
  email: string;
};

export type SpotDashboardResponse = { spotDashboard: SpotDashboard };
export type SpotEmployeesResponse = { spotEmployees: SpotEmployee[] };
