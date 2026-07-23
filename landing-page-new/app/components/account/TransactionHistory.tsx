"use client";

import { useMemo } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import type { PointTransaction, TransactionType } from "../../lib/types";

const ICONS: Record<TransactionType, string> = {
  EARNED: "🛒",
  SPENT: "🎁",
  REFUND: "↩️",
  BONUS: "✨",
  REFERRAL: "👥",
  BIRTHDAY: "🎂",
  QUEST: "🎯",
};

/** Group transactions by calendar day (YYYY-MM-DD), newest first. */
function groupByDay(txns: PointTransaction[]) {
  const groups: { key: string; date: Date; items: PointTransaction[] }[] = [];
  const index = new Map<string, number>();
  for (const t of txns) {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let i = index.get(key);
    if (i === undefined) {
      i = groups.length;
      index.set(key, i);
      groups.push({ key, date: d, items: [] });
    }
    groups[i].items.push(t);
  }
  return groups;
}

export function TransactionHistory({
  transactions,
}: {
  transactions: PointTransaction[];
}) {
  const { t, locale } = useI18n();

  const groups = useMemo(() => groupByDay(transactions), [transactions]);

  const localeTag = locale === "ua" ? "uk-UA" : locale === "pl" ? "pl-PL" : "en-GB";
  const dayLabel = (date: Date) => {
    const now = new Date();
    const isSame = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSame(date, now)) return t("account.today");
    if (isSame(date, yesterday)) return t("account.yesterday");
    return date.toLocaleDateString(localeTag, {
      day: "numeric",
      month: "long",
      year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    });
  };
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" });

  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl border border-berry/10 bg-white p-10 text-center">
        <div className="text-4xl">🍨</div>
        <p className="mt-3 text-espresso/60">{t("account.history_empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-berry/10 bg-white p-5 sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-espresso">{t("account.history_title")}</h3>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-espresso/45">
              {dayLabel(group.date)}
            </p>
            <ul className="space-y-1">
              {group.items.map((txn) => {
                const positive = txn.amount >= 0;
                return (
                  <li
                    key={txn.id}
                    className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-cream-soft"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-soft text-lg">
                      <span aria-hidden>{ICONS[txn.type] ?? "•"}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-espresso">
                        {txn.description || t(`account.reason.${txn.type}`)}
                      </p>
                      <p className="text-xs text-espresso/50">{timeLabel(txn.createdAt)}</p>
                    </div>
                    <span
                      className={`shrink-0 font-bold ${positive ? "text-pistachio" : "text-strawberry"}`}
                    >
                      {positive ? "+" : ""}
                      {txn.amount}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
