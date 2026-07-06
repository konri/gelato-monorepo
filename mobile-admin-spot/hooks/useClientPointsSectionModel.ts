import { useAddMerchantPoints } from "@/hooks/graphql/mutations/useAddMerchantPoints";
import { useGetMerchantPointsProgram } from "@/hooks/graphql/queries/useGetMerchantPointsProgram";
import { useGetMerchantUserPointBalance } from "@/hooks/graphql/queries/useGetMerchantUserPointBalance";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import { GET_AVAILABLE_REWARDS_QUERY, GET_USER_CLAIMED_REWARDS_QUERY, GET_USER_STAMP_CARDS_QUERY } from "@/shared/api-client/src/graphql/queries/rewards";
import { MERCHANT_USER_POINT_BALANCE_QUERY } from "@/shared/api-client/src/graphql/queries/merchantPointsProgram";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

type UseClientPointsSectionModelProps = {
  userId: string;
};

const roundPoints = (value: number): number => Math.round(value * 100) / 100;

export type ClientPointsSectionModel = {
  currentPoints: number;
  spentAmountPlaceholder?: string;
  amountSpent: number;
  pointsAwarded: number;
  multiply: number;
  fixedPoints: number;
  isAssigning: boolean;
  canAssignBase: boolean;
};

export const useClientPointsSectionModel = ({ userId }: UseClientPointsSectionModelProps) => {
  const { t } = useTranslation();
  const { selectedMerchantId, selectedScanStoreId, merchants, stores } = useOperatorAccess();
  const storeId = effectiveScanStoreId(selectedScanStoreId, stores) ?? "";
  const scanStore = storeId ? stores.find((s) => s.id === storeId) : undefined;
  const merchantRecord =
    (scanStore ? merchants.find((m) => m.id === scanStore.merchantId) : undefined) ??
    merchants.find((m) => m.id === selectedMerchantId) ??
    merchants[0];
  const merchantId = merchantRecord?.id ?? "";
  const hasTargetUser = userId.trim().length > 0;
  const [addMerchantPoints, { loading: addingPoints }] = useAddMerchantPoints();
  const pointsProgramQuery = useGetMerchantPointsProgram({
    merchantId,
    skip: !merchantId,
  });
  const pointsProgram =
    pointsProgramQuery.dataState === "complete"
      ? pointsProgramQuery.data?.getMerchantPointsProgram
      : undefined;
  const hasActivePointsProgram = Boolean(pointsProgram?.id && pointsProgram.isActive);
  const { data: pointBalanceData, loading: pointsBalanceLoading, error: pointsBalanceError } =
    useGetMerchantUserPointBalance({
      userId,
      merchantId,
      skip: !hasActivePointsProgram || !merchantId || !hasTargetUser,
    });
  const currentPoints = pointBalanceData?.merchantUserPointBalance?.totalPoints ?? 0;
  const multiply = pointBalanceData?.merchantUserPointBalance?.bonusMultiplier ?? 1;
  const fixedPoints = pointBalanceData?.merchantUserPointBalance?.fixedPoints ?? 0;
  const canAssignBase = hasActivePointsProgram && Boolean(pointsProgram?.id) && !addingPoints;

  const handleAddPoints = useCallback(async (spentAmount: string) => {
    if (!hasTargetUser) {
      return false;
    }
    const parsedSpentAmountValue = Number(spentAmount);
    const spentAmountValue = Number.isFinite(parsedSpentAmountValue) ? parsedSpentAmountValue : 0;
    if (!pointsProgram?.id || !canAssignBase || spentAmountValue <= 0 || pointsProgram.amountSpent <= 0) {
      return false;
    }
    const standardPointsRaw = (spentAmountValue / pointsProgram.amountSpent) * pointsProgram.pointsAwarded;
    const standardPoints = roundPoints(standardPointsRaw);
    await addMerchantPoints({
      variables: {
        description: t("Rewards.addPointsMutationDescription", {
          amount: spentAmountValue.toLocaleString(),
        }),
        amount: standardPoints,
        programId: pointsProgram.id,
        userId,
        storeId,
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: MERCHANT_USER_POINT_BALANCE_QUERY,
          variables: { userId, merchantId },
        },
        { query: GET_AVAILABLE_REWARDS_QUERY, variables: { userId } },
        { query: GET_USER_STAMP_CARDS_QUERY, variables: { userId } },
        { query: GET_USER_CLAIMED_REWARDS_QUERY, variables: { userId } },
      ],
    });
    return true;
  }, [addMerchantPoints, canAssignBase, hasTargetUser, merchantId, pointsProgram, storeId, t, userId]);

  return {
    isVisible: hasTargetUser && hasActivePointsProgram && !pointsBalanceError && !pointsBalanceLoading,
    handleAddPoints,
    model: {
      currentPoints,
      spentAmountPlaceholder:
        pointsProgram && pointsProgram.amountSpent > 0 ? pointsProgram.amountSpent.toString() : undefined,
      amountSpent: pointsProgram?.amountSpent ?? 0,
      pointsAwarded: pointsProgram?.pointsAwarded ?? 0,
      multiply,
      fixedPoints,
      isAssigning: addingPoints,
      canAssignBase,
    } satisfies ClientPointsSectionModel,
  };
};
