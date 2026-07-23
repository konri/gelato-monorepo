"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAuth } from "../../auth/AuthProvider";
import { login, register, sendOTP, verifyOTP } from "../../lib/account-api";
import { GoogleSignInButton, googleConfigured } from "./GoogleSignInButton";
import type { User } from "../../lib/types";

type Mode = "login" | "signup" | "phone" | "otp";

type Props = {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
};

export function AuthModal({ open, onClose, initialMode = "login" }: Props) {
  const { t } = useI18n();
  const { setSession } = useAuth();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to a clean state each time the modal opens.
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setPassword("");
      setCode("");
      setBusy(false);
    }
  }, [open, initialMode]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const done = (user: User) => {
    setSession(user);
    onClose();
  };

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      done(res.user);
    } catch (e) {
      setError(
        e instanceof Error && /invalid|credential|password|denied/i.test(e.message)
          ? t("auth.error_credentials")
          : t("auth.error_generic"),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      done(res.user);
    } catch {
      setError(t("auth.error_generic"));
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendOTP(phone.trim());
      setMode("otp");
    } catch {
      setError(t("auth.error_generic"));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOTP(phone.trim(), code.trim());
      done(res.user);
    } catch {
      setError(t("auth.error_generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-berry to-berry-dark px-7 pb-8 pt-7 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("auth.close")}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="text-3xl" aria-hidden>🍦</div>
          <h2 className="mt-2 text-2xl font-black">
            {mode === "signup"
              ? t("auth.signup_title")
              : mode === "phone" || mode === "otp"
                ? t("auth.phone_title")
                : t("auth.login_title")}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {mode === "signup"
              ? t("auth.signup_subtitle")
              : mode === "otp"
                ? t("auth.otp_subtitle", { phone: phone.trim() })
                : mode === "phone"
                  ? t("auth.phone_subtitle")
                  : t("auth.login_subtitle")}
          </p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {error && (
            <div className="mb-4 rounded-xl bg-strawberry/15 px-4 py-2.5 text-sm text-berry-dark">
              {error}
            </div>
          )}

          {(mode === "login" || mode === "signup") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "login") handleLogin();
                else handleSignup();
              }}
              className="space-y-3"
            >
              {mode === "signup" && (
                <Field
                  label={t("auth.name")}
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              )}
              <Field
                label={t("auth.email")}
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />
              <Field
                label={t("auth.password")}
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setError(t("auth.forgot_soon"))}
                  className="text-sm font-medium text-berry hover:underline"
                >
                  {t("auth.forgot_password")}
                </button>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "…" : mode === "login" ? t("auth.login_cta") : t("auth.signup_cta")}
              </button>

              <Divider label={t("auth.or")} />

              {googleConfigured ? (
                <GoogleSignInButton onSuccess={done} onError={setError} />
              ) : (
                <SocialButtons
                  onGoogle={() => setError(t("auth.social_soon", { provider: "Google" }))}
                  googleLabel={t("auth.continue_google")}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  setMode("phone");
                  setError(null);
                }}
                className="w-full rounded-full border border-berry/20 py-3 font-semibold text-espresso transition-colors hover:border-berry"
              >
                📱 {t("auth.use_phone")}
              </button>
            </form>
          )}

          {mode === "phone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCode();
              }}
              className="space-y-3"
            >
              <Field
                label={t("auth.phone")}
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder={t("auth.phone_placeholder")}
                autoComplete="tel"
                required
              />
              <button
                type="submit"
                disabled={busy || phone.trim().length < 6}
                className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "…" : t("auth.send_code")}
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full py-2 text-sm font-medium text-espresso/60 hover:text-espresso"
              >
                {t("auth.use_email")}
              </button>
            </form>
          )}

          {mode === "otp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="space-y-3"
            >
              <OtpInput value={code} onChange={setCode} />
              <button
                type="submit"
                disabled={busy || code.trim().length < 6}
                className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "…" : t("auth.otp_verify")}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setMode("phone")}
                  className="font-medium text-espresso/60 hover:text-espresso"
                >
                  {t("auth.back")}
                </button>
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="font-medium text-berry hover:underline"
                >
                  {t("auth.resend_code")}
                </button>
              </div>
            </form>
          )}

          {/* Mode switch footer for email flows */}
          {(mode === "login" || mode === "signup") && (
            <p className="mt-5 text-center text-sm text-espresso/60">
              {mode === "login" ? t("auth.no_account") : t("auth.have_account")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
                className="font-semibold text-berry hover:underline"
              >
                {mode === "login" ? t("auth.signup") : t("auth.login")}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-espresso/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-berry/15 bg-cream-soft px-4 py-2.5 text-espresso outline-none transition-colors focus:border-berry focus:bg-white"
      />
    </label>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-berry/10" />
      <span className="text-xs uppercase text-espresso/40">{label}</span>
      <span className="h-px flex-1 bg-berry/10" />
    </div>
  );
}

function SocialButtons({
  onGoogle,
  googleLabel,
}: {
  onGoogle: () => void;
  googleLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onGoogle}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-berry/20 py-3 font-semibold text-espresso transition-colors hover:bg-cream-soft"
    >
      <GoogleIcon />
      {googleLabel}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  return (
    <div
      className="relative flex justify-center gap-2"
      onClick={() => ref.current?.focus()}
    >
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        className="absolute inset-0 opacity-0"
        aria-label="OTP code"
      />
      {digits.map((d, i) => (
        <div
          key={i}
          className={`flex h-12 w-11 items-center justify-center rounded-xl border-2 text-xl font-bold text-espresso ${
            i === value.length ? "border-berry" : "border-berry/15"
          } bg-cream-soft`}
        >
          {d.trim()}
        </div>
      ))}
    </div>
  );
}
