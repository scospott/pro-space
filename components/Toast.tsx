"use client";

import { useEffect } from "react";
import { create } from "zustand";

type ToastState = {
  message: string | null;
  seq: number;
  show: (message: string) => void;
  hide: () => void;
};

export const useToast = create<ToastState>((set) => ({
  message: null,
  seq: 0,
  show: (message) => set((s) => ({ message, seq: s.seq + 1 })),
  hide: () => set({ message: null }),
}));

export function Toast() {
  const message = useToast((s) => s.message);
  const seq = useToast((s) => s.seq);
  const hide = useToast((s) => s.hide);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(hide, 3200);
    return () => window.clearTimeout(t);
  }, [message, seq, hide]);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[92px] z-50 flex justify-center px-6">
      {message ? (
        <div className="max-w-[90vw] truncate rounded-full bg-ink px-[18px] py-3 font-medium text-white shadow-lg">
          {message}
        </div>
      ) : null}
    </div>
  );
}
