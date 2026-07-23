"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "../../i18n/I18nProvider";
import type { Locale } from "../../i18n/translations";
import {
  fetchPrizes,
  fetchMyPrizes,
  redeemPrize,
} from "../../lib/account-api";
import type { LocalizedName, Prize, UserPrize } from "../../lib/types";

function localized(value: LocalizedName | null | undefined, fallback: string, locale: Locale) {
  return (value && value[locale]) || fallback;
}

export function PrizesTab({
  availablePoints,
  onPointsChanged,
}: {
  availablePoints: number;
  onPointsChanged: () => void;
}) {
  const { t } = useI18n();

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [myPrizes, setMyPrizes] = useState<UserPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Prize | null>(null);
  const [qrPrize, setQrPrize] = useState<UserPrize | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = () => {
    Promise.all([fetchPrizes(), fetchMyPrizes()])
      .then(([p, mine]) => {
        setPrizes(p);
        setMyPrizes(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const active = myPrizes.filter((p) => !p.isRedeemed);
  const redeemed = myPrizes.filter((p) => p.isRedeemed);

  const handleRedeemed = () => {
    setDetail(null);
    onPointsChanged();
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-espresso">{t("prizes.title")}</h2>
          <p className="text-espresso/60">{t("prizes.subtitle")}</p>
        </div>
        {redeemed.length > 0 && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-full border border-berry/20 px-4 py-2 text-sm font-semibold text-espresso transition-colors hover:border-berry"
          >
            {t("prizes.history")}
          </button>
        )}
      </div>

      {/* My active prizes */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-espresso/50">
          {t("prizes.my_prizes")}
        </h3>
        {active.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-berry/20 bg-cream-soft p-8 text-center">
            <div className="text-4xl">🎁</div>
            <p className="mt-3 text-sm text-espresso/60">{t("prizes.my_prizes_empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((up) => (
              <MyPrizeCard key={up.id} userPrize={up} onShowQr={() => setQrPrize(up)} />
            ))}
          </div>
        )}
      </section>

      {/* Catalog */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-espresso/50">
          {t("prizes.catalog")}
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {prizes.map((prize) => (
            <PrizeCard
              key={prize.id}
              prize={prize}
              affordable={availablePoints >= prize.pointsCost}
              onClick={() => setDetail(prize)}
            />
          ))}
        </div>
      </section>

      {detail && (
        <PrizeDetailModal
          prize={detail}
          availablePoints={availablePoints}
          onClose={() => setDetail(null)}
          onRedeemed={handleRedeemed}
        />
      )}
      {qrPrize && <PrizeQrModal userPrize={qrPrize} onClose={() => setQrPrize(null)} />}
      {historyOpen && (
        <HistoryModal redeemed={redeemed} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
}

function PrizeCard({
  prize,
  affordable,
  onClick,
}: {
  prize: Prize;
  affordable: boolean;
  onClick: () => void;
}) {
  const { t, locale } = useI18n();
  const outOfStock = prize.quantity != null && prize.claimed >= prize.quantity;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-berry/10 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-berry/10"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-soft">
        {prize.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prize.imageUrl}
            alt={localized(prize.titleLocal, prize.title, locale)}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🎁</div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-espresso/80 px-3 py-1 text-xs font-semibold text-white">
              {t("prizes.out_of_stock")}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold text-espresso">
          {localized(prize.titleLocal, prize.title, locale)}
        </p>
        <span
          className={`mt-2 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ${
            affordable ? "bg-berry/10 text-berry" : "bg-espresso/5 text-espresso/40"
          }`}
        >
          {t("prizes.cost", { count: prize.pointsCost })}
        </span>
      </div>
    </button>
  );
}

function MyPrizeCard({
  userPrize,
  onShowQr,
}: {
  userPrize: UserPrize;
  onShowQr: () => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="flex gap-3 rounded-2xl border border-berry/10 bg-white p-3 shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
        {userPrize.prize.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userPrize.prize.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🎁</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-semibold text-espresso">
          {localized(userPrize.prize.titleLocal, userPrize.prize.title, locale)}
        </p>
        <span className="mt-0.5 inline-flex w-fit rounded-full bg-pistachio/15 px-2 py-0.5 text-xs font-semibold text-pistachio">
          {t("prizes.active")}
        </span>
        <button
          type="button"
          onClick={onShowQr}
          className="mt-auto self-start rounded-full bg-berry px-3.5 py-1.5 text-xs font-semibold text-white"
        >
          {t("prizes.show_qr")}
        </button>
      </div>
    </div>
  );
}

function PrizeDetailModal({
  prize,
  availablePoints,
  onClose,
  onRedeemed,
}: {
  prize: Prize;
  availablePoints: number;
  onClose: () => void;
  onRedeemed: () => void;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outOfStock = prize.quantity != null && prize.claimed >= prize.quantity;
  const affordable = availablePoints >= prize.pointsCost;
  const canRedeem = affordable && !outOfStock && !busy;
  const pointsLeft = availablePoints - prize.pointsCost;

  const redeem = async () => {
    setBusy(true);
    setError(null);
    try {
      await redeemPrize(prize.id);
      onRedeemed();
    } catch {
      setError(t("auth.error_generic"));
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={localized(prize.titleLocal, prize.title, locale)}>
      <div className="mb-4 aspect-video overflow-hidden rounded-2xl bg-cream-soft">
        {prize.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prize.imageUrl}
            alt={localized(prize.titleLocal, prize.title, locale)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">🎁</div>
        )}
      </div>

      <span className="inline-flex rounded-full bg-berry/10 px-3 py-1 text-sm font-bold text-berry">
        {t("prizes.cost", { count: prize.pointsCost })}
      </span>

      {(prize.descriptionLocal || prize.description) && (
        <p className="mt-3 text-sm leading-relaxed text-espresso/70">
          {localized(prize.descriptionLocal, prize.description ?? "", locale)}
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-strawberry/15 px-4 py-2.5 text-sm text-berry-dark">
          {error}
        </div>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={redeem}
          disabled={!canRedeem}
          className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/20 disabled:opacity-50"
        >
          {busy
            ? t("prizes.redeeming")
            : outOfStock
              ? t("prizes.out_of_stock")
              : t("prizes.redeem")}
        </button>
        <p className="mt-2 text-center text-sm text-espresso/60">
          {affordable
            ? t("prizes.points_left", { count: pointsLeft })
            : t("prizes.need_more", { count: prize.pointsCost - availablePoints })}
        </p>
      </div>
    </ModalShell>
  );
}

function PrizeQrModal({ userPrize, onClose }: { userPrize: UserPrize; onClose: () => void }) {
  const { t, locale } = useI18n();
  return (
    <ModalShell onClose={onClose} title={localized(userPrize.prize.titleLocal, userPrize.prize.title, locale)}>
      <div className="flex flex-col items-center py-2">
        <div className="rounded-2xl border border-berry/10 bg-white p-4 shadow-sm">
          <QRCodeSVG value={userPrize.qrCode} size={220} level="M" />
        </div>
        <p className="mt-4 max-w-xs text-center text-sm text-espresso/60">
          {t("prizes.scan_hint")}
        </p>
        <p className="mt-1 text-xs text-espresso/45">
          {t("prizes.valid_until", {
            date: new Date(userPrize.validUntil).toLocaleDateString(),
          })}
        </p>
      </div>
    </ModalShell>
  );
}

function HistoryModal({
  redeemed,
  onClose,
}: {
  redeemed: UserPrize[];
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  return (
    <ModalShell onClose={onClose} title={t("prizes.history")}>
      {redeemed.length === 0 ? (
        <p className="py-6 text-center text-sm text-espresso/60">{t("prizes.history_empty")}</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {redeemed.map((up) => (
            <li key={up.id} className="flex items-center gap-3 rounded-2xl bg-cream-soft p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                {up.prize.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={up.prize.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">🎁</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-espresso">
                  {localized(up.prize.titleLocal, up.prize.title, locale)}
                </p>
                {up.redeemedAt && (
                  <p className="text-xs text-espresso/50">
                    {t("prizes.redeemed_at", {
                      date: new Date(up.redeemedAt).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-semibold text-espresso/40">
                {t("prizes.used")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="pr-6 text-xl font-black text-espresso">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-espresso/40 transition-colors hover:bg-cream-soft hover:text-espresso"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
