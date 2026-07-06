import type { ReactNode } from "react";

export type LoyaltyEntityFormHeaderBlockProps = {
  title: string;
  contextSwitcherTitle?: string;
  headerActions?: ReactNode;
  banner?: ReactNode;
  containerClassName?: string;
};
