import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONTENT_END_GAP = 24;

export const useCompanyScrollBottomInset = (): number => {
  const insets = useSafeAreaInsets();
  return insets.bottom + CONTENT_END_GAP;
};
