import type { VendorOrderGraphql } from "../../queries/activeOrders/types";

export type IdInputMutationVariables = {
  input: {
    orderId: string;
  };
};

export type MarkOrderReadyMutationVariables = IdInputMutationVariables;

export type MarkOrderReadyMutationResponse = {
  markOrderReady: VendorOrderGraphql;
};

export type MarkOrderPickedUpMutationResponse = {
  markOrderPickedUp: VendorOrderGraphql;
};

export type CancelOrderVendorMutationResponse = {
  cancelOrder: VendorOrderGraphql;
};

export type MarkOrderDelayedMutationResponse = {
  markOrderDelayed: VendorOrderGraphql;
};

export type MarkOrderResumePreparingMutationResponse = {
  markOrderResumePreparing: VendorOrderGraphql;
};

export type RevertOrderPickUpMutationResponse = {
  revertOrderPickUp: VendorOrderGraphql;
};

export type RevertOrderReadyMutationResponse = {
  revertOrderReady: VendorOrderGraphql;
};
