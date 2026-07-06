import { logger } from "@/utils/logger";

let GoogleSignin: { signOut: () => Promise<void> } | null;
try {
  GoogleSignin =
    require("@react-native-google-signin/google-signin").GoogleSignin;
} catch {
  GoogleSignin = null;
}

export const googleSignOutIfConfigured = async (): Promise<void> => {
  if (!GoogleSignin) {
    return;
  }
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    logger.error("Error signing out from Google:", error);
  }
};
