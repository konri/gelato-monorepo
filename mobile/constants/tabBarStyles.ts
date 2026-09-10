import { colors } from './colors'

export const TAB_BAR_HEIGHT = 70

export const getTabBarStyle = (bottomInset: number) => ({
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.tabBar.background,
  height: TAB_BAR_HEIGHT + bottomInset,
  paddingTop: 2,
  paddingBottom: bottomInset,
  borderTopWidth: 0,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
})

/** Overlay clearance: tab content + typical home-indicator inset. */
export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_HEIGHT + 34

export const SECTION_HORIZONTAL_PADDING = 16
