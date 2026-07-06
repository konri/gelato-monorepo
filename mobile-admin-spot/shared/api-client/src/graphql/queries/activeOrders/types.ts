export type VendorOrderGraphql = {
  id: string;
  orderNumber: number;
  status: string;
  merchantStoreId: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  pickedUpSource: string | null;
  pickedUpAt: string | null;
  userId: string | null;
  sessionToken: string | null;
  note: string | null;
};

export type ActiveOrdersQueryResponse = {
  activeOrders: VendorOrderGraphql[];
};

export type ActiveOrdersQueryVariables = {
  merchantStoreId: string;
};
