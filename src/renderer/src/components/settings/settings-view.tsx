import { Button } from "@/components/ui/button";
import { useOrbit } from "@/contexts/orbit-context";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { probeBridge, type BridgeProbe, type OrbitError } from "@/services/orbit";
import { CircleCheck, Cpu, FolderOpen, MonitorSmartphone, Palette, RefreshCw, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type ProbeState = { status: "loading" } | { status: "ok"; value: BridgeProbe } | { status: "error"; error: OrbitError };

export function SettingsView() {
    const { snapshot, reScan, reScanning, status, projects } = useOrbit();
    const [probe, setProbe] = useState<ProbeState>({ status: "loading" });

    const runProbe = useCallback(() => {
        setProbe({ status: "loading" });
        void probeBridge().then((result) => {
            setProbe(result.ok ? { status: "ok", value: result.value } : { status: "error", error: result.error });
        });
    }, []);

    useEffect(() => {
        runProbe();
    }, [runProbe]);

    const versions = typeof window !== "undefined" ? window.electron?.process.versions : undefined;
    const platform = typeof window !== "undefined" ? window.electron?.process.platform : undefined;
    const rootPath = snapshot?.rootPath ?? null;

    const scannerValue = status === "loading" ? "Scanning…" : status === "error" ? "Not connected" : pluralize(projects.length, "project");

    const runtime = [
        { label: "Electron", value: versions?.["electron"] },
        { label: "Chromium", value: versions?.["chrome"] },
        { label: "Node.js", value: versions?.["node"] },
    ];

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <SettingSection title="Workspace" description="Where Orbit looks for projects and how it scans them.">
                <SettingRow
                    icon={FolderOpen}
                    label="Projects directory"
                    value={rootPath ?? "Not configured"}
                    mono={Boolean(rootPath)}
                    action={
                        <Button variant="secondary" size="sm" disabled title="Requires settings:get and settings:set IPC handlers">
                            Change directory
                        </Button>
                    }
                />
                <SettingRow
                    icon={ShieldCheck}
                    label="Scanner"
                    value={scannerValue}
                    action={
                        <Button variant="secondary" size="sm" onClick={reScan} disabled={reScanning}>
                            <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                            {reScanning ? "Scanning…" : "Rescan"}
                        </Button>
                    }
                />
            </SettingSection>

            <SettingSection title="Appearance" description="Orbit renders a dark workspace tuned for long sessions.">
                <SettingRow
                    icon={Palette}
                    label="Theme"
                    value="Dark"
                    action={<span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Active</span>}
                />
                <SettingRow
                    icon={Palette}
                    label="Follow system appearance"
                    value="Not implemented"
                    action={
                        <Button variant="secondary" size="sm" disabled>
                            Planned
                        </Button>
                    }
                />
            </SettingSection>

            <SettingSection title="Diagnostics" description="Status of the renderer to main-process bridge.">
                <div className="flex items-center gap-3 px-4 py-3">
                    <span
                        className={cn(
                            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                            probe.status === "ok"
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : probe.status === "error"
                                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                                  : "border-white/8 bg-white/3 text-muted-foreground",
                        )}
                    >
                        {probe.status === "ok" ? (
                            <CircleCheck className="size-4" strokeWidth={1.9} />
                        ) : probe.status === "error" ? (
                            <TriangleAlert className="size-4" strokeWidth={1.9} />
                        ) : (
                            <ShieldCheck className="size-4" strokeWidth={1.9} />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground">Preload bridge</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {probe.status === "loading" ? "Running health check…" : probe.status === "ok" ? `ipc:check responded in ${probe.value.latencyMs} ms` : probe.error.message}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={runProbe} disabled={probe.status === "loading"}>
                        <RefreshCw className={cn("size-3.5", probe.status === "loading" && "animate-spin")} />
                        Run check
                    </Button>
                </div>

                <div className="grid gap-2 px-4 py-3 sm:grid-cols-3">
                    {runtime.map((item) => (
                        <div key={item.label} className="rounded-lg border border-white/6 bg-white/2 px-3 py-2">
                            <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
                                <Cpu className="size-3" />
                                {item.label}
                            </p>
                            <p className="mt-1 font-mono text-[13px] text-foreground">{item.value ?? "—"}</p>
                        </div>
                    ))}
                </div>

                <SettingRow
                    icon={MonitorSmartphone}
                    label="Platform"
                    value={platform ?? "unknown"}
                    mono
                    action={
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                void window.electron?.ipcRenderer.invoke("ipc:check");
                            }}
                            title="Ping the existing ipc:check channel"
                        >
                            Ping main
                        </Button>
                    }
                />
            </SettingSection>
        </div>
    );
}

function SettingSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-white/1.5">
            <div className="border-b border-white/6 px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
            </div>
            <div className="divide-y divide-white/6">{children}</div>
        </section>
    );
}

function SettingRow({ icon: Icon, label, value, mono, action }: { icon: LucideIcon; label: string; value: ReactNode; mono?: boolean; action?: ReactNode }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-muted-foreground">
                <Icon className="size-4" strokeWidth={1.85} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{label}</p>
                <p className={cn("truncate text-xs text-muted-foreground", mono && "font-mono")} title={typeof value === "string" ? value : undefined}>
                    {value}
                </p>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
