import type { TFunction } from "i18next";

export const merchantStatsCouponTypeLabel = (t: TFunction, couponTypeKey: string): string => {
  const i18nKey = `Coupon.type${couponTypeKey}`;
  const translated = t(i18nKey);
  return translated === i18nKey ? couponTypeKey : translated;
};
