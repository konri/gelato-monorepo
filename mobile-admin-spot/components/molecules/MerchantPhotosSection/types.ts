export type MerchantPhotosSectionLayout = "merchant" | "store";

export type MerchantPhotosSectionProps = {
  coverUri: string | null;
  logoUri: string | null;
  onCoverChange?: (uri: string) => void;
  onLogoChange?: (uri: string) => void;
  onCoverRemove?: () => void;
  onLogoRemove?: () => void;
  editing?: boolean;
  layout?: MerchantPhotosSectionLayout;
  merchantName?: string;
  readOnly?: boolean;
};
