import type { ReactNode } from "react";

export type SettingsNavSectionItem = {
  title: string;
  onPress: () => void;
  leftIcon?: ReactNode;
  trailingLabel?: string;
  variant?: "default" | "danger";
};

export type SettingsNavSectionProps = {
  title: string;
  items: SettingsNavSectionItem[];
  headingClassName?: string;
  hideHeading?: boolean;
  wrapInCard?: boolean;
  cardFooter?: ReactNode;
};
