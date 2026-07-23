"use client";

import { useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe, stripeConfigured } from "../../lib/stripe";
import { createPaymentIntent } from "../../lib/payment-api";
import { useI18n } from "../../i18n/I18nProvider";

/**
 * Web checkout payment step. Given an order id, it fetches the Stripe client
 * secret (same backend mutation the mobile app uses) and renders the Payment
 * Element — card, Apple/Google Pay, and BLIK per the Stripe dashboard.
 *
 * On success the backend webhook marks the order paid; here we just surface
 * the result and hand control back via onSuccess.
 */
export function StripePayment({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createPaymentIntent(orderId)
      .then((secret) => !cancelled && setClientSecret(secret))
      .catch(() => !cancelled && setError(t("checkout.pay_error")));
    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  if (!stripeConfigured) {
    return (
      <div className="rounded-2xl border border-mango/30 bg-mango/10 px-5 py-4 text-sm text-espresso/70">
        ℹ️ {t("checkout.stripe_unconfigured")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-strawberry/30 bg-strawberry/10 px-5 py-4 text-sm text-berry-dark">
        {error}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#c026a3",
            colorText: "#3a1526",
            borderRadius: "12px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} />
    </Elements>
  );
}

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useI18n();
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Stay on-page for card; redirect-based methods (BLIK) return here.
      confirmParams: {
        return_url: `${window.location.origin}/account`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || t("checkout.pay_error"));
      setBusy(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      // Redirect-based method in progress, or needs another step.
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="rounded-xl bg-strawberry/10 px-4 py-2.5 text-sm text-berry-dark">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full rounded-full bg-berry py-3.5 font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {busy ? t("checkout.paying") : t("checkout.pay_now")}
      </button>
    </form>
  );
}
