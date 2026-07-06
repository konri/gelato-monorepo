export type StatsToggleChipsProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  labels: Record<T, string>;
  layout?: "wrap" | "row";
};
