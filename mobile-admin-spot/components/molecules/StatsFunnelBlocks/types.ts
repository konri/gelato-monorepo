export type StatsFunnelConnectorProps = {
  caption: string;
};

export type StatsConversionFunnelStepProps = {
  label: string;
  valueNumeric: string;
  shareLabel: string;
  fillRatio: number;
  variant?: "default" | "emphasis";
  fillClassName?: string;
  trailingBadge?: string | null;
  trailingBadgeTone?: "ok" | "mid" | "bad";
};
