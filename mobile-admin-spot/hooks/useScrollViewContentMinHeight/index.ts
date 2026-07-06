import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

export const useScrollViewContentMinHeight = (paddingBottom: number) => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const onScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);
  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom,
      ...(viewportHeight > 0 ? { minHeight: viewportHeight } : {}),
    }),
    [paddingBottom, viewportHeight],
  );
  return { onScrollViewLayout, contentContainerStyle };
};
