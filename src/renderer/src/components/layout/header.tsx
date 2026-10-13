import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { useOrbit } from "@/contexts/orbit-context";
import { VIEW_META, type ViewId } from "@/types/navigation";
import { RefreshCw, Search, X } from "lucide-react";
import type { RefObject } from "react";

export function Header({ view, searchRef }: { view: ViewId; searchRef: RefObject<HTMLInputElement | null> }) {
    const { query, setQuery, reScan, reScanning } = useOrbit();
    const isMac = typeof window !== "undefined" && window.electron?.process.platform === "darwin";
    const meta = VIEW_META[view];
    // Search only filters the list views; Overview (a dashboard) and Settings ignore it.
    const showSearch = view === "projects" || view === "workspaces" || view === "technologies" || view === "favorites";

    return (
        <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{meta.title}</h1>
                <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
            </div>

            {showSearch ? (
                <div className="relative hidden w-full max-w-sm items-center md:flex">
                    <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.9} />
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search projects or paths…"
                        spellCheck={false}
                        aria-label="Search projects"
                        className="h-9 w-full rounded-lg border border-white/8 bg-white/3 pr-16 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-white/5 focus:ring-2 focus:ring-ring/40"
                    />
                    <span className="absolute right-2.5 flex items-center gap-1">
                        {query ? (
                            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-muted-foreground transition-colors hover:text-foreground">
                                <X className="size-3.5" />
                            </button>
                        ) : (
                            <>
                                <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                                <Kbd>K</Kbd>
                            </>
                        )}
                    </span>
                </div>
            ) : null}

            <div className="flex shrink-0 items-center gap-3">
                {reScanning ? (
                    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" aria-live="polite">
                        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                        Scanning…
                    </span>
                ) : null}
                <IconButton
                    icon={RefreshCw}
                    label={reScanning ? "Scanning…" : "Re-scan workspace"}
                    side="bottom"
                    onClick={reScan}
                    disabled={reScanning}
                    className={reScanning ? "animate-spin" : undefined}
                />
            </div>
        </header>
    );
}
