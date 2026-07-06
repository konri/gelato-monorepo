import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const STATS_CONTENT_H_INSET = 48;
const STATS_PAIR_BAR_H_INSET = 64;
const TREND_CHART_MAX_WIDTH = 400;
const TREND_CHART_MIN_WIDTH = 240;
const TREND_CHART_HEIGHT = 128;
const PAIR_BAR_MIN_WIDTH = 220;

export const useMerchantStatsChartLayout = () => {
  const { width: windowWidth } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = windowWidth - STATS_CONTENT_H_INSET;
    const trendChartWidth = Math.max(
      TREND_CHART_MIN_WIDTH,
      Math.min(contentWidth, TREND_CHART_MAX_WIDTH),
    );
    const pairBarChartWidth = Math.max(PAIR_BAR_MIN_WIDTH, windowWidth - STATS_PAIR_BAR_H_INSET);

    return {
      windowWidth,
      contentWidth,
      trendChartWidth,
      trendChartHeight: TREND_CHART_HEIGHT,
      pairBarChartWidth,
      donutClients: Math.min(112, Math.max(96, windowWidth * 0.26)),
      donutPointsRewards: Math.min(120, Math.max(100, windowWidth * 0.28)),
    };
  }, [windowWidth]);
};
