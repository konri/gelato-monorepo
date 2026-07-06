import type { SignUpDetailsFormData } from "@/components/molecules/SignUpDetailsForm/types";
import {
  safeGetItem,
  safeSetItem,
} from "@/utils/safeAsyncStorage";
import { buildUpdateData, useUpdateProfile } from "./graphql/mutations/useUpdateProfile";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStoredUserData = async (): Promise<Record<string, unknown>> => {
  const currentUserData = await safeGetItem("userData");
  if (!currentUserData) {
    return {};
  }

  try {
    const parsed = JSON.parse(currentUserData);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const useProfileUpdate = () => {
  const [updateProfile] = useUpdateProfile();

  const submitProfileUpdate = async (
    data: SignUpDetailsFormData,
    profileImage: string | null,
    isFirstTimeLogin: boolean,
  ): Promise<boolean> => {
    const updateData = buildUpdateData(data, profileImage, isFirstTimeLogin);

    if (Object.keys(updateData).length === 0) {
      return false;
    }

    const result = await updateProfile({
      variables: { data: updateData },
    });

    if (result.data?.updateProfile) {
      const storedUserData = await getStoredUserData();
      const updatedUserData = {
        ...storedUserData,
        ...result.data.updateProfile,
      };
      await safeSetItem("userData", JSON.stringify(updatedUserData));
    }

    return true;
  };

  return { submitProfileUpdate };
};
