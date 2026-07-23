"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "../../i18n/I18nProvider";
import type { User } from "../../lib/types";

/**
 * QR loyalty card. The payload mirrors the mobile client:
 * JSON { userId, type: 'LOYALTY_USER' }. Staff scan it to award points.
 * A brightness boost overlay helps scanners read the screen.
 */
export function LoyaltyCard({ user }: { user: User }) {
  const { t } = useI18n();
  const [bright, setBright] = useState(false);

  const payload = JSON.stringify({ userId: user.id, type: "LOYALTY_USER" });
  // Short, human-typeable account number that staff can also enter manually.
  const accountNumber = user.loyaltyCode || "—";

  return (
    <>
      {/* Full-screen white overlay to maximize scan brightness */}
      {bright && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-white p-6"
          onClick={() => setBright(false)}
        >
          <QRCodeSVG value={payload} size={280} level="M" />
          <p className="font-mono text-lg tracking-widest text-espresso">{accountNumber}</p>
          <button
            type="button"
            onClick={() => setBright(false)}
            className="rounded-full bg-berry px-6 py-3 font-semibold text-white"
          >
            {t("account.brightness_on")}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-berry/10 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-berry to-berry-dark px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              <span aria-hidden>🍦</span>
              {t("account.loyalty_card")}
            </span>
            <button
              type="button"
              onClick={() => setBright(true)}
              aria-label={t("account.brightness")}
              title={t("account.brightness")}
              className="rounded-full bg-white/15 p-2 transition-colors hover:bg-white/25"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center px-6 py-6">
          <div className="rounded-2xl border border-berry/10 bg-white p-4 shadow-sm">
            <QRCodeSVG value={payload} size={200} level="M" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-espresso/50">
            {t("account.account_number")}
          </p>
          <p className="mt-1 font-mono text-lg tracking-widest text-espresso">{accountNumber}</p>
          {user.phone && (
            <p className="mt-2 text-sm text-espresso/60">
              {t("account.phone_code")}: <span className="font-mono">{user.phone}</span>
            </p>
          )}
          <p className="mt-3 max-w-xs text-center text-sm text-espresso/55">
            {t("account.loyalty_hint")}
          </p>
        </div>
      </div>
    </>
  );
}
