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
- **Technology detection** — Reads `dependencies` and `devDependencies` to detect the stack each project uses, grouped into categories: Languages, Frontend, Backend, Styling, Database / ORM, and Tools.
- **Brand logos** — Every technology is shown with its real logo via [Devicon](https://devicon.dev/) (primary) and [Simple Icons](https://simpleicons.org/) (fallback), bundled locally so icons work fully offline.
- **Overview dashboard** — Project count, distinct technologies, the active directory, and the last scan time at a glance, plus featured projects and top technologies.
- **Project explorer** — Grid or list view with instant search, sorting (name, path, technology count), technology and category filters, and pagination.
- **Technologies explorer** — Browse your stack and jump straight to every project that uses a given technology.
- **Favorites** — Star the projects you use most for quick access.
- **Quick actions** — Open any project in an external editor, open a terminal at its path, reveal it in your file manager, or copy its path.
- **Rescan on demand** — Refresh the workspace whenever you add or change projects.
- **Settings & diagnostics** — See your workspace directory, rescan, and health-check the renderer-to-main-process bridge.
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

| Script | What it does |
| --- | --- |
| `dev` | Run Orbit in development with hot reload |
| `typecheck` | Type-check the main/preload and renderer projects |
| `lint` | Run ESLint with autofix |
| `format` | Format the codebase with Prettier |
| `build` | Type-check, then produce a production build |
| `start` | Preview the production build |
| `build:linux` / `build:mac` / `build:win` | Package a distributable for that platform |
| `build:unpack` | Package an unpacked build (great for testing) |

All scripts work with either `bun run <script>` or `npm run <script>`.

## How it works

Orbit follows a strict separation between the filesystem and the UI.

```
main process (Node)              preload                renderer (React)
─────────────────────            ───────                ────────────────
scanner ──► ipcMain.handle  ──►  contextBridge  ──►  window.api.invoke(...)
            ("projects:scan")     (window.api)          │
                                                        ▼
                                              OrbitProvider ──► views
```

1. **Scan (main process)** — `src/main/scanner` walks your projects directory, parses each `package.json`, matches dependencies against a known technology list, and returns a typed, de-duplicated list of projects. Filesystem access never leaves the main process.
2. **Bridge (preload)** — A single, narrow `window.api.invoke(channel, ...args)` method is exposed through `contextBridge` with `contextIsolation` enabled. There is no `nodeIntegration` in the renderer.
3. **State (renderer)** — `OrbitProvider` loads the snapshot once on mount, derives technology statistics, and drives every view. Rescans keep the last good results on screen if something goes wrong.
4. **Views** — Overview, All Projects, Technologies, Favorites, and Settings render from that single source of truth.

### Where Orbit looks

Orbit scans **`<your home directory>/Projects`** by default. The sidebar shows the active directory, and the Overview shows when the last scan ran. A directory picker is not implemented yet — see [Roadmap](#roadmap).

### Detected technologies

| Category | Technologies |
| --- | --- |
| Languages | JavaScript, TypeScript |
| Frontend | React, Next.js, React Native, Expo |
| Backend | Node.js, Express, NestJS |
| Styling | Tailwind CSS |
| Database / ORM | Prisma, Mongoose, Drizzle |
| Tools | Vite, TanStack Query, TanStack Router, Socket.IO, Electron, electron-vite, Turborepo, Bun, Jest, Vitest, Webpack, esbuild |

Detection is driven entirely by dependencies in `package.json`; Orbit never invents technologies it cannot find.

## Opening projects

From any project card, list row, or the details modal you can:

- **Open in editor** — tries `$VISUAL`/`$EDITOR`, then VS Code, VSCodium, Cursor, Windsurf, Sublime Text (and the macOS app equivalents).
- **Open in terminal** — tries your system's default terminal (`xdg-terminal-exec`, GNOME Terminal, Konsole, Alacritty, Kitty, WezTerm, and more).
- **Reveal in file manager** — opens the project folder in your OS file manager.
- **Copy path** — copies the absolute project path to the clipboard.

External apps are probed in order and the first one found wins, so Orbit adapts to whatever you have installed.

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
│  ├─ ipc/             # Typed IPC handler registration
│  └─ window/          # BrowserWindow creation
├─ preload/            # contextBridge — exposes the narrow window.api
├─ renderer/           # React application
│  └─ src/
│     ├─ app/          # Entry point, shell, and global styles
│     ├─ components/   # Views and UI primitives
│     ├─ contexts/     # Context definitions
│     ├─ providers/    # State providers (Orbit data, toasts)
│     ├─ hooks/        # Reusable hooks (search hotkey, favorites, etc.)
│     ├─ lib/          # Formatting, technology labels, and icon mappings
│     └─ services/     # Renderer-side adapter over the preload bridge
└─ shared/             # Types shared across main, preload, and renderer
```

## Roadmap

- **Configurable projects directory** — the scan root is currently fixed to `~/Projects`; a directory picker and persisted settings are planned.
- **More detected technologies** — the technology list is intentionally data-driven and easy to extend.
- **Deeper project detail** — richer metadata such as scripts, package manager, and last-modified time.
- **Packaging polish** — app icons and installers for distribution.

## License

Not yet specified.
