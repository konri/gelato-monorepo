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
  // Admin/spot app fields.
  id?: string;
  roles?: string[];
  spotId?: string | null;
  firstLogin?: boolean;
};
