// NOTE: `unreadNotificationsCount` / `NotificationCategory` are Bonapka-template
// operations the Loodly backend does not implement. Stubbed to 0 to avoid
// GraphQL errors on launch until a Loodly notifications feature is built.
export const useUnreadNotificationsCount = () => {
  return { data: 0, loading: false, error: null, refetch: async () => {} };
};
