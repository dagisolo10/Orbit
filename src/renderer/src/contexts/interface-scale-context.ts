import { createContext, useContext } from "react";

export type InterfaceScaleContextValue = {
    /** Current native zoom factor, e.g. 1.1 for 110%. */
    scale: number;
    min: number;
    max: number;
    canIncrease: boolean;
    canDecrease: boolean;
    reset: () => void;
    increase: () => void;
    decrease: () => void;
    setScale: (scale: number) => void;
};

export const InterfaceScaleContext = createContext<InterfaceScaleContextValue | null>(null);

export function useInterfaceScale(): InterfaceScaleContextValue {
    const context = useContext(InterfaceScaleContext);
    if (!context) throw new Error("useInterfaceScale must be used inside an <InterfaceScaleProvider>.");
    return context;
}
