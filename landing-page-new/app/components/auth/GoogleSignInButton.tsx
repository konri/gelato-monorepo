"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { loginWithGoogle } from "../../lib/account-api";
import type { User } from "../../lib/types";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Minimal shape of the Google Identity Services global we use.
type GoogleIdApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (res: { credential?: string }) => void;
      }) => void;
      renderButton: (
        el: HTMLElement,
        options: Record<string, string | number>,
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
}) {
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Keep the latest callbacks without re-initializing GIS.
  const cbRef = useRef({ onSuccess, onError });
  cbRef.current = { onSuccess, onError };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (res) => {
            if (!res.credential) {
              cbRef.current.onError(t("auth.error_generic"));
              return;
            }
            try {
              const authRes = await loginWithGoogle(res.credential);
              cbRef.current.onSuccess(authRes.user);
            } catch {
              cbRef.current.onError(t("auth.error_generic"));
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale: locale === "ua" ? "uk" : locale,
          width: 320,
        });
        setReady(true);
      })
      .catch(() => onError(t("auth.error_generic")));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // No client id configured → don't render anything (caller shows email/phone).
  if (!CLIENT_ID) return null;

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className={ready ? "" : "min-h-[44px]"} />
    </div>
  );
}

export const googleConfigured = Boolean(CLIENT_ID);
