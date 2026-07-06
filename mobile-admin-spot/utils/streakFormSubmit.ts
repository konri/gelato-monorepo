import type {
  CreateStreakProgramVariables,
  UpdateStreakProgramVariables,
  UpsertStreakProgramStoreOverrideVariables,
} from "@/shared/api-client/src/graphql/mutations/streak";
import type { StreakProgramFormData, TranslationFn } from "@/app/company/streaks/types";
import {
  buildCreateStreakInput,
  buildUpdateStreakInput,
  buildStreakOverrideInput,
  buildStagesPayload,
} from "@/utils/companyStreaksProgramForm";

type StreakFormMutationRunners = {
  createStreakProgram: (options: { variables: CreateStreakProgramVariables }) => Promise<unknown>;
  updateStreakProgram: (options: { variables: UpdateStreakProgramVariables }) => Promise<unknown>;
  upsertStreakProgramStoreOverride: (options: {
    variables: UpsertStreakProgramStoreOverrideVariables;
  }) => Promise<unknown>;
};

export type ExecuteStreakFormMutationsParams = {
  formValues: StreakProgramFormData;
  streakProgramId?: string;
  merchantId: string;
  overrideStoreId?: string;
  selectedStoreId?: string;
  isStoreOverrideEdit: boolean;
  isEditMode: boolean;
  programRequiredConsecutiveDays?: number | null;
  shouldUpdateStages: boolean;
  t: TranslationFn;
} & StreakFormMutationRunners;

export async function executeStreakFormMutations(
  params: ExecuteStreakFormMutationsParams,
): Promise<void> {
  const {
    formValues,
    streakProgramId,
    merchantId,
    overrideStoreId,
    selectedStoreId,
    isStoreOverrideEdit,
    isEditMode,
    programRequiredConsecutiveDays,
    shouldUpdateStages,
    t,
    createStreakProgram,
    updateStreakProgram,
    upsertStreakProgramStoreOverride,
  } = params;

  if (isStoreOverrideEdit && streakProgramId && overrideStoreId) {
    await upsertStreakProgramStoreOverride({
      variables: {
        streakProgramId,
        storeId: overrideStoreId,
        data: buildStreakOverrideInput(formValues, programRequiredConsecutiveDays),
      },
    });
    return;
  }

  const stages = buildStagesPayload(formValues.stages, formValues.name, t);

  if (isEditMode && streakProgramId) {
    await updateStreakProgram({
      variables: {
        streakProgramId,
        data: buildUpdateStreakInput(formValues, stages, shouldUpdateStages),
      },
    });
    return;
  }

  await createStreakProgram({
    variables: {
      data: buildCreateStreakInput(merchantId, formValues, stages),
      ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
    },
  });
}
