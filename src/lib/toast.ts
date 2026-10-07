import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  add: (message: string, variant: ToastVariant, duration?: number) => void;
  dismiss: (id: string) => void;
}

// Monotonic id counter — avoids Math.random()/Date.now() and stays unique.
let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (message, variant, duration = 4000) => {
    seq += 1;
    const id = `toast-${seq}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Imperative toast API usable outside React (e.g. inside mutation callbacks).
 * Reads the store via getState() so it works anywhere.
 */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().add(message, "success", duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().add(message, "error", duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().add(message, "info", duration),
};
