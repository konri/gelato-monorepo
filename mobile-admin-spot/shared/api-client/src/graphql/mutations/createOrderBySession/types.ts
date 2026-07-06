export type CreateOrderBySessionInput = {
  sessionToken: string;
  merchantStoreId: string;
  note?: string | null;
};

export type CreateOrderBySessionResponse = {
  createOrderBySession: {
    orderId: string;
    orderNumber: number;
    note: string | null;
  };
};

export type CreateOrderBySessionVariables = {
  input: CreateOrderBySessionInput;
};
