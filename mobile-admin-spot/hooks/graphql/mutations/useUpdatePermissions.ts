import { UPDATE_PERMISSIONS } from "@/shared/api-client/src/api/graphql-operations";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type UpdatePermissionsResponse = {
  updatePermissions: {
    id: string;
    locationPermission?: boolean;
    notificationPermission?: boolean;
    preferredCity?: string;
  };
};

type UpdatePermissionsVariables = {
  location?: boolean;
  notification?: boolean;
  city?: string;
};

/**
 * Hook to update user permissions (location, notifications, preferred city)
 *
 * @example
 * const [updatePermissions, { loading, error }] = useUpdatePermissions();
 * await updatePermissions({
 *   variables: {
 *     location: true,
 *     notification: false,
 *     city: "Warsaw"
 *   }
 * });
 */
export const useUpdatePermissions = () => {
  return useMutationWithErrorHandling<UpdatePermissionsResponse, UpdatePermissionsVariables>(
    UPDATE_PERMISSIONS,
    {
      operationName: "UpdatePermissions",
    }
  );
};
