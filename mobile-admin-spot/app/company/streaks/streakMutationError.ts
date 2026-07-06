import { getErrorMessage } from "@/utils/apolloError";

const UNIQUE_STREAK_NAME_ERROR_FRAGMENT = "Unique constraint failed on the fields: (`merchantId`,`name`)";

export const isDuplicateStreakNameError = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  if (!message) {
    return false;
  }

  return message.includes(UNIQUE_STREAK_NAME_ERROR_FRAGMENT);
};
