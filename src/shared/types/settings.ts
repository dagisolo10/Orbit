/**
 * The effective projects root Orbit will scan, plus enough context for the
 * renderer to explain and change the selection.
 *
 * The main process owns the value: it is persisted next to the app's user
 * data and resolved on every scan, so the renderer never needs to pass a path
 * back in to trigger a scan.
 */
export type ProjectsRootState = {
    /** The directory Orbit will scan. Always an absolute path. */
    path: string;
    /** True when the root came from a saved user selection rather than the default. */
    isCustom: boolean;
    /** True when `path` exists and is a readable directory. */
    available: boolean;
    /** The platform default (`<home>/Projects`), used to describe the fallback. */
    defaultPath: string;
};

/** The launch actions Orbit can perform. File managers use the OS default for now. */
export type LaunchKind = "editor" | "terminal";

/** How a launcher was installed, surfaced so the UI can explain variations. */
export type LaunchSource = "native" | "flatpak" | "snap";

/**
 * A detected (or well-known) application Orbit can launch. `command` is the
 * resolved executable when available; otherwise it is the canonical command the
 * preset would use. The main process re-resolves it at launch time.
 */
export type LaunchAppOption = {
    id: string;
    label: string;
    command: string;
    available: boolean;
    source: LaunchSource;
};

export type LaunchAppCatalog = {
    editors: LaunchAppOption[];
    terminals: LaunchAppOption[];
};

/**
 * A saved launcher choice.
 *
 * - `auto` keeps Orbit's built-in probing behavior (the safe default).
 * - `preset` references a catalog entry by id.
 * - `custom` holds a raw command line that is tokenized in the main process and
 *   spawned without a shell, so no input is ever interpolated into a shell.
 */
export type LaunchPreference = { mode: "auto" } | { mode: "preset"; id: string } | { mode: "custom"; command: string };

export type LaunchPreferences = {
    editor: LaunchPreference;
    terminal: LaunchPreference;
};

/** Basic app metadata for the About section. */
export type AppInfo = {
    name: string;
    version: string;
};
