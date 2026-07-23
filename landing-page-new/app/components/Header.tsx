"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { useAuthModal } from "../auth/AuthModalProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const authModal = useAuthModal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Absolute hrefs so the links also work from /spots and /spots/[id].
  const links = [
    { href: "/#features", label: t("nav.features") },
    { href: "/spots", label: t("nav.spots") },
    { href: "/#app", label: t("nav.app") },
    { href: "/#contact", label: t("nav.contact") },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-berry/10 bg-cream/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🍦
          </span>
          <span className="text-xl font-black tracking-tight text-berry">Gelato</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-espresso/80 transition-colors hover:text-berry"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {!loading &&
            (isAuthenticated ? (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-105"
              >
                <span aria-hidden>👤</span>
                <span className="hidden sm:inline">{t("auth.account")}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => authModal.open("login")}
                className="rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-105"
              >
                {t("auth.login")}
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}
