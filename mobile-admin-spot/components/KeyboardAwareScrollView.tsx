import { colors } from "@/constants/colors";
import React, { ReactNode, createContext, useContext, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  TextInput,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  children: ReactNode;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type KeyboardAwareContextType = {
  scrollToInput: (inputRef: TextInput | null) => void;
};

const KeyboardAwareContext = createContext<KeyboardAwareContextType | null>(null);

export const useKeyboardAwareScroll = () => {
  return useContext(KeyboardAwareContext);
};

export const KeyboardAwareScrollView = ({
  children,
  keyboardVerticalOffset,
  contentContainerStyle,
  style,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const defaultOffset =
    Platform.OS === "ios" ? insets.top + 20 : 0;
  const offset = keyboardVerticalOffset ?? defaultOffset;

  const scrollToInput = (inputRef: TextInput | null) => {
    if (!inputRef || !scrollViewRef.current) return;

    setTimeout(() => {
      inputRef.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          const scrollToY = y - 100;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollToY),
            animated: true,
          });
        },
        () => {}
      );
    }, 100);
  };

  return (
    <KeyboardAwareContext.Provider value={{ scrollToInput }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={offset}
        style={{ flex: 1, backgroundColor: colors.screen.background }}
      >
        <ScrollView
          ref={scrollViewRef}
          {...scrollViewProps}
          style={[{ flex: 1, backgroundColor: colors.screen.background }, style]}
          contentContainerStyle={[
            { paddingBottom: insets.bottom + 20 },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardAwareContext.Provider>
  );
};
