import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'gelato_cart_v1';

export type CartItemKind = 'taste' | 'product';

// A chosen taste inside a box, with how many scoops of it.
export type BoxSelection = { tasteId: string; title: string; quantity: number };

export type CartItem = {
  // Stable key: non-box items use `${kind}:${refId}`; box items use a unique
  // `lineId` so two boxes with different taste selections stay separate.
  kind: CartItemKind;
  refId: string;
  lineId?: string;
  spotId: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  // Box products only: chosen tastes + total box weight (for display).
  boxSelections?: BoxSelection[];
  weightGrams?: number | null;
};

// Validated delivery address carried into checkout (set in Phase 2).
export type DeliveryDraft = {
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
};

// Applied promo/influencer code (validated against the current subtotal).
export type PromoDraft = {
  code: string;
  discountAmount: number;
  isInfluencer: boolean;
};

// Order-form details collected in Phase 3, consumed by checkout in Phase 4.
export type OrderFormDraft = {
  buildingType: 'house' | 'apartment';
  apartmentNumber: string;
  floor: string;
  scheduledForIso: string | null; // null = ASAP
  scheduledLabel: string | null;
  noteForCourier: string;
  noteForSpot: string;
  invoiceRequested: boolean;
  invoiceNIP: string;
  invoiceCompanyName: string;
  invoiceAddress: string;
  promo: PromoDraft | null;
};

// How the customer will receive this order.
export type FulfillmentType = 'delivery' | 'pickup';

// How the customer will pay: online now (Stripe) or in cash at the spot.
// Pay-at-spot is only offered for pickup orders.
export type PaymentChoice = 'online' | 'cash';

type CartState = {
  spotId: string | null;
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  delivery: DeliveryDraft | null;
  form: OrderFormDraft | null;
};

type CartContextValue = {
  spotId: string | null;
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  delivery: DeliveryDraft | null;
  form: OrderFormDraft | null;
  count: number;
  subtotal: number;
  hydrated: boolean;
  // Stable key for a cart line (box items keep their own line).
  lineKey: (item: CartItem) => string;
  itemQuantity: (kind: CartItemKind, refId: string) => number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  // Add a configured box as its own line (never merged with other boxes).
  addBox: (item: Omit<CartItem, 'quantity' | 'lineId'>, quantity?: number) => void;
  setQuantity: (kind: CartItemKind, refId: string, quantity: number) => void;
  // Adjust/remove any line by its lineKey (works for box + non-box).
  setLineQuantity: (key: string, quantity: number) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setDelivery: (delivery: DeliveryDraft | null) => void;
  setForm: (form: OrderFormDraft | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const keyOf = (kind: CartItemKind, refId: string) => `${kind}:${refId}`;
// Box lines are identified by their unique lineId; everything else by kind:refId.
const lineKeyOf = (item: CartItem) => item.lineId ?? keyOf(item.kind, item.refId);
let boxLineCounter = 0;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<CartState>({
    spotId: null,
    items: [],
    fulfillmentType: 'delivery',
    delivery: null,
    form: null,
  });
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (raw) setState(JSON.parse(raw));
      } catch {
        /* ignore corrupt cart */
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const itemQuantity = (kind: CartItemKind, refId: string) =>
      state.items.find((i) => keyOf(i.kind, i.refId) === keyOf(kind, refId))?.quantity ?? 0;

    // The cart is scoped to a single spot; adding from a different spot replaces
    // it (and drops any address validated against the previous spot).
    const addItem: CartContextValue['addItem'] = (item, quantity = 1) => {
      setState((prev) => {
        const differentSpot = prev.spotId && prev.spotId !== item.spotId;
        const base: CartState = differentSpot
          ? { spotId: item.spotId, items: [], fulfillmentType: prev.fulfillmentType, delivery: null, form: null }
          : { spotId: item.spotId, items: [...prev.items], fulfillmentType: prev.fulfillmentType, delivery: prev.delivery, form: prev.form };
        const k = keyOf(item.kind, item.refId);
        const existing = base.items.find((i) => keyOf(i.kind, i.refId) === k);
        if (existing) {
          existing.quantity += quantity;
        } else {
          base.items.push({ ...item, quantity });
        }
        return base;
      });
    };

    // Box products always create their own line (own taste selection).
    const addBox: CartContextValue['addBox'] = (item, quantity = 1) => {
      setState((prev) => {
        const differentSpot = prev.spotId && prev.spotId !== item.spotId;
        boxLineCounter += 1;
        const lineId = `box-${prev.items.length}-${boxLineCounter}`;
        const base: CartState = differentSpot
          ? { spotId: item.spotId, items: [], fulfillmentType: prev.fulfillmentType, delivery: null, form: null }
          : { spotId: item.spotId, items: [...prev.items], fulfillmentType: prev.fulfillmentType, delivery: prev.delivery, form: prev.form };
        base.items.push({ ...item, lineId, quantity });
        return base;
      });
    };

    const setLineQuantity: CartContextValue['setLineQuantity'] = (key, quantity) => {
      setState((prev) => {
        const items = prev.items
          .map((i) => (lineKeyOf(i) === key ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0);
        return items.length
          ? { spotId: prev.spotId, items, fulfillmentType: prev.fulfillmentType, delivery: prev.delivery, form: prev.form }
          : { spotId: null, items, fulfillmentType: 'delivery', delivery: null, form: null };
      });
    };

    const setQuantity: CartContextValue['setQuantity'] = (kind, refId, quantity) => {
      setLineQuantity(keyOf(kind, refId), quantity);
    };

    // Switching to pickup drops any delivery address (it no longer applies).
    const setFulfillmentType: CartContextValue['setFulfillmentType'] = (type) => {
      setState((prev) => ({
        ...prev,
        fulfillmentType: type,
        delivery: type === 'pickup' ? null : prev.delivery,
      }));
    };

    const setDelivery: CartContextValue['setDelivery'] = (delivery) => {
      setState((prev) => ({ ...prev, delivery }));
    };

    const setForm: CartContextValue['setForm'] = (form) => {
      setState((prev) => ({ ...prev, form }));
    };

    const clear = () =>
      setState({ spotId: null, items: [], fulfillmentType: 'delivery', delivery: null, form: null });

    return {
      spotId: state.spotId,
      items: state.items,
      fulfillmentType: state.fulfillmentType,
      delivery: state.delivery,
      form: state.form,
      count,
      subtotal,
      hydrated,
      lineKey: lineKeyOf,
      itemQuantity,
      addItem,
      addBox,
      setQuantity,
      setLineQuantity,
      setFulfillmentType,
      setDelivery,
      setForm,
      clear,
    };
  }, [state, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
