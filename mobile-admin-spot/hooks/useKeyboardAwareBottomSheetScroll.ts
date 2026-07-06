import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Keyboard, Platform } from "react-native";

export const useKeyboardAwareBottomSheetScroll = () => {
  const scrollViewRef = useRef<ComponentRef<typeof BottomSheetScrollView>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 140);
  }, [scrollViewRef]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  useEffect(() => {
    if (!isInputFocused || keyboardHeight <= 0) {
      return;
    }

    const firstTimeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 110);
    const secondTimeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 280);

    return () => {
      clearTimeout(firstTimeoutId);
      clearTimeout(secondTimeoutId);
    };
  }, [isInputFocused, keyboardHeight, scrollViewRef]);

  const keyboardExtraPadding = useMemo(() => {
    if (keyboardHeight <= 0) {
      return 0;
    }
    return isInputFocused
      ? Math.min(320, Math.round(keyboardHeight * 0.78))
      : Math.min(120, Math.round(keyboardHeight * 0.28));
  }, [isInputFocused, keyboardHeight]);

  return {
    scrollViewRef,
    keyboardExtraPadding,
    handleInputFocus,
    handleInputBlur,
  };
};
