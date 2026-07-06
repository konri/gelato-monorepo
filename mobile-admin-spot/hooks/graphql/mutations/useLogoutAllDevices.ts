import {
  LOGOUT_ALL_DEVICES_MUTATION,
  type LogoutAllDevicesResponse,
} from "@/shared/api-client/src/graphql/mutations/auth";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useLogoutAllDevices = () => {
  return useMutationWithErrorHandling<LogoutAllDevicesResponse, Record<string, never>>(
    LOGOUT_ALL_DEVICES_MUTATION,
    {
      operationName: "LogoutAllDevices",
    },
  );
};
