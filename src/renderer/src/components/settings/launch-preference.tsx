import { SettingRow } from "@/components/settings/setting-row";
import { Button } from "@/components/ui/button";
import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import type { LaunchAppOption, LaunchKind, LaunchPreference } from "@shared/types/settings";
import { Check, ChevronDown, SquarePen, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

const SOURCE_LABEL: Record<LaunchAppOption["source"], string> = {
    native: "Native",
    flatpak: "Flatpak",
    snap: "Snap",
};

export function preferenceLabel(preference: LaunchPreference, options: LaunchAppOption[]): string {
    if (preference.mode === "auto") return "Auto-detect";
    if (preference.mode === "preset") return options.find((option) => option.id === preference.id)?.label ?? preference.id;
    return preference.command;
}

export function LaunchPreferenceSetting({
    icon,
    label,
    kind,
    options,
    preference,
    saving,
    onChange,
}: {
    icon: LucideIcon;
    label: string;
    kind: LaunchKind;
    options: LaunchAppOption[];
    preference: LaunchPreference;
    saving: boolean;
    onChange: (preference: LaunchPreference) => Promise<boolean>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(preference.mode === "custom" ? preference.command : "");

    useEffect(() => {
        if (preference.mode === "custom") setDraft(preference.command);
    }, [preference]);

    const items: DropdownItem[] = [
        { id: "auto", label: "Auto-detect", hint: "Recommended", checked: preference.mode === "auto", onSelect: () => void onChange({ mode: "auto" }) },
        { type: "separator", id: "sep-detected" },
        ...options.map<DropdownItem>((option) => ({
            id: option.id,
            label: option.label,
            hint: option.available ? SOURCE_LABEL[option.source] : "Not installed",
            disabled: !option.available,
            checked: preference.mode === "preset" && preference.id === option.id,
            onSelect: () => void onChange({ mode: "preset", id: option.id }),
        })),
        { type: "separator", id: "sep-custom" },
        {
            id: "custom",
            label: "Custom command…",
            icon: SquarePen,
            checked: preference.mode === "custom",
            onSelect: () => setEditing(true),
        },
    ];

    const submitCustom = async () => {
        const command = draft.trim();
        if (command.length === 0) return;
        const saved = await onChange({ mode: "custom", command });
        if (saved) setEditing(false);
    };

    return (
        <>
            <SettingRow
                icon={icon}
                label={label}
                value={preferenceLabel(preference, options)}
                mono={preference.mode === "custom"}
                action={
                    <Dropdown
                        label={`Choose ${label.toLowerCase()}`}
                        align="end"
                        items={items}
                        renderTrigger={(props) => (
                            <Button variant="secondary" size="sm" disabled={saving} {...props}>
                                <ChevronDown className={cn("size-3.5 transition-transform", props.open && "rotate-180")} strokeWidth={1.9} />
                                {saving ? "Saving…" : "Change"}
                            </Button>
                        )}
                    />
                }
            />
            {editing ? (
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") void submitCustom();
                                if (event.key === "Escape") setEditing(false);
                            }}
                            placeholder={kind === "editor" ? "code --wait" : "kitty --directory"}
                            spellCheck={false}
                            autoFocus
                            className="h-9 w-full rounded-lg border border-white/8 bg-white/3 px-3 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-white/5 focus:ring-2 focus:ring-ring/40"
                        />
                        <Button size="sm" variant="primary" onClick={() => void submitCustom()} disabled={saving || draft.trim().length === 0}>
                            <Check className="size-3.5" strokeWidth={2.2} />
                            Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                            Cancel
                        </Button>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        {kind === "editor" ? "Orbit appends the project path as the final argument." : "Orbit runs this command with the project folder as the working directory."} The command is
                        spawned directly — never through a shell.
                    </p>
                </div>
            ) : null}
        </>
    );
}
