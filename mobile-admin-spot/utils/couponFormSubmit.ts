import type {
  CreateCouponVariables,
  UpdateCouponVariables,
  UpsertCouponStoreOverrideVariables,
} from "@/shared/api-client/src/graphql/mutations/coupon";
import {
  buildCouponInput,
  buildCouponStoreOverrideInput,
  buildUpdateCouponInput,
  type CouponFormData,
} from "@/utils/couponForm";

type CouponFormMutationRunners = {
  createCoupon: (options: { variables: CreateCouponVariables }) => Promise<unknown>;
  updateCoupon: (options: { variables: UpdateCouponVariables }) => Promise<unknown>;
  upsertCouponStoreOverride: (options: {
    variables: UpsertCouponStoreOverrideVariables;
  }) => Promise<unknown>;
};

export type ExecuteCouponFormMutationsParams = {
  formValues: CouponFormData;
  couponId?: string;
  overrideStoreId?: string;
  isStoreOverrideEdit: boolean;
  isEditMode: boolean;
  scopeCreateStoreId?: string;
} & CouponFormMutationRunners;

export async function executeCouponFormMutations(
  params: ExecuteCouponFormMutationsParams,
): Promise<void> {
  const {
    formValues,
    couponId,
    overrideStoreId,
    isStoreOverrideEdit,
    isEditMode,
    scopeCreateStoreId,
    upsertCouponStoreOverride,
    updateCoupon,
    createCoupon,
  } = params;

  if (isStoreOverrideEdit && couponId && overrideStoreId) {
    await upsertCouponStoreOverride({
      variables: {
        couponId,
        storeId: overrideStoreId,
        data: buildCouponStoreOverrideInput(formValues),
      },
    });
    return;
  }

  if (isEditMode && couponId) {
    await updateCoupon({
      variables: { data: buildUpdateCouponInput(formValues), couponId },
    });
    return;
  }

  await createCoupon({
    variables: {
      data: buildCouponInput(formValues),
      ...(scopeCreateStoreId !== undefined ? { storeId: scopeCreateStoreId } : {}),
    },
  });
}
