import type { MerchantOperatorScope } from "@/shared/api-client/src/graphql/types/operatorAccess";

export type GrantedOperatorMerchantScopeCardProps = {
  merchantName: string;
  scope: MerchantOperatorScope;
  storeNames: string[];
};
