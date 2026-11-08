import { useSearchHotkey } from "@/hooks/use-hot-keys";
import { useCallback, useRef, useState } from "react";

/**
 * Search terms are kept per view for the lifetime of the session so switching
 * tabs does not discard a view's own search. They are not persisted to disk.
 */
const sessionQueries = new Map<string, string>();

/**
 * Per-view search state. The hotkey always targets the search field of the
 * view that is currently mounted.
 */
export function useViewSearch(key: string) {
    const [query, setQueryState] = useState(() => sessionQueries.get(key) ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    useSearchHotkey(
        useCallback(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, []),
    );

    const setQuery = useCallback(
        (value: string) => {
            sessionQueries.set(key, value);
            setQueryState(value);
        },
        [key],
    );

    const clearSearch = useCallback(() => setQuery(""), [setQuery]);

    return { query, setQuery, inputRef, clearSearch };
}
