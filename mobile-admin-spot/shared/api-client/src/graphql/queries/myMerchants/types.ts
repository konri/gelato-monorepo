import type { MerchantBasic } from "../../types/merchant";

export type MyMerchant = MerchantBasic;

export type MyMerchantsResponse = {
  myMerchants: MyMerchant[];
};

