import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

// Width thresholds (dp). Below tablet = phone (bottom tabs); at/above tablet =
// wide layout (sidebar nav + centered content).
const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

export type BreakpointInfo = {
  width: number;
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** tablet or desktop — i.e. use the sidebar/wide layout. */
  isWide: boolean;
};

/**
 * Responsive breakpoint for the spot app. One codebase serves phone, tablet,
 * and web; screens branch on `isWide` to switch between the phone layout
 * (bottom tabs, full-bleed) and the wide layout (sidebar, centered content).
 */
export function useBreakpoint(): BreakpointInfo {
  const { width } = useWindowDimensions();
  const breakpoint: Breakpoint =
    width >= DESKTOP_MIN ? 'desktop' : width >= TABLET_MIN ? 'tablet' : 'phone';
  return {
    width,
    breakpoint,
    isPhone: breakpoint === 'phone',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isWide: breakpoint !== 'phone',
  };
}
