export type StatsDonutSegment = {
  value: number;
  color: string;
};

export type StatsDonutChartProps = {
  size: number;
  thickness: number;
  segments: StatsDonutSegment[];
  gapDegrees?: number;
};
