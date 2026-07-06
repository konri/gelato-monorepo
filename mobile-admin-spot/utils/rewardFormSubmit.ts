import type {
  CreateRewardInput,
  CreateRewardVariables,
  UpsertRewardStoreOverrideInput,
} from "@/shared/api-client/src/graphql/mutations/reward";
import {
  buildRewardInput,
  buildRewardStoreOverrideInput,
  type RewardFormData,
} from "@/utils/rewardForm";

type RewardFormMutationRunners = {
  createReward: (options: { variables: CreateRewardVariables }) => Promise<unknown>;
  updateReward: (options: { variables: { id: string; data: CreateRewardInput } }) => Promise<unknown>;
  upsertRewardStoreOverride: (options: {
    variables: { rewardId: string; storeId: string; data: UpsertRewardStoreOverrideInput };
  }) => Promise<unknown>;
};

export type ExecuteRewardFormMutationsParams = {
  formValues: RewardFormData;
  merchantId: string;
  rewardId?: string;
  overrideStoreId?: string;
  isStoreOverrideEdit: boolean;
  isEditMode: boolean;
  scopeCreateStoreId?: string;
} & RewardFormMutationRunners;

export async function executeRewardFormMutations(
  params: ExecuteRewardFormMutationsParams,
): Promise<void> {
  const {
    formValues,
    merchantId,
    rewardId,
    overrideStoreId,
    isStoreOverrideEdit,
    isEditMode,
    scopeCreateStoreId,
    createReward,
    updateReward,
    upsertRewardStoreOverride,
  } = params;

  if (isStoreOverrideEdit && rewardId && overrideStoreId) {
    await upsertRewardStoreOverride({
      variables: {
        rewardId,
        storeId: overrideStoreId,
        data: buildRewardStoreOverrideInput(formValues),
      },
    });
    return;
  }

  const input = buildRewardInput(merchantId, formValues);

  if (isEditMode && rewardId) {
    await updateReward({ variables: { id: rewardId, data: input } });
    return;
  }

  await createReward({
    variables: {
      data: input,
      ...(scopeCreateStoreId !== undefined ? { storeId: scopeCreateStoreId } : {}),
    },
  });
}
