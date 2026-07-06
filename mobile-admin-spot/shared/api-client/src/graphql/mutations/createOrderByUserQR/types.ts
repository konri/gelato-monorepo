export type CreateOrderByUserQRInput = {
  userId?: string | null;
  merchantStoreId: string;
  note?: string | null;
};

export type CreateOrderByUserQRResponse = {
  createOrderByUserQR: {
    orderId: string;
    orderNumber: number;
    note: string | null;
  };
};

export type CreateOrderByUserQRVariables = {
  input: CreateOrderByUserQRInput;
};
