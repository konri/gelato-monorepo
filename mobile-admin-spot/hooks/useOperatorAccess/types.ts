import type {
  MerchantOperatorEditCapabilities,
  OperatorPermission,
} from "@/shared/api-client/src/graphql/types/operatorAccess";
import type { MerchantStoreOrderQueueConfig } from "@/shared/api-client/src/graphql/queries/merchantStoreOrderQueue/types";

export type OperatorCapabilityFlags = MerchantOperatorEditCapabilities;

export type OperatorMerchant = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type OperatorAccessStore = {
  id: string;
  name: string;
  merchantId: string;
  photoUrl?: string;
  orderQueueSettings: MerchantStoreOrderQueueConfig | null;
};

export type OperatorAccessContextValue = {
  merchants: OperatorMerchant[];
  stores: OperatorAccessStore[];
  selectedMerchantId: string | null;
  selectedStoreId: string | null;
  selectedScanStoreId: string | null;
  availableStores: OperatorAccessStore[];
  canSelectStore: boolean;
  canSelectMerchant: boolean;
  isStoreScoped: boolean;
  permissions: OperatorPermission[];
  hasAnyMerchantAccess: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  setMerchantContext: (merchantId: string) => Promise<void>;
  setStoreContext: (storeId: string | null) => Promise<void>;
  setScanStoreContext: (storeId: string | null) => Promise<void>;
  hasPermission: (permission: OperatorPermission) => boolean;
} & OperatorCapabilityFlags;
