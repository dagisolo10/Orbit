import { cn } from "@/lib/utils";
import { Check, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type DropdownItem =
    | { type: "separator"; id?: string }
    | {
          type?: "item";
          id: string;
          label: string;
          icon?: LucideIcon;
          hint?: string;
          disabled?: boolean;
          danger?: boolean;
          checked?: boolean;
          onSelect?: () => void;
      };

type DropdownProps = {
    items: DropdownItem[];
    label: string;
    align?: "start" | "end";
    side?: "bottom" | "top";
    header?: ReactNode;
    className?: string;
    panelClassName?: string;
    renderTrigger: (props: { open: boolean; onClick: (event: MouseEvent) => void; "aria-expanded": boolean; "aria-haspopup": "menu"; "aria-label": string }) => ReactNode;
};

export function Dropdown({ items, label, align = "start", side = "bottom", header, className, panelClassName, renderTrigger }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);

    useLayoutEffect(() => {
        if (!open) {
            setCoords(null);
            return;
        }

        const reposition = () => {
            const trigger = wrapperRef.current?.getBoundingClientRect();
            const panel = panelRef.current?.getBoundingClientRect();
            if (!trigger || !panel) return;

            let left = align === "end" ? trigger.right - panel.width : trigger.left;
            left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - panel.width - 8));

            const preferredTop = side === "bottom" ? trigger.bottom + 6 : trigger.top - panel.height - 6;
            const top = Math.min(Math.max(8, preferredTop), Math.max(8, window.innerHeight - panel.height - 8));

            setCoords({ top, left });
        };

        reposition();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [open, align, side]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: Event) => {
            const target = event.target as Node;
            if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) return;
            close();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open, close]);

    return (
        <span ref={wrapperRef} className={cn("relative inline-flex", className)}>
            {renderTrigger({
                open,
                "aria-expanded": open,
                "aria-haspopup": "menu",
                "aria-label": label,
                onClick: (event) => {
                    event.stopPropagation();
                    setOpen((value) => !value);
                },
            })}

            {open
                ? createPortal(
                      <div
                          ref={panelRef}
                          role="menu"
                          aria-label={label}
                          style={{ top: coords?.top ?? -9999, left: coords?.left ?? -9999 }}
                          className={cn(
                              "fixed z-90 min-w-48 overflow-hidden rounded-xl border border-white/10 bg-popover/95 p-1 text-sm shadow-2xl shadow-black/50 backdrop-blur-xl",
                              !coords && "invisible",
                              panelClassName,
                          )}
                      >
                          {header}
                          {items.map((item, index) =>
                              item.type === "separator" ? (
                                  <div key={item.id ?? `separator-${index}`} role="separator" className="my-1 h-px bg-white/8" />
                              ) : (
                                  <button
                                      key={item.id}
                                      type="button"
                                      role="menuitem"
                                      disabled={item.disabled}
                                      onClick={() => {
                                          item.onSelect?.();
                                          close();
                                      }}
                                      className={cn(
                                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                          item.danger ? "text-red-300 hover:bg-red-500/10 enabled:focus-visible:bg-red-500/10" : "text-foreground/90 hover:bg-white/8 enabled:focus-visible:bg-white/8",
                                      )}
                                  >
                                      {item.icon ? <item.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} /> : <span className="size-4 shrink-0" />}
                                      <span className="flex-1 truncate">{item.label}</span>
                                      {item.hint ? <span className="shrink-0 text-[11px] text-muted-foreground/70">{item.hint}</span> : null}
                                      {item.checked ? <Check className="size-3.5 shrink-0 text-primary" strokeWidth={2.5} /> : null}
                                  </button>
                              ),
                          )}
                      </div>,
                      document.body,
                  )
                : null}
        </span>
    );
}
