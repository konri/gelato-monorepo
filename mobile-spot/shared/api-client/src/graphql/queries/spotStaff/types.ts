export type StaffMember = {
  id: string;
  email: string;
  name?: string | null;
  role?: string; // present for admins; employees are implicitly EMPLOYEE
  loginDisabled: boolean;
  createdAt: string;
};

export type StaffLoginSession = {
  id: string;
  userId: string;
  staffName: string;
  role: string;
  ipAddress?: string | null;
  loginAt: string;
};

export type SpotStaffAdminsResponse = { spotStaffAdmins: StaffMember[] };
export type SpotEmployeesResponse = { spotEmployees: StaffMember[] };
export type SpotStaffSessionsResponse = { spotStaffSessions: StaffLoginSession[] };
