/**
 * App-wide colours: the landing / onboarding palette (components/onboarding/
 * palette.ts) plus the warm neutrals and semantic colours derived from it.
 * tailwind.config.js mirrors these values as tokens (accent, text.*,
 * background.*, border.*, gray-*), so prefer a className where one exists and
 * use these constants for props that need a raw colour (icon `color`,
 * ActivityIndicator, RefreshControl, Switch, SVG fills, gradients).
 *
 * Contrast (WCAG): espresso on cream ≈ 15:1, espressoLight on cream ≈ 10.8:1,
 * textTertiary on cream ≈ 5.1:1, white on berry ≈ 5.2:1, berry on white ≈ 5.2:1.
 * Users are mostly older people, so text that carries information stays ≥ 4.5:1.
 */
import { PALETTE } from '@/components/onboarding/palette';

export { LOGO, PALETTE } from '@/components/onboarding/palette';

export const THEME = {
  /** Brand accent: primary buttons, active tab, links, selected chips, prices. */
  primary: PALETTE.berry,
  /** Pressed / emphasis variant; also the text colour on pale-berry fills (≈ 7:1). */
  primaryDark: PALETTE.berryDark,
  /** Pale berry fill (old red-pale). Put berryDark text on it, not berry (4.3:1). */
  primaryPale: '#fbe3f4',
  /** Muted berry (old red-muted), decorative only (3.3:1 on white). */
  primaryMuted: '#c76fb5',
  /** Disabled primary button fill (old pale red). */
  primaryDisabled: '#e4a4d8',
  /** Selected card / row fill, with a berry border (old red-50 #FEF2F2). */
  selectedFill: '#fcf2f9',
  /** Primary text. */
  text: PALETTE.espresso,
  /** Secondary text. */
  textSecondary: PALETTE.espressoLight,
  /** Tertiary / meta text that still carries information (5.4:1 on white, 5.1:1 on cream). */
  textTertiary: '#7a6470',
  /** Input placeholders and decorative glyphs (3.4:1 on white; old #9E9E9E was 2.7:1). */
  placeholder: '#9a8590',
  /** Screen background. */
  background: PALETTE.cream,
  /** Secondary panels on a cream screen. */
  backgroundSoft: PALETTE.creamSoft,
  /** Cards, sheets, inputs. */
  surface: PALETTE.white,
  /** Hairlines and card borders. */
  border: '#f1e4dc',
  /** Input / divider borders that need to be visible on white. */
  borderStrong: '#ead8cc',
  /** Neutral chip / skeleton fill on white (Tailwind gray-100 here). */
  neutralFill: '#f8f0ea',
  /** Paused / secondary rows on white (Tailwind gray-50 here, = cream). */
  subtleFill: PALETTE.cream,
  /** Inactive dots, empty stars, disabled icons, slider tracks (gray-300). */
  inactive: '#dcc8bc',
  /** Semantic: errors, destructive actions, validation (4.8:1 on white). */
  error: '#dc2626',
} as const;

/** `rgba()` of the brand berry, for tints and translucent borders. */
export const berryAlpha = (alpha: number) => `rgba(192, 38, 163, ${alpha})`;
