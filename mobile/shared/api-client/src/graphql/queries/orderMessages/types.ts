export type OrderMessageSenderRole = 'spot' | 'courier' | 'client';

export type OrderMessage = {
  id: string;
  orderId: string;
  userId: string;
  asSpotId?: string | null;
  asCourierId?: string | null;
  body: string;
  senderName?: string | null;
  senderAvatar?: string | null;
  senderRole: OrderMessageSenderRole;
  createdAt: string;
};

export type OrderMessagesResponse = { orderMessages: OrderMessage[] };
export type PostOrderMessageResponse = { postOrderMessage: OrderMessage };
