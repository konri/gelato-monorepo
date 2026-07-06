import type { SignUpDetailsFormData } from "@/components/molecules/SignUpDetailsForm/types";

type UserSliceForSignUpDefaults = {
  firstName?: string;
  surname?: string;
  phone?: string;
  birthDate?: string;
};

export const buildSignUpDetailsDefaultsFromUser = (
  user: UserSliceForSignUpDefaults | undefined | null,
): Partial<SignUpDetailsFormData> | undefined => {
  if (!user) {
    return undefined;
  }
  return {
    firstName: user.firstName ?? "",
    surname: user.surname ?? "",
    phone: user.phone ?? "",
    birthDate: user.birthDate ?? "",
  };
};
