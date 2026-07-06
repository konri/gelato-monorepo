import type { ClientPointsSectionModel } from "@/hooks/useClientPointsSectionModel";

export type ClientPointsSectionProps = {
  model: ClientPointsSectionModel;
  onSpentAmountFocus?: () => void;
  onSpentAmountBlur?: () => void;
  onAssignPoints: (spentAmount: string) => Promise<boolean>;
};
