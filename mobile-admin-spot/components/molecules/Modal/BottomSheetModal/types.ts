import type {
  BottomSheetFooterProps,
  BottomSheetModalProps as GorhomBottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { ReactNode } from "react";

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  enablePanDownToClose?: boolean;
  footerComponent?: (props: BottomSheetFooterProps) => ReactNode;
  keyboardBehavior?: GorhomBottomSheetModalProps["keyboardBehavior"];
  keyboardBlurBehavior?: GorhomBottomSheetModalProps["keyboardBlurBehavior"];
  androidKeyboardInputMode?: GorhomBottomSheetModalProps["android_keyboardInputMode"];
};

export type { BottomSheetModalProps };
