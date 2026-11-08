import { useOrbit } from "@/contexts/orbit-context";
import { cn } from "@/lib/utils";
import { VIEW_META, type ViewId } from "@/types/navigation";
import { RefreshCw } from "lucide-react";

export function TopBar({ view }: { view: ViewId }) {
    const { reScan, reScanning } = useOrbit();
    const meta = VIEW_META[view];

    return (
        <header className="relative z-30 flex h-12 shrink-0 items-center gap-3 border-b border-line bg-bg px-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden className="size-1.5 shrink-0 bg-accent" />
                <span className="font-mono text-[9px] tracking-[0.1em] text-ink-muted tabular-nums">{meta.index}</span>
                <span aria-hidden className="h-3 w-px shrink-0 bg-line" />
                <span className="truncate text-[12px] font-medium tracking-[-0.005em] text-ink">{meta.label}</span>
                <span className="hidden truncate font-mono text-[9px] tracking-[0.16em] text-ink-muted/70 uppercase sm:inline">{meta.section}</span>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={reScan}
                    disabled={reScanning}
                    title={reScanning ? "Scanning workspace" : "Re-scan workspace"}
                    className={cn(
                        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[2px] border px-2 font-mono text-[10px] tracking-[0.08em] uppercase outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60",
                        reScanning ? "border-accent/40 bg-accent/10 text-accent" : "border-line bg-panel text-ink-soft hover:border-line-strong hover:text-ink",
                    )}
                >
                    <RefreshCw className={cn("size-3", reScanning && "animate-spin")} strokeWidth={1.9} />
                    <span className="hidden sm:inline">{reScanning ? "Scanning" : "Rescan"}</span>
                </button>
            </div>
        </header>
    );
}
