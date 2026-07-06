import type { StampCardProps } from "@/components/molecules/StampCard/types";

type BaseProps = {
  title?: string;
  progressLabel?: string;
  stampCardProps?: StampCardProps;
  onAddStamp: (count: number) => Promise<boolean>;
  assignStampsLabel: string;
  isAddingStamp?: boolean;
  readOnly?: boolean;
};

export type VisitModeProps = BaseProps & {
  stampAwardMode?: "visit";
  stampCount: number;
  onStampCountChange: (count: number) => void;
  addStampLabel: string;
};

export type AmountModeProps = BaseProps & {
  stampAwardMode: "amount";
  amountPerStamp: number;
  spentAmountPlaceholder?: string;
  onSpentAmountFocus?: () => void;
  onSpentAmountBlur?: () => void;
};

export type ClientStampCardSectionProps = VisitModeProps | AmountModeProps;

export const STAMP_COUNT_MIN = 1;
export const STAMP_COUNT_MAX = 3;
