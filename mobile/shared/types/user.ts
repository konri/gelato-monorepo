import type { UserRole } from './auth';

export type User = {
  email: string;
  picture?: string;
  role: UserRole;
  name: string;
  firstName?: string;
  surname?: string;
  profileType?: 'local' | 'google' | 'apple';
  locationPermission?: boolean;
  notificationPermission?: boolean;
  preferredCity?: string;
};
