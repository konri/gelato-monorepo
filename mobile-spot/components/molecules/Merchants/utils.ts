export const getPromotionBadge = (promotions: any): string | null => {
  if (!promotions?.hasPromotions) return null;

  const firstVoucher = promotions.vouchers?.[0];
  const firstStampCard = promotions.stampCards?.[0];

  if (firstVoucher?.pointsCost) {
    return `${firstVoucher.pointsCost} pkt`;
  }
  if (firstStampCard?.stampsRequired) {
    return `${firstStampCard.stampsRequired} pieczatek`;
  }
  return null;
};
