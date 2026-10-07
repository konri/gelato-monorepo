"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../auth/AuthProvider";
import { useAuthModal } from "../auth/AuthModalProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry";

export function Header() {
  const { t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const authModal = useAuthModal();
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on a route change…
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // …and on Escape, handing focus back to the menu button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isBusiness = pathname.startsWith("/for-business");
  const isSpots = pathname.startsWith("/spots");

  // Absolute hrefs so the links also work from /spots, /for-business, etc.
  const links = [
    { href: "/#how", label: t("nav.how"), current: false },
    { href: "/spots", label: t("nav.spots"), current: isSpots },
    { href: "/#rewards", label: t("nav.rewards"), current: false },
    { href: "/#app", label: t("nav.app"), current: false },
  ];
  const business = { href: "/for-business", label: t("nav.business"), current: isBusiness };

  const accountControl = (variant: "bar" | "panel") => {
    if (loading) return null;
    const bar = variant === "bar";
    if (isAuthenticated) {
      return (
        <Link
          href="/account"
          onClick={() => setMenuOpen(false)}
          className={
            bar
              ? `hidden min-h-[44px] items-center gap-2 rounded-full bg-berry px-4 text-sm font-semibold text-white shadow-lg shadow-berry/25 transition-transform motion-safe:hover:scale-105 sm:inline-flex ${FOCUS}`
              : `flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-berry px-5 font-semibold text-white ${FOCUS}`
          }
        >
          <span aria-hidden>👤</span>
          {t("auth.account")}
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          authModal.open("login");
        }}
        className={
          bar
            ? `hidden min-h-[44px] items-center rounded-full bg-berry px-4 text-sm font-semibold text-white shadow-lg shadow-berry/25 transition-transform motion-safe:hover:scale-105 sm:inline-flex ${FOCUS}`
            : `flex min-h-[48px] w-full items-center justify-center rounded-full bg-berry px-5 font-semibold text-white ${FOCUS}`
        }
      >
        {t("auth.login")}
      </button>
    );
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || menuOpen
          ? "border-b border-berry/10 bg-cream/95 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only rounded-full bg-berry px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-espresso"
      >
        {t("nav.skip")}
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-3.5">
        <Link href="/" className={`flex shrink-0 items-center rounded-lg ${FOCUS}`} aria-label="Loodly">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loodly-logo.svg" alt="Loodly" className="h-9 w-auto sm:h-11" />
        </Link>

        <nav aria-label={t("nav.main_nav")} className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className={`rounded-md text-sm font-medium transition-colors hover:text-berry ${
                l.current ? "text-berry" : "text-espresso/80"
              } ${FOCUS}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={business.href}
            aria-current={business.current ? "page" : undefined}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold text-berry transition-colors hover:border-berry hover:bg-white ${
              business.current ? "border-berry bg-white" : "border-berry/30"
            } ${FOCUS}`}
          >
            {business.label}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {accountControl("bar")}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? t("nav.menu_close") : t("nav.menu_open")}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-berry/20 bg-white/80 text-espresso transition-colors hover:border-berry/50 hover:bg-white lg:hidden ${FOCUS}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <path d="M4 7 H20 M4 12 H20 M4 17 H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label={t("nav.main_nav")}
        hidden={!menuOpen}
        className="border-t border-berry/10 bg-cream shadow-xl shadow-berry/10 lg:hidden"
      >
        <ul className="mx-auto max-w-6xl px-4 py-3 sm:px-5">
          {[...links, business].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setMenuOpen(false)}
                aria-current={l.current ? "page" : undefined}
                className={`flex min-h-[48px] items-center rounded-2xl px-3 text-base font-semibold transition-colors hover:bg-cream-soft ${
                  l.current ? "text-berry" : "text-espresso"
                } ${FOCUS}`}
              >
                {l.label}
                {l.href === business.href ? (
                  <svg className="ml-2 h-4 w-4 text-berry" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M6 3 L11 8 L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </Link>
            </li>
          ))}
          {!loading ? <li className="mt-2 sm:hidden">{accountControl("panel")}</li> : null}
        </ul>
      </nav>
    </header>
  );
}
