"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { fetchMyOrders, createComplaint } from "../../lib/account-api";
import type { MyOrder } from "../../lib/types";

export function OrdersTab() {
  const { t, locale } = useI18n();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintOrder, setComplaintOrder] = useState<MyOrder | null>(null);

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const localeTag = locale === "ua" ? "uk-UA" : locale === "pl" ? "pl-PL" : "en-GB";
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(localeTag, { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-espresso">{t("orders.orders_title")}</h2>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-berry/20 bg-cream-soft p-10 text-center">
          <div className="text-4xl">🍦</div>
          <p className="mt-3 text-espresso/60">{t("orders.orders_empty")}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-berry/10 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-espresso">#{o.orderNumber}</p>
                <p className="truncate text-sm text-espresso/55">
                  {o.spot?.name ? `${o.spot.name} · ` : ""}
                  {fmtDate(o.createdAt)} · {o.total.toFixed(2)} zł
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComplaintOrder(o)}
                className="shrink-0 rounded-full border border-berry/20 px-4 py-2 text-sm font-semibold text-berry transition-colors hover:border-berry hover:bg-cream-soft"
              >
                {t("orders.report")}
              </button>
            </div>
          ))}
        </div>
      )}

      {complaintOrder && (
        <ComplaintModal order={complaintOrder} onClose={() => setComplaintOrder(null)} />
      )}
    </div>
  );
}

function ComplaintModal({ order, onClose }: { order: MyOrder; onClose: () => void }) {
  const { t } = useI18n();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createComplaint(order.id, subject.trim(), message.trim());
      setDone(true);
    } catch {
      setError(t("orders.complaint_error"));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-black text-espresso">{t("orders.complaint_title")}</h3>
          <button type="button" onClick={onClose} aria-label={t("orders.cancel")} className="rounded-full p-1.5 text-espresso/40 hover:bg-cream-soft hover:text-espresso">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-espresso/55">#{order.orderNumber}</p>

        {done ? (
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-3 text-espresso/70">{t("orders.complaint_sent")}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-full bg-berry px-6 py-3 font-semibold text-white"
            >
              {t("auth.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            {error && (
              <div className="rounded-xl bg-strawberry/15 px-4 py-2.5 text-sm text-berry-dark">{error}</div>
            )}
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("orders.complaint_subject")}
              required
              className="w-full rounded-xl border border-berry/15 bg-cream-soft px-4 py-2.5 text-espresso outline-none focus:border-berry focus:bg-white"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("orders.complaint_message")}
              required
              rows={4}
              className="w-full rounded-xl border border-berry/15 bg-cream-soft px-4 py-2.5 text-espresso outline-none focus:border-berry focus:bg-white"
            />
            <button
              type="submit"
              disabled={busy || !subject.trim() || !message.trim()}
              className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/20 disabled:opacity-60"
            >
              {busy ? t("orders.complaint_sending") : t("orders.complaint_send")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
