import React, { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  View,
  type KeyboardEvent,
  type ScrollViewProps,
} from 'react-native';

/** Space kept between the focused field and the top of the keyboard. */
const FIELD_GAP = 24;

const KeyboardAwareScrollContext = createContext<(() => void) | null>(null);

/** Ask the surrounding keyboard-aware scroll view to bring the focused field up. */
export function useScrollFocusedInputIntoView(): () => void {
  const scrollIntoView = useContext(KeyboardAwareScrollContext);
  return useCallback(() => {
    setTimeout(() => scrollIntoView?.(), 32);
  }, [scrollIntoView]);
}

type TextInputProps = React.ComponentProps<typeof TextInput>;

/** TextInput that scrolls itself above the keyboard when it is inside a KeyboardAwareScrollView. */
export const KeyboardAwareTextInput = React.forwardRef<TextInput, TextInputProps>(
  function KeyboardAwareTextInput(props, ref) {
    const scrollFocusedInputIntoView = useScrollFocusedInputIntoView();
    return (
      <TextInput
        ref={ref}
        {...props}
        onFocus={(event) => {
          props.onFocus?.(event);
          scrollFocusedInputIntoView();
        }}
      />
    );
  },
);

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  /**
   * When false, only scrolls the focused field. The keyboard inset is left to
   * a parent KeyboardAvoidingView (modals and bottom sheets).
   */
  adjustInsets?: boolean;
};

/**
 * Scrolls the focused input above the keyboard and keeps the rest of the form
 * reachable. iOS uses the native scroll-view keyboard inset. Android (edge to
 * edge, so the window does not resize) pads the content by the overlap.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      adjustInsets = true,
      children,
      contentContainerStyle,
      keyboardShouldPersistTaps = 'handled',
      onTouchEnd,
      ...rest
    },
    ref,
  ) {
    const scrollRef = useRef<ScrollView>(null);
    const innerRef = useRef<View>(null) as React.RefObject<View>;
    const keyboardTop = useRef<number | null>(null);
    const [androidOverlap, setAndroidOverlap] = useState(0);

    const setScrollRef = useCallback(
      (node: ScrollView | null) => {
        scrollRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const scrollFocusedIntoView = useCallback(() => {
      const top = keyboardTop.current;
      const scroll = scrollRef.current;
      const inner = innerRef.current;
      const input = TextInput.State.currentlyFocusedInput();
      if (top == null || scroll == null || inner == null || input == null) return;

      input.measureInWindow((_x, screenY, _width, height) => {
        if (screenY + height + FIELD_GAP <= top) return;

        input.measureLayout(
          inner,
          (_left, contentY, _layoutWidth, layoutHeight) => {
            const nativeScroll = scroll.getNativeScrollRef();
            if (nativeScroll == null) return;
            nativeScroll.measureInWindow((_sx, scrollScreenY, _sw, scrollHeight) => {
              const visibleBottom = Math.min(scrollScreenY + scrollHeight, top);
              const visibleHeight = Math.max(0, visibleBottom - scrollScreenY);
              const target = Math.max(0, contentY + layoutHeight + FIELD_GAP - visibleHeight);
              scroll.scrollTo({ y: target, animated: true });
            });
          },
          () => {
            // Focused input is not inside this scroll view (for example a modal
            // opened above another screen).
          },
        );
      });
    }, []);

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const onShow = (event: KeyboardEvent) => {
        keyboardTop.current = event.endCoordinates.screenY;
        if (adjustInsets && Platform.OS === 'android') {
          const windowHeight = Dimensions.get('window').height;
          const overlap = Math.min(
            event.endCoordinates.height,
            Math.max(0, windowHeight - event.endCoordinates.screenY),
          );
          setAndroidOverlap(overlap);
        }
      };
      const onHide = () => {
        keyboardTop.current = null;
        setAndroidOverlap(0);
      };

      const showSub = Keyboard.addListener(showEvent, onShow);
      const hideSub = Keyboard.addListener(hideEvent, onHide);
      // After the iOS inset animation. Android scrolls once padding is applied.
      const didShowSub =
        Platform.OS === 'ios'
          ? Keyboard.addListener('keyboardDidShow', () => {
              scrollFocusedIntoView();
            })
          : null;

      return () => {
        showSub.remove();
        hideSub.remove();
        didShowSub?.remove();
      };
    }, [adjustInsets, scrollFocusedIntoView]);

    useEffect(() => {
      if (androidOverlap <= 0) return;
      const id = setTimeout(scrollFocusedIntoView, 50);
      return () => clearTimeout(id);
    }, [androidOverlap, scrollFocusedIntoView]);

    return (
      <KeyboardAwareScrollContext.Provider value={scrollFocusedIntoView}>
        <ScrollView
          {...rest}
          ref={setScrollRef}
          innerViewRef={innerRef}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          automaticallyAdjustKeyboardInsets={adjustInsets && Platform.OS === 'ios'}
          contentContainerStyle={[
            contentContainerStyle,
            androidOverlap > 0 ? { paddingBottom: androidOverlap + FIELD_GAP } : null,
          ]}
          onTouchEnd={(event) => {
            onTouchEnd?.(event);
            // Moving between fields does not change the keyboard frame, so the
            // show listener does not run again.
            if (keyboardTop.current == null) return;
            scrollFocusedIntoView();
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAwareScrollContext.Provider>
    );
  },
);
