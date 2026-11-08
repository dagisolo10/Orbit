import { cn } from "@/lib/utils";
import type { ServerLogLine, ServerLogStream } from "@shared/types/server";
import { ArrowDownToLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const STREAM_META: Record<ServerLogStream, { label: string; dot: string; text: string }> = {
    stdout: { label: "OUT", dot: "bg-ok/70", text: "text-ink-soft" },
    stderr: { label: "ERR", dot: "bg-danger", text: "text-danger/90" },
    system: { label: "SYS", dot: "bg-accent", text: "text-accent/90" },
};

/**
 * A read-only, terminal-like view of one server's output.
 *
 * Lines arrive from the main process already stripped of ANSI escapes. The
 * panel follows new output automatically while the user is at the bottom, and
 * pauses that behaviour as soon as they scroll up to read something.
 */
export function ServerTerminal({ lines, emptyHint }: { lines: ServerLogLine[]; emptyHint?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(true);

    useEffect(() => {
        if (!stuck) return;
        const element = containerRef.current;
        if (element) element.scrollTop = element.scrollHeight;
    }, [lines, stuck]);

    const onScroll = useCallback(() => {
        const element = containerRef.current;
        if (!element) return;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        setStuck(distanceFromBottom < 48);
    }, []);

    const jumpToLatest = useCallback(() => {
        const element = containerRef.current;
        if (element) element.scrollTop = element.scrollHeight;
        setStuck(true);
    }, []);

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div
                ref={containerRef}
                onScroll={onScroll}
                className="min-h-0 flex-1 overflow-y-auto bg-panel-inset py-2 font-mono text-[11px] leading-relaxed"
                role="log"
                aria-live="polite"
            >
                {lines.length === 0 ? (
                    <div className="dot-grid flex h-full min-h-32 flex-col items-center justify-center gap-1.5 px-4 text-center">
                        <p className="label-mono text-ink-muted">
                            <span className="text-accent">{"//"}</span> NO OUTPUT
                        </p>
                        <p className="max-w-sm text-[11px] text-ink-muted/80">{emptyHint ?? "No output yet."}</p>
                    </div>
                ) : (
                    lines.map((line) => <LogRow key={line.seq} line={line} />)
                )}
            </div>

            {!stuck && lines.length > 0 ? (
                <button
                    type="button"
                    onClick={jumpToLatest}
                    className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-[2px] border border-line-strong bg-panel-raised/95 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.08em] text-ink uppercase shadow-lg backdrop-blur transition-colors hover:border-accent/60 hover:text-ink focus-visible:ring-1 focus-visible:ring-accent"
                >
                    <ArrowDownToLine className="size-3" strokeWidth={1.9} />
                    Jump to latest
                </button>
            ) : null}
        </div>
    );
}

function LogRow({ line }: { line: ServerLogLine }) {
    const isError = line.stream === "system" && line.text.startsWith("✖");
    const meta = STREAM_META[line.stream];
    const tone = isError ? "text-danger/90" : meta.text;

    return (
        <div className="group grid grid-cols-[34px_30px_minmax(0,1fr)] items-start gap-2 px-3 py-0.5 transition-colors hover:bg-white/[0.025]">
            <span className="text-right text-[9px] leading-[1.65] text-ink-muted/50 tabular-nums select-none">{String(line.seq).padStart(3, "0")}</span>
            <span className={cn("flex items-center gap-1 text-[8px] leading-[1.85] tracking-[0.08em]", isError ? "text-danger/80" : "text-ink-muted/70")}>
                <span aria-hidden className={cn("size-1 rounded-[0.5px]", isError ? "bg-danger" : meta.dot)} />
                {meta.label}
            </span>
            <p className={cn("whitespace-pre-wrap break-words", tone)}>{line.text.length > 0 ? line.text : "\u00A0"}</p>
        </div>
    );
}
