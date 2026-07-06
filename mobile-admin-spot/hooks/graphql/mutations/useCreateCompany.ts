import { useAuthState } from "@/hooks/useAuthState";
import { useUserSync } from "@/hooks/useUserSync";
import {
    CompanyInput,
    CREATE_COMPANY_MUTATION,
    CreateCompanyResponse,
} from "@/shared/api-client/src/graphql/mutations/company";
import { GET_MY_COMPANY_QUERY } from "@/shared/api-client/src/graphql/queries/company";
import { MY_OPERATOR_CAPABILITIES_QUERY } from "@/shared/api-client/src/graphql/queries/operatorCapabilities";
import { GET_PROFILE_SETUP_STATUS_QUERY } from "@/shared/api-client/src/graphql/queries/profileSetupStatus";
import { logger } from "@/utils/logger";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type CreateCompanyVariables = {
  data: CompanyInput;
};

type UseCreateCompanyOptions = {
  onCompanyCreated?: () => void;
};

export const useCreateCompany = (options?: UseCreateCompanyOptions) => {
  const { user, updateAuthState } = useAuthState();
  const { handlePostLogin, syncUserData } = useUserSync();

  return useMutationWithErrorHandling<CreateCompanyResponse, CreateCompanyVariables>(
    CREATE_COMPANY_MUTATION,
    {
      operationName: "CreateCompany",
      refetchQueries: [
        { query: GET_MY_COMPANY_QUERY },
        { query: MY_OPERATOR_CAPABILITIES_QUERY },
        { query: GET_PROFILE_SETUP_STATUS_QUERY },
      ],
      awaitRefetchQueries: false,
      onCompleted: async (data) => {
        const newToken = data.createCompanyAndMakeUserOwner.token;

        if (!newToken) {
          logger.warn("No token returned from createCompanyAndMakeUserOwner");
          options?.onCompanyCreated?.();
          return;
        }

        try {
          if (user) {
            await handlePostLogin(user, newToken, "email");
          } else {
            const synced = await syncUserData("email");
            if (synced) {
              await updateAuthState(synced, newToken);
            } else {
              logger.warn(
                "Could not refresh auth user after company creation (no user in memory and whoAmI empty)",
              );
            }
          }
        } catch (error) {
          logger.error("Error refreshing auth state after company creation:", error);
        }
        options?.onCompanyCreated?.();
      },
    }
  );
};
