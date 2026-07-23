"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAuth } from "../../auth/AuthProvider";
import { useAuthModal } from "../../auth/AuthModalProvider";
import { useCart } from "../../lib/cart";
import { createOrder, checkDeliveryAvailability } from "../../lib/payment-api";
import {
  fetchPlacePredictions,
  geocodePlaceId,
  newSessionToken,
  type PlacePrediction,
} from "../../lib/places";
import type { DeliveryAvailability, FulfillmentType, OrderSummary } from "../../lib/types";
import { StripePayment } from "./StripePayment";

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, "")} zł`;

type PayChoice = "online" | "cash";

export function CheckoutClient() {
  const { t } = useI18n();
  const router = useRouter();
  const cart = useCart();
  const { isAuthenticated } = useAuth();
  const authModal = useAuthModal();

  const isPickup = cart.fulfillmentType === "PICKUP";

  // Delivery address state
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [selected, setSelected] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [delivery, setDelivery] = useState<DeliveryAvailability | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const sessionToken = useRef(newSessionToken());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notes + payment choice
  const [note, setNote] = useState("");
  const [payChoice, setPayChoice] = useState<PayChoice>("online");
  const cash = isPickup && payChoice === "cash";

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // When an online order is created we hand off to Stripe.
  const [order, setOrder] = useState<OrderSummary | null>(null);

  // Pricing (server is authoritative; this is the display estimate).
  const deliveryFee = useMemo(() => {
    if (isPickup || !delivery) return 0;
    const free = delivery.freeDeliveryThreshold;
    return free != null && cart.subtotal >= free ? 0 : delivery.deliveryFee;
  }, [isPickup, delivery, cart.subtotal]);
  const total = cart.subtotal + deliveryFee;

  // Debounced address autocomplete.
  useEffect(() => {
    if (isPickup || !query || selected?.address === query) {
      setPredictions([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setPredictions(await fetchPlacePredictions(query, sessionToken.current));
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, isPickup, selected]);

  const pickPrediction = useCallback(
    async (p: PlacePrediction) => {
      setPredictions([]);
      setQuery(p.description);
      const place = await geocodePlaceId(p.placeId, sessionToken.current);
      sessionToken.current = newSessionToken();
      if (!place || !cart.spotId) return;
      setSelected(place);
      setCheckingDelivery(true);
      try {
        const avail = await checkDeliveryAvailability(cart.spotId, place.latitude, place.longitude);
        setDelivery(avail);
      } finally {
        setCheckingDelivery(false);
      }
    },
    [cart.spotId],
  );

  const canPlace =
    cart.count > 0 &&
    (isPickup || (!!selected && delivery?.canDeliver === true)) &&
    !placing;

  const place = async () => {
    if (!cart.spotId) return;
    if (!isAuthenticated) {
      authModal.open("login");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const created = await createOrder({
        spotId: cart.spotId,
        items: cart.items.map((i) =>
          i.kind === "taste"
            ? { tasteId: i.refId, quantity: i.quantity }
            : { productId: i.refId, quantity: i.quantity },
        ),
        fulfillmentType: cart.fulfillmentType,
        paymentMethod: cash ? "cash" : "card",
        spotNotes: note || undefined,
        ...(isPickup
          ? {}
          : {
              deliveryAddress: selected!.address,
              deliveryLatitude: selected!.latitude,
              deliveryLongitude: selected!.longitude,
            }),
      });

      if (cash) {
        // Pay at spot — no online payment. Done.
        cart.clear();
        router.push(`/checkout/success?order=${encodeURIComponent(created.orderNumber)}&cash=1`);
        return;
      }
      // Pay online — hand off to the Stripe step.
      setOrder(created);
    } catch (e) {
      setError((e as Error).message || t("checkout.order_failed"));
    } finally {
      setPlacing(false);
    }
  };

  // Empty cart
  if (cart.hydrated && cart.count === 0 && !order) {
    return (
      <Shell title={t("checkout.title")}>
        <div className="rounded-3xl border border-dashed border-berry/20 bg-cream-soft p-10 text-center">
          <div className="text-5xl">🛒</div>
          <p className="mt-4 text-espresso/60">{t("checkout.empty")}</p>
          <Link
            href="/spots"
            className="mt-6 inline-block rounded-full bg-berry px-6 py-3 font-semibold text-white"
          >
            {t("checkout.browse_spots")}
          </Link>
        </div>
      </Shell>
    );
  }

  // Online payment step (after order created).
  if (order) {
    return (
      <Shell title={t("checkout.payment")}>
        <div className="rounded-3xl border border-berry/10 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm text-espresso/70">
            {t("checkout.order_number", { number: order.orderNumber })} · {zl(order.total)}
          </p>
          <StripePayment
            orderId={order.id}
            onSuccess={() => {
              cart.clear();
              router.push(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
            }}
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={t("checkout.title")}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: fulfillment + address + payment */}
        <div className="space-y-6">
          {/* Fulfillment toggle */}
          <Section title={t("checkout.fulfillment")}>
            <div className="flex rounded-2xl bg-cream-soft p-1">
              {(["DELIVERY", "PICKUP"] as FulfillmentType[]).map((type) => {
                const active = cart.fulfillmentType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => cart.setFulfillmentType(type)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                      active ? "bg-white text-berry shadow-sm" : "text-espresso/60"
                    }`}
                  >
                    {t(type === "DELIVERY" ? "checkout.delivery" : "checkout.pickup")}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Address (delivery) or pickup note */}
          {isPickup ? (
            <Section title={t("checkout.pickup_location")}>
              <div className="rounded-2xl border border-berry/10 bg-white p-4">
                <p className="font-semibold text-espresso">{cart.spotName}</p>
                <p className="mt-1 text-sm text-espresso/60">{t("checkout.pickup_hint")}</p>
              </div>
            </Section>
          ) : (
            <Section title={t("checkout.delivery_address")}>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelected(null);
                    setDelivery(null);
                  }}
                  placeholder={t("checkout.address_placeholder")}
                  className="w-full rounded-2xl border border-berry/15 bg-white px-4 py-3 outline-none focus:border-berry"
                />
                {predictions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-berry/10 bg-white shadow-lg">
                    {predictions.map((p) => (
                      <li key={p.placeId}>
                        <button
                          type="button"
                          onClick={() => pickPrediction(p)}
                          className="block w-full px-4 py-2.5 text-left text-sm text-espresso hover:bg-cream-soft"
                        >
                          {p.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {checkingDelivery && (
                <p className="mt-2 text-sm text-espresso/50">{t("checkout.checking_delivery")}</p>
              )}
              {selected && delivery && !checkingDelivery && (
                <p
                  className={`mt-2 text-sm ${
                    delivery.canDeliver ? "text-pistachio-dark" : "text-berry-dark"
                  }`}
                >
                  {delivery.canDeliver
                    ? t("checkout.can_deliver", { km: delivery.distanceKm.toFixed(1) })
                    : t("checkout.out_of_range", { km: delivery.deliveryRadiusKm })}
                </p>
              )}
            </Section>
          )}

          {/* Notes */}
          <Section title={t("checkout.note")}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("checkout.note_placeholder")}
              rows={2}
              className="w-full rounded-2xl border border-berry/15 bg-white px-4 py-3 outline-none focus:border-berry"
            />
          </Section>

          {/* Payment method */}
          <Section title={t("checkout.payment_method")}>
            {isPickup ? (
              <div className="space-y-3">
                <PayOption
                  active={payChoice === "online"}
                  onClick={() => setPayChoice("online")}
                  title={t("checkout.pay_online")}
                  subtitle={t("checkout.pay_online_hint")}
                />
                <PayOption
                  active={payChoice === "cash"}
                  onClick={() => setPayChoice("cash")}
                  title={t("checkout.pay_at_spot")}
                  subtitle={t("checkout.pay_at_spot_hint")}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-berry/10 bg-white px-4 py-3 text-sm text-espresso/70">
                💳 {t("checkout.pay_online_hint")}
              </div>
            )}
          </Section>
        </div>

        {/* Right: order summary */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-berry/10 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-espresso">{t("checkout.summary")}</h3>
            <ul className="space-y-2">
              {cart.items.map((i) => (
                <li key={`${i.kind}-${i.refId}`} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-espresso/80">
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(i.kind, i.refId, i.quantity - 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-berry/10 text-berry"
                      aria-label="−"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-semibold">{i.quantity}</span>
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(i.kind, i.refId, i.quantity + 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-berry/10 text-berry"
                      aria-label="+"
                    >
                      +
                    </button>
                    <span className="ml-1 truncate">{i.title}</span>
                  </span>
                  <span className="font-semibold text-espresso">{zl(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="my-3 h-px bg-berry/10" />
            <Row label={t("checkout.subtotal")} value={zl(cart.subtotal)} />
            {!isPickup && (
              <Row
                label={t("checkout.delivery_fee")}
                value={deliveryFee === 0 ? t("checkout.free") : zl(deliveryFee)}
              />
            )}
            <div className="my-2 h-px bg-berry/10" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-espresso">{t("checkout.total")}</span>
              <span className="text-lg font-black text-espresso">{zl(total)}</span>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-strawberry/10 px-4 py-2.5 text-sm text-berry-dark">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={!canPlace}
              onClick={place}
              className="mt-4 w-full rounded-full bg-berry py-3.5 font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {placing
                ? t("checkout.placing")
                : cash
                  ? t("checkout.place_order")
                  : t("checkout.continue_to_pay")}
            </button>
            {!isAuthenticated && (
              <p className="mt-2 text-center text-xs text-espresso/50">{t("checkout.login_required")}</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/spots" className="text-berry hover:underline">
          ← {t("spot.back")}
        </Link>
      </div>
      <h1 className="mb-6 text-3xl font-black tracking-tight text-espresso">{title}</h1>
      {children}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-bold text-espresso">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-espresso/60">{label}</span>
      <span className="font-semibold text-espresso">{value}</span>
    </div>
  );
}

function PayOption({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
        active ? "border-berry bg-berry/5" : "border-berry/10 bg-white"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          active ? "border-berry" : "border-espresso/30"
        }`}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-berry" />}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-espresso">{title}</span>
        <span className="block text-xs text-espresso/55">{subtitle}</span>
      </span>
    </button>
  );
}
