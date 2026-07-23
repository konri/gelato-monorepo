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

export type CartItem = {
  kind: CartItemKind;
  refId: string;
  spotId: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
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
  add: (item: Omit<CartItem, "quantity">, spotName: string, quantity?: number) => void;
  setQuantity: (kind: CartItemKind, refId: string, quantity: number) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const keyOf = (kind: CartItemKind, refId: string) => `${kind}:${refId}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({
    spotId: null,
    spotName: null,
    items: [],
    fulfillmentType: "DELIVERY",
  });
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
  const add = useCallback<CartContextValue["add"]>((item, spotName, quantity = 1) => {
    setState((prev) => {
      const differentSpot = prev.spotId && prev.spotId !== item.spotId;
      const base: CartState = differentSpot
        ? { spotId: item.spotId, spotName, items: [], fulfillmentType: prev.fulfillmentType }
        : { ...prev, spotId: item.spotId, spotName, items: [...prev.items] };
      const k = keyOf(item.kind, item.refId);
      const existing = base.items.find((i) => keyOf(i.kind, i.refId) === k);
      if (existing) existing.quantity += quantity;
      else base.items.push({ ...item, quantity });
      return base;
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((kind, refId, quantity) => {
    setState((prev) => {
      const items = prev.items
        .map((i) => (keyOf(i.kind, i.refId) === keyOf(kind, refId) ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      return items.length
        ? { ...prev, items }
        : { spotId: null, spotName: null, items: [], fulfillmentType: "DELIVERY" };
    });
  }, []);

  const setFulfillmentType = useCallback<CartContextValue["setFulfillmentType"]>((type) => {
    setState((prev) => ({ ...prev, fulfillmentType: type }));
  }, []);

  const clear = useCallback(() => {
    setState({ spotId: null, spotName: null, items: [], fulfillmentType: "DELIVERY" });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      ...state,
      count,
      subtotal,
      hydrated,
      add,
      setQuantity,
      setFulfillmentType,
      clear,
    };
  }, [state, hydrated, add, setQuantity, setFulfillmentType, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
