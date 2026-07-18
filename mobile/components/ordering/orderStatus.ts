import type { FulfillmentType, OrderStatus } from '@repo/api-client';

// Text + background colors per status (Tailwind class fragments).
export const STATUS_STYLE: Record<OrderStatus, { text: string; bg: string; dot: string }> = {
  PENDING: { text: 'text-amber-700', bg: 'bg-amber-50', dot: '#B45309' },
  PREPARING: { text: 'text-amber-700', bg: 'bg-amber-50', dot: '#B45309' },
  READY: { text: 'text-blue-700', bg: 'bg-blue-50', dot: '#1D4ED8' },
  COURIER_ASSIGNED: { text: 'text-blue-700', bg: 'bg-blue-50', dot: '#1D4ED8' },
  PICKED_UP: { text: 'text-blue-700', bg: 'bg-blue-50', dot: '#1D4ED8' },
  IN_TRANSIT: { text: 'text-blue-700', bg: 'bg-blue-50', dot: '#1D4ED8' },
  DELIVERED: { text: 'text-green-700', bg: 'bg-green-50', dot: '#16A34A' },
  COLLECTED: { text: 'text-green-700', bg: 'bg-green-50', dot: '#16A34A' },
  CANCELLED: { text: 'text-gray-600', bg: 'bg-gray-100', dot: '#6B7280' },
  FAILED: { text: 'text-red-700', bg: 'bg-red-50', dot: '#DC2626' },
};

// Ordered steps for the tracking progress bar (happy path), per fulfillment type.
const DELIVERY_STEPS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'];
const PICKUP_STEPS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COLLECTED'];

// Default export kept for existing delivery callers.
export const TRACKING_STEPS = DELIVERY_STEPS;

export const trackingSteps = (fulfillmentType?: FulfillmentType): OrderStatus[] =>
  fulfillmentType === 'PICKUP' ? PICKUP_STEPS : DELIVERY_STEPS;

export const isTerminal = (s: OrderStatus) =>
  s === 'DELIVERED' || s === 'COLLECTED' || s === 'CANCELLED' || s === 'FAILED';
