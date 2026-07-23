"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AuthModal } from "../components/auth/AuthModal";

type Mode = "login" | "signup";

type AuthModalContextValue = {
  open: (mode?: Mode) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  const open = useCallback((m: Mode = "login") => {
    setMode(m);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ open, close }}>
      {children}
      <AuthModal open={isOpen} onClose={close} initialMode={mode} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return ctx;
}
