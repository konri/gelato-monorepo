import { ViewStyle } from "react-native";

export type RemoteIconProps = {
  url: string | null | undefined;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: ViewStyle;
  fallback?: React.ReactNode;
  onError?: () => void;
  onLoad?: () => void;
};
