"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FulfillmentType } from "./types";

const STORAGE_KEY = "gelato_web_cart_v1";

export type CartItemKind = "taste" | "product";

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
  // Box products only: the chosen tastes.
  boxSelections?: BoxSelection[];
};

type CartState = {
  spotId: string | null;
  spotName: string | null;
  items: CartItem[];
  fulfillmentType: FulfillmentType;
};

type CartContextValue = CartState & {
  count: number;
  subtotal: number;
  hydrated: boolean;
  /** Stable key for a cart line (box items keep their own line). */
  lineKey: (item: CartItem) => string;
  add: (item: Omit<CartItem, "quantity">, spotName: string, quantity?: number) => void;
  /** Add a configured box as its own line (never merged with other boxes). */
  addBox: (item: Omit<CartItem, "quantity" | "lineId">, spotName: string, quantity?: number) => void;
  setQuantity: (kind: CartItemKind, refId: string, quantity: number) => void;
  /** Adjust/remove any line by its lineKey (works for box + non-box). */
  setLineQuantity: (key: string, quantity: number) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const keyOf = (kind: CartItemKind, refId: string) => `${kind}:${refId}`;
// Box lines are identified by their unique lineId; everything else by kind:refId.
const lineKeyOf = (item: CartItem) => item.lineId ?? keyOf(item.kind, item.refId);
let boxLineCounter = 0;

const emptyState: CartState = {
  spotId: null,
  spotName: null,
  items: [],
  fulfillmentType: "DELIVERY",
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore corrupt cart */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state, hydrated]);

  // Adding from a different spot replaces the cart (single-spot orders).
  // NOTE: this updater must be pure — React StrictMode invokes it twice in dev,
  // so mutating shared item objects here would double-count quantities.
  const add = useCallback<CartContextValue["add"]>((item, spotName, quantity = 1) => {
    setState((prev) => {
      const differentSpot = prev.spotId && prev.spotId !== item.spotId;
      const prevItems = differentSpot ? [] : prev.items;
      const k = keyOf(item.kind, item.refId);
      const exists = prevItems.some((i) => !i.lineId && keyOf(i.kind, i.refId) === k);
      const items = exists
        ? prevItems.map((i) =>
            !i.lineId && keyOf(i.kind, i.refId) === k
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [...prevItems, { ...item, quantity }];
      return { spotId: item.spotId, spotName, items, fulfillmentType: prev.fulfillmentType };
    });
  }, []);

  // Box products always create their own line (own taste selection).
  const addBox = useCallback<CartContextValue["addBox"]>((item, spotName, quantity = 1) => {
    setState((prev) => {
      const differentSpot = prev.spotId && prev.spotId !== item.spotId;
      const prevItems = differentSpot ? [] : prev.items;
      boxLineCounter += 1;
      const lineId = `box-${prevItems.length}-${boxLineCounter}`;
      return {
        spotId: item.spotId,
        spotName,
        items: [...prevItems, { ...item, lineId, quantity }],
        fulfillmentType: prev.fulfillmentType,
      };
    });
  }, []);

  const setLineQuantity = useCallback<CartContextValue["setLineQuantity"]>((key, quantity) => {
    setState((prev) => {
      const items = prev.items
        .map((i) => (lineKeyOf(i) === key ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      return items.length ? { ...prev, items } : emptyState;
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((kind, refId, quantity) => {
    setLineQuantity(keyOf(kind, refId), quantity);
  }, [setLineQuantity]);

  const setFulfillmentType = useCallback<CartContextValue["setFulfillmentType"]>((type) => {
    setState((prev) => ({ ...prev, fulfillmentType: type }));
  }, []);

  const clear = useCallback(() => {
    setState(emptyState);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      ...state,
      count,
      subtotal,
      hydrated,
      lineKey: lineKeyOf,
      add,
      addBox,
      setQuantity,
      setLineQuantity,
      setFulfillmentType,
      clear,
    };
  }, [state, hydrated, add, addBox, setQuantity, setLineQuantity, setFulfillmentType, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
