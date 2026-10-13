# Orbit

**Orbit is a local project workspace for developers.** It scans a directory on your machine, finds every project, figures out the technologies each one uses, and turns all of it into a fast, searchable, offline dark-themed dashboard.

No accounts, no cloud, no telemetry — just a clear view of the code already living on your disk.

---

## Why Orbit?

If you keep dozens of side projects, prototypes, and experiments in one folder, it gets hard to remember what's what. Orbit answers questions like:

- What projects do I have, and where are they?
- Which ones use React, Prisma, Tailwind, or Vite?
- What was I working on most recently?
- Which projects do I keep coming back to?

Everything runs locally and updates whenever you hit rescan.

## Features

- **Automatic project discovery** — Recursively scans your projects directory for `package.json` files, with safe handling for unreadable folders and malformed manifests.
- **Configurable projects directory** — Choose any folder as your scan root with the native OS directory picker. Orbit remembers the choice across restarts and falls back to `~/Projects` when nothing is configured.
- **Workspace awareness** — Detects monorepo/workspace roots (a `package.json` with a `workspaces` field) and groups their member packages, while standalone projects stay in All Projects without duplication.
- **Technology detection** — Reads `dependencies` and `devDependencies` to detect the stack each project uses, grouped into categories: Languages, Frontend, Backend, Styling, Database / ORM, and Tools.
- **Brand logos** — Every technology is shown with its real logo via [Devicon](https://devicon.dev/) (primary) and [Simple Icons](https://simpleicons.org/) (fallback), bundled locally so icons work fully offline.
- **Overview dashboard** — Project count, workspace count, distinct technologies, the active directory, and the last scan time at a glance, plus featured projects, top technologies, and workspace cards.
- **Project explorer** — Grid or list view with instant search, sorting (name, path, technology count), technology and category filters, and pagination. Shows standalone projects only.
- **Workspaces view** — Expandable workspace groups with expand/collapse-all, sorting by workspace name or path, technology/category filters, and grid or list layouts. Members keep the full project card and its actions.
- **Technologies explorer** — Browse your stack and jump straight to every project that uses a given technology.
- **Favorites** — Star the projects you use most for quick access, including projects that live inside a workspace.
- **Quick actions** — Open any project — or an entire workspace root — in an external editor, open a terminal at its path, reveal it in your file manager, or copy its path.
- **Rescan on demand** — Refresh the workspace whenever you add or change projects.
- **Settings** — General (projects directory, rescan, theme), application preferences (editor and terminal, with automatic detection of what is installed), and an About panel.
- **Polished dark UI** — A responsive React + Tailwind interface with skeletons, empty states, and clear error banners.

## Requirements

- **Node.js 20+** — or **[Bun](https://bun.sh/)** (the repo ships a `bun.lock`)
- **Linux, macOS, or Windows** — Electron packaging targets are included for all three

Orbit does not need any global tooling, accounts, or network access at runtime.

## Install

Using Bun (recommended, matches the lockfile):

```bash
bun install
```

Using npm:

```bash
npm install
```

## Development

Start the app with hot reload:

```bash
bun run dev
# or
npm run dev
```

While developing, press `Ctrl/Cmd + K` to focus the search bar.

## Useful scripts

| Script                                    | What it does                                      |
| ----------------------------------------- | ------------------------------------------------- |
| `dev`                                     | Run Orbit in development with hot reload          |
| `typecheck`                               | Type-check the main/preload and renderer projects |
| `lint`                                    | Run ESLint with autofix                           |
| `format`                                  | Format the codebase with Prettier                 |
| `build`                                   | Type-check, then produce a production build       |
| `start`                                   | Preview the production build                      |
| `build:linux` / `build:mac` / `build:win` | Package a distributable for that platform         |
| `build:arch`                              | Package a Pacman package for Arch Linux           |
| `build:unpack`                            | Package an unpacked build (great for testing)     |

All scripts work with either `bun run <script>` or `npm run <script>`.

## How it works

Orbit follows a strict separation between the filesystem and the UI.

```
main process (Node)                 preload                renderer (React)
─────────────────────               ───────                ────────────────
scanner + settings ──► ipcMain.handle  ──►  contextBridge  ──►  window.api.invoke(...)
+ launcher            ("projects:scan",      (window.api)          │
                       "project:open",                             ▼
                       "launcher:list",                    OrbitProvider ──► views
                       "settings:*",
                       "app:get-info",
                       "system:open-external",
                       "dialog:pick-directory")
```

1. **Scan (main process)** — `src/main/scanner` walks your projects directory (the saved selection, or `~/Projects` by default), parses each `package.json`, matches dependencies against a known technology list, and detects workspace roots. Member packages are grouped under their closest workspace; everything else is returned as a standalone project. Filesystem access never leaves the main process.
2. **Settings & launch (main process)** — `src/main/settings` persists your projects root and your editor/terminal preferences to a small JSON file under the app's user-data directory and validates them before saving. `src/main/launcher` holds the catalogue of known editors and terminals, checks which are actually installed (including Flatpak and Snap wrappers), and builds the correct arguments for each. `src/main/scanner/project-actions.ts` spawns the chosen application directly — never through a shell.
3. **Bridge (preload)** — A single, narrow `window.api.invoke(channel, ...args)` method is exposed through `contextBridge` with `contextIsolation` enabled. There is no `nodeIntegration` in the renderer.
4. **State (renderer)** — `OrbitProvider` loads the projects root and the snapshot once on mount, derives technology statistics and the combined project list (standalone + workspace members), and drives every view. Rescans keep the last good results on screen if something goes wrong.
5. **Views** — Overview, All Projects, Workspaces, Technologies, Favorites, and Settings render from that single source of truth.

### Where Orbit looks

Orbit scans **`<your home directory>/Projects`** by default. Open **Settings → Projects directory → Change folder** to pick any other folder with the native OS directory picker; the sidebar card links straight to that setting.

The selection is saved under the app's user-data directory (for example `~/.config/orbit/settings.json` on Linux) and restored on the next launch, so you only choose once. The current root — and whether it is the **Default** or a **Custom** choice — is shown in both the sidebar and Settings.

If a saved folder is later moved, renamed, or deleted, Orbit marks it **Unavailable**, explains what happened, and offers to pick another folder instead of failing silently. Rescans always read the currently selected root.

### Detected technologies

| Category       | Technologies                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Languages      | JavaScript, TypeScript                                                                                                    |
| Frontend       | React, Next.js, React Native, Expo                                                                                        |
| Backend        | Node.js, Express, NestJS                                                                                                  |
| Styling        | Tailwind CSS                                                                                                              |
| Database / ORM | Prisma, Mongoose, Drizzle                                                                                                 |
| Tools          | Vite, TanStack Query, TanStack Router, Socket.IO, Electron, electron-vite, Turborepo, Bun, Jest, Vitest, Webpack, esbuild |

Detection is driven entirely by dependencies in `package.json`; Orbit never invents technologies it cannot find.

## Opening projects and workspaces

From any project card, list row, or the details modal you can open a single project. Each workspace group in the Workspaces view offers the same actions against the workspace root:

- **Open in editor** — uses the editor chosen in **Settings → Applications**, or auto-detects `$VISUAL`/`$EDITOR`, then VS Code, VSCodium, Cursor, Windsurf, Zed, Sublime Text (and the macOS app equivalents).
- **Open in terminal** — uses the terminal chosen in Settings, or auto-detects your system's default terminal (`xdg-terminal-exec`, GNOME Terminal, Konsole, Kitty, Alacritty, WezTerm, and more), passing the correct working-directory flag for each.
- **Reveal in file manager** — opens the project or workspace folder in your OS file manager. Orbit uses the system default here rather than a configurable choice.
- **Copy path** — copies the absolute path to the clipboard.

### Choosing editors and terminals

Open **Settings → Applications** to pick a preferred editor and terminal. Orbit probes your `PATH` (and Flatpak/Snap wrapper locations) and marks what it finds, so you can see at a glance what is installed. Each preference can be left on **Auto-detect** (Orbit's built-in probing order, the default), set to a detected application, or pointed at a **custom command**.

Custom commands are tokenized in the main process and spawned directly with `shell: false`, so arguments such as `code --wait` work without Orbit ever constructing a shell string. If a configured application is missing or fails to launch, Orbit tells you which one and points you back to Settings rather than silently opening something else.

## Tech stack

- **Electron** + **electron-vite** for the desktop shell and builds
- **React 19** + **TypeScript** for the UI
- **Tailwind CSS v4** with a custom dark design system
- **lucide-react** for interface icons
- **Devicon** + **Simple Icons** for technology logos

## Project structure

```
src/
├─ main/               # Electron main process
│  ├─ scanner/         # Project scanning, tech detection, and open-project actions
│  ├─ launcher/        # Editor/terminal catalogue, availability detection, and argument building
│  ├─ settings/        # JSON persistence for the projects root and app preferences
│  ├─ ipc/             # Typed IPC handler registration
│  └─ window/          # BrowserWindow creation
├─ preload/            # contextBridge — exposes the narrow window.api
├─ renderer/           # React application
│  └─ src/
│     ├─ app/          # Entry point and global styles
│     ├─ components/   # Views and UI primitives
│     ├─ contexts/     # Context definitions
│     ├─ providers/    # State providers (Orbit data, toasts)
│     ├─ hooks/        # Reusable hooks (search hotkey, favorites, etc.)
│     ├─ lib/          # Formatting, technology labels, and icon mappings
│     └─ services/     # Renderer-side adapter over the preload bridge
└─ shared/             # Types shared across main, preload, and renderer
```

## Roadmap

- **More detected technologies** — the technology list is intentionally data-driven and easy to extend.
- **Deeper project detail** — richer metadata such as scripts, package manager, and last-modified time.
- **Packaging polish** — app icons and installers for distribution.

## License

Not yet specified.
