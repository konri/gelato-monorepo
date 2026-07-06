export const TAB_BAR_STYLE = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  height: 70,
  position: 'absolute' as const,
  bottom: 26,
  marginLeft: 10,
  marginRight: 10,
  shadowColor: "gray",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 0.1,
  paddingTop: 2,
}

export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_STYLE.height + TAB_BAR_STYLE.bottom;
