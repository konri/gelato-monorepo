import { StyleSheet } from 'react-native';
import { PALETTE as C } from './onboarding/palette';

/**
 * Onboarding (app/onboarding): the landing page look — cream background,
 * espresso / berry type, berry pill buttons (landing BTN_PRIMARY /
 * BTN_SECONDARY). Sized for older users: titles ≥ 28, body ≥ 18, 56 dp
 * buttons, high-contrast text (espresso on cream ≈ 15:1, white on berry ≈ 5:1).
 */

/** Screens shorter than this (iPhone SE class, 667 pt) get the compact type scale. */
export const COMPACT_HEIGHT = 740;

export const ONBOARDING_TYPE = {
  compact: { title: 28, titleLine: 34, body: 18, bodyLine: 26, lockup: 44 },
  regular: { title: 32, titleLine: 38, body: 19, bodyLine: 28, lockup: 56 },
} as const;

/** Text scaling caps, so Dynamic Type still fits a 667 pt screen without scrolling. */
export const MAX_FONT_SCALE = { title: 1.2, body: 1.3, button: 1.3 } as const;

export const BUTTON_HEIGHT = 56;
export const COPY_GAP = 12;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  header: { alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  pager: { flex: 1 },
  page: { flex: 1 },
  art: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: COPY_GAP,
    justifyContent: 'flex-start',
  },
  title: {
    fontFamily: 'Urbanist',
    color: C.espresso,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: 'Urbanist-Medium',
    color: C.espressoLight,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  button: {
    flex: 1,
    minHeight: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: C.berry,
    shadowColor: C.berry,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryPressed: { backgroundColor: C.berryDark },
  primaryText: {
    fontFamily: 'Urbanist',
    fontSize: 20,
    color: C.white,
  },
  secondary: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: 'rgba(192, 38, 163, 0.25)',
  },
  secondaryPressed: { backgroundColor: C.creamSoft, borderColor: C.berry },
  secondaryText: {
    fontFamily: 'Urbanist',
    fontSize: 20,
    color: C.berryDark,
  },
});

export const DOT_COLORS = {
  active: C.berry,
  inactive: 'rgba(58, 21, 38, 0.25)',
} as const;

export const BACKGROUND_GRADIENT = [C.creamSoft, C.cream, C.cream] as const;
