export type StampCardProps = {
  title: string;
  progress: string;
  description: string;
  rateText: string;
  totalStamps: number;
  filledStamps: number;
  milestoneStampsRequired?: number;
  milestoneTitle?: string;
  stampStyleUrl?: string;
  showHeader?: boolean;
  showFooter?: boolean;
};
