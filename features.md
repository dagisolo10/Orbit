# Orbit — Feature Tracker

> A personal desktop developer workspace for discovering, organizing, and managing local projects.
>
> **Status key:** `[x]` Finished · `[ ]` Unfinished · `[?]` Needs verification

## 1. Finished

### Project Discovery

- [x] Recursively scan a selected projects directory.
- [x] Discover JavaScript/TypeScript projects using `package.json`.
- [x] Exclude irrelevant directories, including `node_modules`, `.next`, `.expo`, `dist`, `out`, and `Git Clones`.
- [x] Extract project names, paths, and detected technologies.
- [x] Handle projects with missing dependency fields.
- [x] Detect technologies from dependencies and devDependencies.
- [x] Organize detected technologies into categories.

### Technology Detection

- [x] Detect the frameworks and tools represented in the current technology registry.
- [x] Support categories such as languages, frontend, backend, styling, database/ORM, and tools.

### Renderer

- [x] Build the initial dark-themed project management interface.
- [x] Add actions to open a project in:
    - Terminal
    - Code editor
    - File manager
- [x] Search projects by name and path.

## 2. Unfinished / To Verify

### Project Explorer

- [ ] Verify grid and list views work correctly.
- [ ] Implement or verify pagination.
    - Grid: 12 projects per page initially.
    - List: 24 projects per page initially.
    - Future page-size options: 12, 24, and 48.
- [ ] Verify sorting and filtering work together with search.
- [ ] Add favorites and a dedicated favorites view.
- [ ] Add useful empty, error, and retry states.

### Scanner and Data Model

- [ ] Verify the renderer-specific scanner is isolated from the original scanner.
- [ ] Ensure repeated scans don't accumulate duplicate results.
- [ ] Handle unreadable directories and malformed package.json files safely.
- [ ] Improve language detection, including JavaScript inference.
- [ ] Refine Node.js detection so it isn't inferred only from backend frameworks.
- [ ] Add other ecosystems later: Rust, Python, Java, and others.
- [ ] Add monorepo/Turborepo awareness later; don't prioritize it yet.

### Electron Integration

- [ ] Verify the scan IPC handler and preload API use the existing secure architecture.
- [ ] Verify initial loading skeletons display while scanning.
- [ ] Verify manual rescans preserve existing results until the new scan succeeds.
- [ ] Verify type checks and production builds pass.

### Technology Logos

- [ ] Integrate framework and language logos.
- [ ] Prefer locally bundled icons so Orbit works offline.
- [ ] Use Devicon as the primary source and Simple Icons for missing logos.
- [ ] Map existing technology IDs to their correct icons.
- [ ] Add a fallback icon for unsupported technologies.

## 3. Git Integration

The goal is to make Orbit a useful Git workspace without needing to run every Git command manually.

### Repository Overview

- [ ] Detect whether a project is a Git repository.
- [ ] Display the current branch.
- [ ] Show whether the working tree has uncommitted changes.
- [ ] Show ahead/behind status when available.
- [ ] Display the latest commit summary.

### Git History and Changes

- [ ] View commit history.
- [ ] Inspect commit details and diffs.
- [ ] View changed, staged, and untracked files.
- [ ] Inspect file-level diffs.
- [ ] Stage and unstage changes.
- [ ] Commit changes with a message.

### Branch Management

- [ ] List local branches.
- [ ] Switch branches.
- [ ] Create branches.
- [ ] Show the active branch clearly.
- [ ] Handle Git errors and unsafe operations gracefully.

## 4. Dependencies and Package Management

- [ ] Display project dependencies and devDependencies.
- [ ] Identify the package manager.
- [ ] Display package scripts from package.json.
- [ ] Run scripts from Orbit.
- [ ] Provide a convenient way to install dependencies.
- [ ] Detect missing dependencies or common setup problems.

## 5. Development Workflow

- [ ] Display project scripts and allow running them.
- [ ] Show running development processes.
- [ ] Display relevant ports and running servers.
- [ ] Restart a backend or development server.
- [ ] Stop selected processes or stop all managed processes.
- [ ] View process output and logs.
- [ ] Make frequently used project actions accessible from the project card.

## 6. Reusable Templates and Scaffolding

- [ ] Create reusable project architecture templates.
- [ ] Save an existing project's structure as a template.
- [ ] Scaffold new projects from saved templates.
- [ ] Organize templates by framework and technology.
- [ ] Support configurable project names and template options.

## 7. Later Improvements

- [ ] Improve monorepo and workspace visualization.
- [ ] Allow configuring the default terminal and editor.
- [ ] Add project grouping and organization.
- [ ] Expand technology detection based on actual projects.
- [ ] Add richer project metadata and customizable settings.

## 8. Implementation Rules

- Electron main process owns filesystem access and scanning.
- Renderer communicates through the narrow preload API and IPC.
- Keep the existing security boundaries; never expose unrestricted IPC.
- Avoid unnecessary dependencies and premature abstractions.
- No database is required initially; consider JSON persistence when needed.
- Keep the scanner's original implementation separate from the renderer-specific integration scanner while that work is ongoing.
- Don't add every possible framework at once. Expand detection incrementally.
- Don't treat distinct projects as duplicates just because their names are similar.
- Verify features in the running application before marking them finished.

---

## Current Priority Order

1. Finish and verify the project explorer and scanning integration.
2. Add technology logos.
3. Finish search, filters, pagination, and project organization.
4. Add Git repository status and branch information.
5. Add Git history, diffs, and basic change management.
6. Add dependency and script management.
7. Add process management.
8. Build reusable templates and scaffolding.
9. Expand language support and monorepo handling.
