import { InterfaceScaleContext, type InterfaceScaleContextValue } from "@/contexts/interface-scale-context";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";

/**
 * Interface scale is applied with Electron's native web-frame zoom rather than
 * CSS font-size overrides. Every surface scales together, and the renderer
 * never needs layout-specific hardcoded sizes. The bounds and step are
 * intentionally adjustable constants.
 */
const INTERFACE_SCALE = {
    min: 0.8,
    max: 1.5,
    step: 0.1,
    initial: 1,
    storageKey: "orbit.interfaceScale",
} as const;

function normalize(value: number): number {
    if (!Number.isFinite(value)) return INTERFACE_SCALE.initial;
    const stepped = Math.round(value * 100) / 100;
    return Math.min(INTERFACE_SCALE.max, Math.max(INTERFACE_SCALE.min, stepped));
}

export function InterfaceScaleProvider({ children }: { children: ReactNode }) {
    const [storedScale, setStoredScale] = useLocalStorage<number>(INTERFACE_SCALE.storageKey, INTERFACE_SCALE.initial);
    const scale = normalize(storedScale);

    // Keep the native page zoom in sync with persisted state.
    useEffect(() => {
        window.electron?.webFrame?.setZoomFactor?.(scale);
    }, [scale]);

    const setScale = useCallback((next: number) => setStoredScale(normalize(next)), [setStoredScale]);
    const increase = useCallback(() => setStoredScale((current) => normalize(normalize(current) + INTERFACE_SCALE.step)), [setStoredScale]);
    const decrease = useCallback(() => setStoredScale((current) => normalize(normalize(current) - INTERFACE_SCALE.step)), [setStoredScale]);
    const reset = useCallback(() => setStoredScale(INTERFACE_SCALE.initial), [setStoredScale]);

    // Ctrl/Cmd +, -, and 0 behave like a desktop app's interface zoom.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.shiftKey) || event.altKey) return;

            switch (event.code) {
                case "Equal":
                case "NumpadAdd":
                    event.preventDefault();
                    increase();
                    break;
                case "Minus":
                case "NumpadSubtract":
                    event.preventDefault();
                    decrease();
                    break;
                case "Digit0":
                case "Numpad0":
                    event.preventDefault();
                    reset();
                    break;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [decrease, increase, reset]);

    const value = useMemo<InterfaceScaleContextValue>(
        () => ({
            scale,
            min: INTERFACE_SCALE.min,
            max: INTERFACE_SCALE.max,
            canIncrease: scale < INTERFACE_SCALE.max,
            canDecrease: scale > INTERFACE_SCALE.min,
            increase,
            decrease,
            reset,
            setScale,
        }),
        [decrease, increase, reset, scale, setScale],
    );

    return <InterfaceScaleContext.Provider value={value}>{children}</InterfaceScaleContext.Provider>;
}
