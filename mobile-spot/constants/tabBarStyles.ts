const TAB_BAR_BOTTOM = 26;

export const TAB_BAR_STYLE = {
  position: 'absolute' as const,
  bottom: TAB_BAR_BOTTOM,
  left: 10,
  right: 10,
  backgroundColor: 'rgba(255, 255, 255, 0.86)',
  borderRadius: 24,
  height: 70,
  paddingTop: 2,
  paddingBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.45,
  shadowRadius: 3.84,
  elevation: 5,
  overflow: 'hidden' as const,
}

export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_STYLE.height + TAB_BAR_BOTTOM

export const SECTION_HORIZONTAL_PADDING = 16;
