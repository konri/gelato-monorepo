"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAuth } from "../../auth/AuthProvider";
import { useAuthModal } from "../../auth/AuthModalProvider";
import { fetchPointBalance, fetchPointTransactions } from "../../lib/account-api";
import type { PointBalance, PointTransaction } from "../../lib/types";
import { LoyaltyCard } from "./LoyaltyCard";
import { TransactionHistory } from "./TransactionHistory";
import { QuestsTab } from "./QuestsTab";
import { PrizesTab } from "./PrizesTab";
import { OrdersTab } from "./OrdersTab";

type Tab = "card" | "orders" | "quests" | "prizes";

export function AccountDashboard() {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth();
  const authModal = useAuthModal();

  const [tab, setTab] = useState<Tab>("card");
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);

  const loadPoints = useCallback(() => {
    fetchPointBalance().then(setBalance).catch(() => setBalance(null));
    fetchPointTransactions().then(setTransactions).catch(() => setTransactions([]));
  }, []);

  useEffect(() => {
    if (user) loadPoints();
  }, [user, loadPoints]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="text-6xl">🔒</div>
        <p className="text-lg text-espresso/70">{t("account.login_required")}</p>
        <button
          type="button"
          onClick={() => authModal.open("login")}
          className="rounded-full bg-berry px-6 py-3 font-semibold text-white"
        >
          {t("auth.login")}
        </button>
      </div>
    );
  }

  const displayName = user.firstName || user.name || null;
  const availablePoints = balance?.availablePoints ?? 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "card", label: t("account.tab_card") },
    { key: "orders", label: t("account.tab_orders") },
    { key: "quests", label: t("account.tab_quests") },
    { key: "prizes", label: t("account.tab_prizes") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {/* Header: greeting + points + logout */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-berry to-berry-dark p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/70">
            {displayName
              ? t("account.greeting", { name: displayName })
              : t("account.greeting_generic")}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-black">{availablePoints}</span>
            <span className="text-lg font-medium text-white/80">{t("account.points")}</span>
          </div>
          {balance && balance.lockedPoints > 0 && (
            <p className="mt-1 text-xs text-white/60">
              {t("account.locked_points", { count: balance.lockedPoints })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={logout}
          className="self-start rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25 sm:self-auto"
        >
          {t("auth.logout")}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-berry/10">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
              tab === tb.key ? "text-berry" : "text-espresso/50 hover:text-espresso"
            }`}
          >
            {tb.label}
            {tab === tb.key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-berry" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tab === "card" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <LoyaltyCard user={user} />
            <TransactionHistory transactions={transactions} />
          </div>
        )}
        {tab === "orders" && <OrdersTab />}
        {tab === "quests" && <QuestsTab />}
        {tab === "prizes" && (
          <PrizesTab availablePoints={availablePoints} onPointsChanged={loadPoints} />
        )}
      </div>
    </div>
  );
}
