import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { CREATE_ORDER_MUTATION, CREATE_PAYMENT_INTENT_MUTATION } from './mutation';

export type OrderItemInput = {
  tasteId?: string;
  productId?: string;
  quantity: number;
};

export type CreateOrderInput = {
  spotId: string;
  items: OrderItemInput[];
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  buildingType?: string;
  apartmentNumber?: string;
  floor?: string;
  deliveryNotes?: string;
  spotNotes?: string;
  paymentMethod: string;
  scheduledFor?: string; // ISO
  promoCode?: string;
  invoiceRequested?: boolean;
  invoiceNIP?: string;
  invoiceCompanyName?: string;
  invoiceAddress?: string;
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
};

export const createOrder = async (
  input: CreateOrderInput,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<CreatedOrder>> => {
  const res = await executeGraphQLQuery<{ createOrder: CreatedOrder }>(CREATE_ORDER_MUTATION, {
    ...options,
    variables: { input },
  });
  return { ...res, data: res.data ? res.data.createOrder : null };
};

export const createPaymentIntent = async (
  orderId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<string>> => {
  const res = await executeGraphQLQuery<{ createPaymentIntent: string }>(
    CREATE_PAYMENT_INTENT_MUTATION,
    { ...options, variables: { orderId } },
  );
  return { ...res, data: res.data ? res.data.createPaymentIntent : null };
};
