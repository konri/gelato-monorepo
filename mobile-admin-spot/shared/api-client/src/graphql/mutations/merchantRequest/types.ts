import type { MerchantBasic, MerchantInput } from "../../types/merchant";

export type CreateMerchantInput = MerchantInput;

export type CreateMerchantResponse = {
  createMerchant: MerchantBasic;
};
