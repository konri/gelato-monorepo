import { Typography } from "@/components/atoms/Typography";
import { MerchantPhotosSection } from "@/components/molecules/MerchantPhotosSection";
import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import React from "react";
import { View } from "react-native";

import type { MerchantProfileHeaderProps } from "./types";

export const MerchantProfileHeader = ({
  className,
  merchantName,
  merchantDescription,
  logoUri,
  coverUri,
}: MerchantProfileHeaderProps) => {
  const { data } = useGetMyMerchants();
  const { data: storesData } = useGetMerchantStores();
  const { selectedMerchantId, selectedStoreId } = useOperatorAccess();
  const merchant =
    data?.myMerchants?.find((item) => item.id === selectedMerchantId) ??
    data?.myMerchants?.[0];
  const stores = storesData?.myStores ?? [];
  const fallbackStore =
    stores.find((store) => store.id === selectedStoreId) ??
    stores.find((store) => store.merchantId === selectedMerchantId) ??
    stores[0];
  const merchantCover = merchant?.coverUrl;
  const storePhoto = fallbackStore?.photoUrl;
  const resolvedCover =
    selectedStoreId != null
      ? (storePhoto ?? merchantCover)
      : (merchantCover ?? storePhoto);
  const headerCoverUri = coverUri ?? resolvedCover;
  const headerLogoUri = logoUri ?? merchant?.logoUrl ?? fallbackStore?.photoUrl;
  const headerName = merchantName ?? merchant?.name ?? fallbackStore?.name ?? "";
  const headerDescription = merchantDescription ?? merchant?.description ?? "";

  return (
    <View className={className}>
      <MerchantPhotosSection
        editing
        readOnly
        merchantName={headerName}
        coverUri={headerCoverUri || null}
        logoUri={headerLogoUri || null}
      />
      <View className="items-center px-4 gap-1 pt-3">
        <Typography variant="text-16-bold" className="text-black text-center">
          {headerName}
        </Typography>
        <Typography variant="text-12-regular" className="text-black text-center">
          {headerDescription}
        </Typography>
      </View>
    </View>
  );
};
