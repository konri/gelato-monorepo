import { MerchantStoreBasic } from "@/shared/api-client/src/graphql/mutations/merchantStore";

export type StoreCardProps = {
  store: MerchantStoreBasic;
  onPress: () => void;
};
