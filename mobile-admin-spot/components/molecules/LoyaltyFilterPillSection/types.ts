export type LoyaltyFilterPillSectionProps<T extends string = string> = {
  title: string;
  hint: string;
  options: readonly { id: T; label: string }[];
  selectedIds: readonly T[];
  onToggle: (id: T) => void;
};
