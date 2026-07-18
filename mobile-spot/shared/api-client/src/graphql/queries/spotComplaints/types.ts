export type SpotComplaint = {
  id: string;
  orderId: string;
  orderNumber?: string | null;
  customerName?: string | null;
  subject: string;
  message: string;
  status: string;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
};

export type SpotComplaintsResponse = { spotComplaints: SpotComplaint[] };
