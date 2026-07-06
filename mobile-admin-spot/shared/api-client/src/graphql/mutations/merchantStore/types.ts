import type { MerchantStoreOrderQueueConfig } from "../../queries/merchantStoreOrderQueue/types";

export type MerchantStoreInput = {
  name: string;
  address: string;
  city: string;
  phone?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
};

export type CreateMerchantStoreInput = MerchantStoreInput;

export type UpdateMerchantStoreInput = Partial<MerchantStoreInput> & {
  isActive?: boolean;
};

export type MerchantStoreBasic = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  images?: Array<{
    url: string;
    type?: string;
    alt?: string;
  }>;
  isActive: boolean;
  merchantId: string;
  orderQueueSettings: MerchantStoreOrderQueueConfig | null;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

