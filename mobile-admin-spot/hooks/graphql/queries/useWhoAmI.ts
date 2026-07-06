import { useAuthState } from "@/hooks/useAuthState";
import { WHO_AM_I_QUERY } from "@/shared/api-client/src/graphql/queries/user/query";
import {
  GetWhoAmIResponse,
  type UserData,
} from "@/shared/api-client/src/graphql/queries/user/types";
import { parseBirthDateFromApi } from "@/utils/validators";
import { useMemo } from "react";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

const mapWhoAmIUser = (u: Partial<UserData>): UserData => ({
  id: u.id ?? "",
  name: u.name ?? "",
  email: u.email ?? "",
  roles: u.roles ?? [],
  firstName: u.firstName ?? "",
  surname: u.surname ?? "",
  phone: u.phone ?? "",
  birthDate: parseBirthDateFromApi(u.birthDate),
  picture: u.picture ?? "",
  profileType: u.profileType ?? "",
  language: u.language ?? "",
  locationPermission: u.locationPermission ?? false,
});

export const useWhoAmI = () => {
  const { isLoggedIn } = useAuthState();
  const queryResult = useQueryWithErrorHandling<GetWhoAmIResponse>(WHO_AM_I_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: !isLoggedIn,
    errorPolicy: "all",
    operationName: "WhoAmI",
  });

  const data = useMemo((): GetWhoAmIResponse | undefined => {
    const raw = queryResult.data;
    if (!raw?.whoAmI) {
      return undefined;
    }
    return { whoAmI: mapWhoAmIUser(raw.whoAmI) };
  }, [queryResult.data]);

  return {
    ...queryResult,
    data,
  };
};
