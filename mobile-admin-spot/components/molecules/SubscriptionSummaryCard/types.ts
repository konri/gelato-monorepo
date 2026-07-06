export type SubscriptionSummaryCardProps = {
  planName: string;
  isActive: boolean;
  renewalDate: string;
  paymentMethodLast4: string;
  lastInvoiceName: string;
  onChangePlan: () => void;
  onCancelSubscription: () => void;
  onDownloadInvoice: () => void;
};
