export type StatsMetricPairBarItem = {
  label: string;
  current: number;
  previous: number;
};

export type StatsMetricPairBarChartProps = {
  width: number;
  items: StatsMetricPairBarItem[];
  columnALabel: string;
  columnBLabel: string;
  barAColor?: string;
  barBColor?: string;
  formatValue: (n: number) => string;
  labelColumnWidth?: number;
};
