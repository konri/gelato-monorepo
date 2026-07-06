import { normalizeBirthDate, unformatPhoneNumber } from "@/utils/validators";
import { SignUpDetailsFormData } from "./types";

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
  const { firstName, surname, phone, birthDate, referralCode } = data;

  const updateData: UpdateData = {};

  // Only add fields that have values
  if (firstName) updateData.firstName = firstName;
  if (surname) updateData.surname = surname;
  
  // Add +48 prefix to phone if it doesn't have it, and remove spaces
  if (phone) {
    const digitsOnly = unformatPhoneNumber(phone);
    updateData.phone = digitsOnly.startsWith('+') ? digitsOnly : `+48${digitsOnly}`;
  }
  
  if (birthDate) updateData.birthDate = normalizeBirthDate(birthDate);
  if (profileImage) updateData.picture = profileImage;
  
  // Only add referralCode if it's first time login AND code is not empty
  if (isFirstTimeLogin && referralCode && referralCode.trim()) {
    updateData.referralCode = referralCode.trim();
  }

  // Build full name if we have first or last name
  if (firstName || surname) {
    updateData.name = `${firstName || ""} ${surname || ""}`.trim();
  }

  return updateData;
};
