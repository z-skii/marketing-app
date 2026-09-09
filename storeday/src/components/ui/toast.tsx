"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Toast = { id: number; message: string; tone: "success" | "danger" | "neutral" };
const ToastContext = React.createContext<{ push: (message: string, tone?: Toast["tone"]) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((message: string, tone: Toast["tone"] = "neutral") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn("fade-in rounded-md border px-3 py-2 text-[13px] shadow-lg bg-surface",
            t.tone === "success" && "border-success/40 text-success", t.tone === "danger" && "border-danger/40 text-danger", t.tone === "neutral" && "border-border text-text")}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  return ctx ?? { push: () => {} };
}
