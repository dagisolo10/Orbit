import { cn } from "@/lib/utils";
import type { ServerLogLine, ServerLogStream } from "@shared/types/server";
import { ArrowDownToLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const STREAM_CLASS: Record<ServerLogStream, string> = {
    stdout: "text-foreground/85",
    stderr: "text-red-300/90",
    system: "text-primary/85",
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
            <div ref={containerRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto bg-black/25 px-4 py-3 font-mono text-xs leading-relaxed" role="log" aria-live="polite">
                {lines.length === 0 ? <p className="text-muted-foreground/55">{emptyHint ?? "No output yet."}</p> : lines.map((line) => <LogRow key={line.seq} line={line} />)}
            </div>

            {!stuck && lines.length > 0 ? (
                <button
                    type="button"
                    onClick={jumpToLatest}
                    className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-popover/95 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-popover"
                >
                    <ArrowDownToLine className="size-3.5" strokeWidth={1.9} />
                    Jump to latest
                </button>
            ) : null}
        </div>
    );
}

function LogRow({ line }: { line: ServerLogLine }) {
    const isError = line.stream === "system" && line.text.startsWith("✖");
    const className = isError ? "text-red-300/90" : STREAM_CLASS[line.stream];
    return <p className={cn("whitespace-pre-wrap break-words", className)}>{line.text.length > 0 ? line.text : "\u00A0"}</p>;
}
