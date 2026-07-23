"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAuth } from "../../auth/AuthProvider";
import {
  fetchReferralCode,
  fetchReferralStats,
  updateProfile,
} from "../../lib/account-api";
import type { ReferralCode, ReferralStats } from "../../lib/types";

export function QuestsTab() {
  const { t } = useI18n();
  const { user, refresh } = useAuth();

  const [referral, setReferral] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);

  const birthdayDone = Boolean(user?.birthDate) || Boolean(user?.birthdayCompleted);

  useEffect(() => {
    fetchReferralCode().then(setReferral).catch(() => setReferral(null));
    fetchReferralStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-espresso">{t("quests.title")}</h2>
        <p className="text-espresso/60">{t("quests.subtitle")}</p>
      </div>

      {/* Referral quest */}
      <QuestCard
        emoji="👥"
        title={t("quests.referral_title")}
        description={t("quests.referral_desc")}
        reward={t("quests.referral_reward")}
        footer={
          stats
            ? t("quests.referral_stats", {
                completed: stats.completedReferrals,
                pending: stats.pendingReferrals,
              })
            : undefined
        }
        cta={t("quests.referral_cta")}
        onCta={() => setInviteOpen(true)}
      />

      {/* Birthday quest */}
      <QuestCard
        emoji="🎂"
        title={t("quests.birthday_title")}
        description={t("quests.birthday_desc")}
        reward={t("quests.birthday_reward")}
        completed={birthdayDone}
        completedLabel={t("quests.birthday_completed")}
        cta={t("quests.birthday_cta")}
        onCta={() => setBirthdayOpen(true)}
      />

      {inviteOpen && referral && (
        <InviteModal code={referral.code} onClose={() => setInviteOpen(false)} />
      )}
      {birthdayOpen && (
        <BirthdayModal
          onClose={() => setBirthdayOpen(false)}
          onSaved={async () => {
            setBirthdayOpen(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function QuestCard({
  emoji,
  title,
  description,
  reward,
  footer,
  cta,
  onCta,
  completed,
  completedLabel,
}: {
  emoji: string;
  title: string;
  description: string;
  reward: string;
  footer?: string;
  cta: string;
  onCta: () => void;
  completed?: boolean;
  completedLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-berry/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream-soft text-2xl">
          <span aria-hidden>{emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-espresso">{title}</h3>
            <span className="rounded-full bg-pistachio/15 px-2.5 py-0.5 text-xs font-bold text-pistachio">
              {reward}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-espresso/65">{description}</p>
          {footer && <p className="mt-2 text-xs font-medium text-espresso/50">{footer}</p>}

          <div className="mt-4">
            {completed ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-pistachio/15 px-4 py-2 text-sm font-semibold text-pistachio">
                ✓ {completedLabel}
              </span>
            ) : (
              <button
                type="button"
                onClick={onCta}
                className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-berry/20 transition-transform hover:scale-105"
              >
                {cta}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ code, onClose }: { code: string; onClose: () => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    const text = t("quests.referral_share_message", { code });
    if (navigator.share) {
      try {
        await navigator.share({ title: "Gelato", text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  };

  return (
    <ModalShell onClose={onClose} title={t("quests.referral_title")}>
      <p className="text-sm text-espresso/65">{t("quests.referral_desc")}</p>
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-espresso/50">
          {t("quests.referral_code_label")}
        </p>
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-berry/30 bg-cream-soft py-5">
          <span className="font-mono text-2xl font-black tracking-[0.3em] text-berry">{code}</span>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-full border border-berry/20 py-3 font-semibold text-espresso transition-colors hover:border-berry"
        >
          {copied ? t("quests.referral_copied") : t("quests.referral_copy")}
        </button>
        <button
          type="button"
          onClick={share}
          className="flex-1 rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/20"
        >
          {t("quests.referral_share")}
        </button>
      </div>
    </ModalShell>
  );
}

function BirthdayModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!date) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ birthDate: date });
      onSaved();
    } catch {
      setError(t("auth.error_generic"));
      setBusy(false);
    }
  };

  // Max date = today; the backend enforces a minimum age.
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  return (
    <ModalShell onClose={onClose} title={t("quests.birthday_title")}>
      <p className="text-sm text-espresso/65">{t("quests.birthday_desc")}</p>
      {error && (
        <div className="mt-4 rounded-xl bg-strawberry/15 px-4 py-2.5 text-sm text-berry-dark">
          {error}
        </div>
      )}
      <input
        type="date"
        value={date}
        max={maxDate}
        onChange={(e) => setDate(e.target.value)}
        className="mt-4 w-full rounded-xl border border-berry/15 bg-cream-soft px-4 py-2.5 text-espresso outline-none focus:border-berry focus:bg-white"
      />
      <p className="mt-2 text-xs text-espresso/50">⚠️ {t("quests.birthday_note")}</p>
      <button
        type="button"
        onClick={save}
        disabled={!date || busy}
        className="mt-4 w-full rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/20 disabled:opacity-60"
      >
        {busy ? "…" : t("quests.birthday_save")}
      </button>
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
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-black text-espresso">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-espresso/40 transition-colors hover:bg-cream-soft hover:text-espresso"
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
