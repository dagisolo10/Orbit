import { createContext, useContext } from "react";

export type ToastTone = "info" | "success" | "error";

export type ToastInput = {
    title: string;
    description?: string;
    tone?: ToastTone;
};

export type ToastRecord = ToastInput & { id: string; tone: ToastTone };

export type ToastContextValue = {
    toast: (input: ToastInput) => void;
    dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used inside a <ToastProvider>.");
    return context;
}
