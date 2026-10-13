import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const raw = window.localStorage.getItem(key);
            return raw === null ? initialValue : (JSON.parse(raw) as T);
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage unavailable — fall back to in-memory state only.
        }
    }, [key, value]);

    return [value, setValue];
}
