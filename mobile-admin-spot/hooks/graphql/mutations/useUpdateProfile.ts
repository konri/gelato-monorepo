import type { SignUpDetailsFormData } from "@/components/molecules/SignUpDetailsForm/types";
import { UPDATE_PROFILE_MUTATION } from "@/shared/api-client/src/graphql/mutations/profile/mutation";
import {
  UpdateProfileInput,
  UpdateProfileResponse,
} from "@/shared/api-client/src/graphql/mutations/profile/types";
import { WHO_AM_I_QUERY } from "@/shared/api-client/src/graphql/queries/user";
import { normalizeBirthDate, validateBirthDate } from "@/utils/validators";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type UpdateProfileVariables = {
    data: UpdateProfileInput;
};

type UpdateData = {
    firstName?: string;
    surname?: string;
    name?: string;
    phone?: string;
    birthDate?: string;
    picture?: string;
    referralCode?: string;
};

export const buildUpdateData = (
    data: SignUpDetailsFormData,
    profileImage: string | null,
    isFirstTimeLogin: boolean
): UpdateData => {
    const { firstName, surname, birthDate, referralCode, ...dataWithoutBirthDate } = data;

    return {
        ...dataWithoutBirthDate,
        ...(birthDate && birthDate.trim() && validateBirthDate(birthDate) && {
            birthDate: normalizeBirthDate(birthDate),
        }),
        ...(profileImage === ""
            ? { picture: "" }
            : profileImage
              ? { picture: profileImage }
              : {}),
        ...(isFirstTimeLogin && referralCode && { referralCode }),
        ...((firstName || surname) && {
            name: `${firstName || ""} ${surname || ""}`.trim(),
        }),
    };
};

/**
 * Hook to update user profile
 *
 * @example
 * const [updateProfile, { loading, error }] = useUpdateProfile();
 * await updateProfile({
 *   variables: {
 *     data: { firstName: "John", surname: "Doe" }
 *   }
 * });
 */
export const useUpdateProfile = () => {
    return useMutationWithErrorHandling<UpdateProfileResponse, UpdateProfileVariables>(
        UPDATE_PROFILE_MUTATION,
        {
            operationName: "UpdateProfile",
            refetchQueries: [{ query: WHO_AM_I_QUERY }],
        }
    );
};
