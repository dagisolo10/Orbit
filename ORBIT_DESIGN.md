# Orbit --- UI Design System & Complete Redesign Brief

> **Purpose:** This document is Orbit's persistent visual-design source
> of truth. Read it before making UI changes and refer to it whenever
> designing, implementing, or revising the interface.
>
> **Core instruction:** Completely redesign Orbit's visual interface. Do
> not reuse the current UI's layouts, styling, component arrangements,
> or visual ideas. However, preserve every existing feature, workflow,
> behavior, and integration. This is a visual redesign, not a
> feature-removal exercise or an excuse to rewrite working application
> logic.

---

## 1. Product Identity

Orbit is an Electron desktop application for discovering, organizing,
creating, and opening local development projects.

It helps developers keep track of their projects and workspaces,
understand what technologies they use, create new projects, reuse
project templates, and quickly open projects in their preferred tools.

Orbit should feel like a well-designed developer workspace: focused,
precise, fast, and thoughtfully engineered.

### Design objective

Create an interface that makes it easy to:

1. See and navigate discovered projects.
2. Understand each project's identity, location, framework, and
   tooling.
3. Find projects quickly.
4. Create projects with the desired framework, package manager, and
   commands.
5. Reuse templates without unnecessary setup.
6. Open projects in the user's preferred editor, terminal, or file
   manager.
7. Configure Orbit's directories and preferences.

The experience should feel like a desktop product designed specifically
for developers---not a generic admin dashboard, web landing page, or
file manager clone.

---

## 2. Non-Negotiable Redesign Rules

1. Inspect the entire existing application before changing the UI.
2. Read this document completely.
3. Inventory every existing screen, action, dialog, context menu,
   shortcut, setting, and workflow.
4. Preserve all existing functionality, including features not
   explicitly listed in this document.
5. Do not remove, hide, disable, or simplify a feature merely because
   it does not fit the new visual design.
6. Do not replace working functionality with mock data, static UI,
   placeholder buttons, or fake interactions.
7. Do not change project discovery, project creation, template
   behavior, or IPC behavior just to make the redesign easier.
8. Preserve the existing Electron architecture and type-safe
   communication between renderer and main process.
9. Reuse existing dependencies and infrastructure where practical.
10. If a feature's current behavior is unclear, inspect its
    implementation before changing it.
11. Update this document when a significant visual-system decision
    changes.

**Visual freedom is encouraged. Functional regression is not.**

---

## 3. Visual Direction

Use the same overall visual language established for Warden, adapted to
Orbit's identity.

### Overall aesthetic

- Dark, minimalistic, technical, and quietly futuristic.
- Sharp corners or very small corner radii.
- Clean typography with a distinct monospaced data style.
- Strong alignment and deliberate spacing.
- Compact but readable project information.
- Clear visual hierarchy.
- Restrained accent colors.
- Thin borders and subtle surface differences.
- Purposeful micro-interactions and smooth transitions.

Orbit should feel like a precision-built developer tool. It should be
visually distinctive without becoming noisy or overly decorative.

### Design inspiration

Use the same two user-provided visual references from the Warden
redesign as inspiration:

**Telemetry reference** - Crisp labels and numerical readouts. - Thin
dividers, segmented indicators, and precise alignment. - High-contrast
dark surfaces. - Restrained red highlights. - Technical visualizations
and carefully organized information.

**Modular dashboard reference** - Modular composition. - Compact section
labels. - Monospaced typography. - Dot-matrix and point-based visual
details. - Distinct areas with a consistent grid.

**Orbit interpretation** - Use the technical precision of the telemetry
reference. - Use the modularity and typography character of the
dashboard reference. - Build around projects, folders, workspaces,
frameworks, and developer workflows. - Do not force irrelevant telemetry
charts into Orbit. Visualizations should only exist when they
communicate useful project information. - Do not copy either reference's
exact layout, cards, labels, or content.

---

## 4. Visual Tokens

Use these as initial design tokens. Centralize them in the project's
styling system and adjust them coherently if needed.

Token Suggested value Purpose

---

`background` `#090A0C` Main application background
`surface` `#111316` Primary panels and surfaces
`surface-raised` `#171A1E` Hovered or elevated surfaces
`surface-muted` `#0D0F12` Inset areas and secondary regions
`border` `#292D32` Dividers and subtle outlines
`text-primary` `#F2F3F4` Primary text
`text-secondary` `#A0A5AC` Supporting text
`text-muted` `#666D76` Secondary metadata
`accent` `#F0444F` Primary accent
`accent-muted` `#782A30` Low-emphasis accent
`success` `#79B89A` Successful operations
`warning` `#E6A94A` Warnings
`danger` `#F0444F` Errors and destructive actions

Red should be a recognizable accent, not the color of every interactive
element. Use neutral surfaces and typography to do most of the visual
work.

Do not rely on color alone to communicate status.

---

## 5. Typography

Use two complementary typographic roles:

### Interface typography

A clean, highly legible sans-serif for: - Project names. - Page
headings. - Descriptions. - Buttons. - Navigation. - Forms and normal
interface content.

### Technical typography

A legible monospaced typeface for: - Project paths. - Package names. -
Framework and runtime metadata. - Commands. - Package manager labels. -
Version numbers. - Small technical readouts.

Use tabular numerals where values may change. Keep line lengths
reasonable and avoid excessively small labels.

Use uppercase section labels sparingly to create a technical character
without making the entire interface difficult to read.

### Interface scale

Interface scale is a first-class preference. Orbit scales the entire
renderer with Electron's native web-frame zoom factor rather than
overriding individual font sizes, so every surface stays proportional and
no component needs to hardcode a fixed size.

- Default: 100%.
- Bounds and step are centralized as adjustable constants in the
  interface-scale provider (80%–150%, 10% step).
- Shortcuts: `Shift +` `+` increase, `Shift +` `-` decrease, `Shift +` `0`
  reset. The status ribbon and Settings controls show the same combination
  in their tooltips.
- The current scale is persisted in local storage and is visible in
  Settings (General → Interface scale) and in the bottom status ribbon,
  which exposes a decrease / reset / increase stepper.

---

## 6. Application Shell and Navigation

Create a desktop-first application shell with a compact, understated
navigation area.

Inspect the existing routes and destinations first. Preserve all of
them.

Potential navigation organization, to be adapted to actual existing
features:

- **Projects** --- discovered projects and project browsing.
- **Templates** --- reusable project templates, if implemented as a
  separate destination.
- **Settings** --- project directory, editor, terminal, appearance,
  and other existing preferences.
- **About** --- application information and existing project links.

Do not create duplicate destinations if the current app organizes these
features differently.

### Navigation behavior

- Make the active destination obvious.
- Use restrained active-state indicators.
- Keep navigation compact.
- Use consistent icons from one icon family.
- Include tooltips for icon-only navigation when necessary.
- Preserve any existing navigation shortcuts or behaviors.
- Support collapsing the navigation rail without losing access to any
  destination.

### Implemented shell

The current shell is a desktop three-part frame:

- **Sidebar (left, full height).** Restored and redesigned as a quiet
  navigation rail. The Orbit app icon
  (`src/renderer/src/assets/logo.png`) anchors the brand block, followed
  by icon + label module rows with a thin accent active indicator, live
  counts, and a two-digit index for modules with no count. The footer
  holds the projects-root status card, Settings, and the collapse control.
  The rail collapses to icons only, with right-side tooltips, and persists
  its state. `Ctrl/Cmd+B` toggles it.
- **Top command bar.** Carries the active module readout and re-scan. It
  does not duplicate primary navigation, and it holds no search field.
- **Bottom status ribbon.** A telemetry strip for the workspace root,
  project/workspace/stack/favorite counts, running servers, last scan,
  scanner state, and an interface-scale stepper (decrease, click the
  percentage to reset, increase).

The app icon is the primary identity asset. Any inline orbital mark is
secondary and must never replace the app icon in the shell or About.

### Workspace layout

The main workspace should have: - A clear page title. - Contextual
actions. - Search or filtering where useful. - A consistent content
grid. - Enough breathing room to scan information. - Responsive behavior
when the desktop window is resized.

Avoid unnecessary nested panels and excessive rounded cards.

---

## 7. Projects Experience

Project discovery and browsing are central to Orbit. The project
interface must make it easy to understand and access a large local
collection.

### Project discovery

Orbit's existing discovery behavior must remain intact.

The initial setup uses a single root directory, such as `~/Projects`.
Orbit discovers projects within category folders under that root.

Preserve: - The configured root directory. - Existing scanning
behavior. - Category-folder organization. - Project identification. -
Existing refresh or rescan behavior. - Existing error handling and
discovery states.

Do not silently change scanning depth, discovery rules, or the meaning
of the root folder.

### Project presentation

Design a fresh project-browsing experience.

Each project entry should display the useful metadata actually
available, such as: - Project name. - Project icon or a consistent
fallback. - Detected framework or technology. - Project category or
parent folder. - Package manager, if detected. - Local path, when
useful. - Workspace indicator, when applicable.

Do not invent metadata when it is unavailable.

### Grid project card

The grid card is a compact technical module rather than a generic content
card:

- The header row carries the monogram, project name, shortened path, and
  the favorite / project-menu controls. The controls stay available at
  reduced opacity and resolve to full opacity on hover or focus.
- A hairline footer separates the stack readout: a `STACK` label with the
  detected technology count, the compact category roles (for example
  `LANG · UI · OPS`), then up to three technology badges and a `+N`
  overflow chip.
- Projects with no detected stack show `// NO STACK DETECTED` instead of
  leaving the footer empty.
- Cards keep a minimum height so grid rows align, with the footer anchored
  to the bottom.
- Hover and focus raise the panel, strengthen the border, and draw an
  accent hairline across the top edge.

### Layout options

Choose the layout that best fits the actual number and density of
projects: - A structured project list for efficient scanning. - A
modular grid for a more visual overview. - A combination with a
user-controlled layout switch, only if it improves the existing
experience.

Do not implement multiple layouts just for the sake of adding options.

### Search and filtering

Preserve existing search and filtering behavior. If the application
already supports additional organization or sorting, retain it.

Search belongs to the view it filters, not to the global shell. Projects,
Favorites, Workspaces, and Technologies each own an independent search
term, rendered in that view's filter toolbar (or the page header actions
for Technologies). A term entered in one view never leaks into another,
and switching views preserves each view's own term for the session.

`Ctrl/Cmd+K` focuses the search field of the view that is currently
mounted. There is no global search field in the top command bar.

Make search easy to access and visually prominent enough to find
quickly.

Filtering and sorting controls should be compact and consistent with the
design system.

### Project actions

Preserve every existing project action and its behavior.

Relevant actions may include: - Open in editor. - Open in terminal. -
Open in file manager. - View or copy project path. - Other existing
project-specific actions.

Present common actions clearly and less frequent actions in a
well-designed contextual menu where appropriate.

Do not hide important actions behind ambiguous icons.

### Workspace projects

Orbit can detect workspace-related projects through workspace metadata.

Preserve the existing workspace detection and grouping behavior. Make
the relationship between a workspace and its projects visually
understandable.

Do not flatten or duplicate workspace projects in a way that changes
existing semantics.

---

## 8. Create Project Workflow

Project creation is an important workflow and must retain all existing
functionality.

The existing workflow includes: 1. Project name and location. 2. Package
manager selection, such as Bun, npm, or pnpm. 3. Framework selection or
a custom creation command. 4. Project creation and dependency
installation. 5. Opening the created project in the preferred editor,
terminal, or file manager.

Inspect the actual implementation and preserve all supported options,
validation, and execution behavior.

### New visual experience

Design the workflow as a polished, focused creation experience.

Possible structure: - A clear title and short explanation. - Project
identity and destination. - Package manager selection. - Framework or
custom-command configuration. - A concise review of the chosen
configuration. - Creation progress and result.

You may use a multi-step layout or a single well-organized form. Choose
the approach that makes the workflow easiest to understand without
adding unnecessary steps.

### Form behavior

- Label every field clearly.
- Explain non-obvious options.
- Show validation near the relevant field.
- Preserve all supported package managers and frameworks.
- Make custom commands easy to inspect and edit.
- Clearly distinguish the primary action from cancellation.
- Preserve existing execution and error behavior.

### Creation progress

During project creation: - Show which stage is currently running. -
Communicate command execution and dependency installation status. -
Display useful errors when a command fails. - Do not falsely report
success. - Prevent accidental duplicate submissions where appropriate. -
Preserve any existing cancellation or recovery behavior.

The progress experience should feel technical and informative without
overwhelming the user with raw logs unless those logs are already part
of the product experience.

---

## 9. Templates

Orbit's existing template workflow must be preserved.

Templates are ordinary reusable project copies. The existing workflow
supports saving or moving/copying a project into the Templates
directory, cleaning generated files and dependencies as appropriate,
then using that template to create a new project, install dependencies,
and open the result.

Inspect the current implementation carefully. Do not reinterpret
templates as a new package format or introduce a new template engine
unless the codebase already does so.

### Template interface

Make templates easy to: - Browse. - Identify. - Understand. - Reuse. -
Manage through existing supported actions.

Display useful information such as: - Template name. - Detected
framework or technology. - Package manager metadata, if available. -
Source or template location, when useful.

### Use template workflow

Preserve the existing behavior for: - Selecting a template. - Naming the
new project. - Choosing its destination. - Copying template contents. -
Cleaning or preserving files according to current behavior. - Installing
dependencies. - Opening the resulting project.

Make each stage understandable. Clearly communicate errors and progress.

Do not delete or overwrite template content unexpectedly.

---

## 10. Technology Detection and Metadata

Orbit reads project metadata such as `package.json` and detects
technologies from dependencies.

Existing detection includes technologies such as React, Vite, and
Next.js. Preserve all detection logic and any additional detectors
discovered in the codebase.

### Presentation

- Use consistent technology labels or compact badges.
- Show the technology's brand mark wherever an individual technology is
  shown — badges, stack index rows, workspace summaries, detail lists,
  and filters. The icon is the primary recognition cue. Use a neutral
  monogram fallback for unknown technologies.
- Never represent a technology with a category colour square or dot.
  Category-level chrome stays neutral; the brand mark carries identity.
- Keep the badge chrome quiet so full-colour brand marks are the only
  saturated element.
- Avoid giving every framework a loud unique color.
- Use icons only when they improve recognition.
- Show package manager and workspace information clearly.
- Distinguish detected information from user-configured information if
  necessary.
- Handle unknown or incomplete project metadata gracefully.

The redesign must not change the underlying detection rules merely to
fit a visual presentation.

---

## 11. Settings

Preserve all existing settings and their behavior.

Known settings include: - Project root directory. - Preferred editor. -
Preferred terminal. - Appearance preferences. - About information and
the existing `orbit.dagidev.com` link.

Inspect the codebase for additional settings and preserve them too.

### Settings presentation

- Group related preferences logically.
- Use clear descriptions.
- Make the current value visible.
- Provide appropriate selection or browse interactions.
- Validate directory and application choices.
- Communicate changes and errors clearly.

Settings is navigated with a horizontal tab strip at the top of the page
— a channel strip, not breadcrumbs. Each tab carries a two-digit index,
its label, and a short section descriptor, with a thin accent underline
on the active tab. Only one section's content is rendered at a time. The
runtime readout (version, root state, scanner state) sits at the right
edge of the same strip. Arrow keys, Home, and End move between tabs.

Do not remove a setting because it is not listed in this document.

---

## 12. Micro-interactions and Motion

Motion should make Orbit feel responsive and polished without slowing
down developer workflows.

### Interactions to polish

- Navigation changes.
- Project hover and selection.
- Opening project actions and contextual menus.
- Search and filter changes.
- Switching project views, if supported.
- Opening and closing dialogs.
- Form validation.
- Package manager and framework selection.
- Template selection.
- Project creation progress.
- Successful project creation.
- Error and empty states.
- Settings changes.

### Motion style

- Short, smooth transitions.
- Subtle opacity and positional changes.
- Small scale changes for overlays where appropriate.
- Smooth hover and pressed states.
- Consistent easing and duration tokens.
- No excessive bouncing, elastic movement, or dramatic parallax.

### Intro and outro animations

Give important surfaces a considered entrance and exit: - Main content
can fade in with a slight upward movement. - Dialogs should enter and
leave cleanly. - Contextual menus should appear quickly and
predictably. - Creation progress should transition smoothly between
stages. - Success and error feedback should be clear and restrained.

Do not replay elaborate animations after every small state update.
Respect reduced-motion preferences.

The interface should feel fast. Never let an animation delay opening a
project or executing an important action.

---

## 13. Component System

Build a consistent reusable design system.

Create or refactor components where appropriate for: - Navigation
items. - Project list entries or project modules. - Project metadata
labels. - Technology indicators. - Search and filter controls. - Context
menus. - Dialogs. - Form fields. - Package manager and framework
selectors. - Progress indicators. - Empty states. - Notifications and
operation feedback.

### Consistency rules

- Centralize color, typography, spacing, border, radius, and motion
  tokens.
- Use a consistent spacing scale.
- Align project names, paths, and metadata consistently.
- Use the same status and interaction language across the application.
- Avoid arbitrary one-off styles.
- Keep component APIs focused.
- Avoid overengineering abstractions for one-off elements.

### Iconography

Use one consistent icon family already present in the project where
possible. Avoid mixing emoji, unrelated icon packs, and custom icon
styles.

---

## 14. Empty, Loading, and Error States

Design the complete experience, not only the populated project list.

Include appropriate states for: - First launch before a project root is
configured. - Root directory configured but no projects discovered. -
Scanning in progress. - Project scan failure. - Missing or unreadable
project metadata. - Search with no results. - No templates available. -
Project creation in progress. - Project creation failure. - Dependency
installation failure. - Missing preferred editor or terminal. - Invalid
or unavailable directories. - Settings load or save errors.

Each state should explain what happened and provide a relevant next
action when one exists.

Do not use fake projects or placeholder content to make empty screens
look populated.

---

## 15. Accessibility and Usability

- Maintain readable contrast.
- Do not communicate status through color alone.
- Ensure keyboard navigation works.
- Preserve existing keyboard shortcuts, including search (`Ctrl/Cmd+K`),
  interface zoom (`Shift +` `+`, `-`, `0`), and sidebar collapse
  (`Ctrl/Cmd+B`).
- Provide visible focus states.
- Give icon-only actions accessible labels.
- Use appropriate semantic headings and control labels.
- Keep controls usable at typical desktop scaling.
- Respect reduced-motion preferences.
- Ensure long project names and paths do not break layouts.
- Provide tooltips where truncation hides important information.

Minimalism must not make the interface cryptic.

---

## 16. Technical and Architectural Constraints

This is a UI redesign. It is not authorization to rewrite Orbit's
backend or change its product behavior.

Orbit already has an Electron architecture and working type-safe shared
IPC. Renderer-to-main handlers are registered in the existing main entry
point (`main.tsx`).

Before implementation: 1. Inspect the Electron main and renderer
architecture. 2. Inspect the shared IPC types and handler registration. 3. Inventory every existing IPC operation used by the UI. 4. Identify
the existing routing, state management, styling, and component systems. 5. Map every existing feature to the new UI.

During implementation: - Preserve the existing type-safe IPC
contracts. - Preserve the main-process handlers and their behavior. - Do
not move filesystem operations into the renderer. - Do not expose
unrestricted Node.js access to the renderer. - Do not duplicate business
logic in UI components. - Do not replace real data with hardcoded
examples. - Do not remove existing functionality. - Reuse existing
dependencies where practical. - Keep the UI responsive to real loading,
error, and operation states.

If a visual requirement needs a backend capability that does not exist,
do not fake it. Explain the limitation and preserve the existing
behavior.

---

## 17. Redesign Workflow for Junie

Treat this as a complete visual replacement, not a sequence of small
cosmetic edits.

### Phase 1 --- Audit existing Orbit

- Read this document.
- Inspect the entire codebase.
- Inventory all screens and workflows.
- Inspect all menus, dialogs, actions, and settings.
- Inspect the IPC contracts and existing data flows.
- Record the features that must remain functional.
- Do not reuse the existing UI's visual design.

### Phase 2 --- Establish the new design system

- Define shared visual tokens.
- Establish typography and iconography.
- Design the application shell and navigation.
- Define project presentation and metadata patterns.
- Define form, dialog, menu, and progress styles.
- Establish motion conventions.

### Phase 3 --- Redesign all existing surfaces

Implement the redesign across the entire application: 1. Application
shell and navigation. 2. Project discovery and browsing. 3. Project
details and all existing project actions. 4. Search, filters, and
organization. 5. Create Project workflow. 6. Template browsing and
management. 7. Settings. 8. About. 9. All existing dialogs, menus,
notifications, and exceptional states.

Adapt this list to the actual screens discovered in the repository. Do
not omit existing screens simply because they are not explicitly named
here.

### Phase 4 --- Polish interactions

- Implement micro-interactions.
- Implement smooth intro/outro transitions.
- Polish forms, menus, and dialogs.
- Verify keyboard behavior.
- Verify reduced-motion behavior.
- Ensure animations do not slow down common actions.

### Phase 5 --- Verify functionality

- Run existing project checks.
- Verify every existing workflow still works.
- Verify project discovery and category organization.
- Verify framework and workspace detection.
- Verify project creation for all existing supported options.
- Verify custom creation commands.
- Verify template copying and dependency installation.
- Verify opening projects in the configured editor, terminal, and file
  manager.
- Verify settings persistence.
- Resize the application and inspect layout behavior.
- Remove obsolete styling and unused UI components when safe.

Do not stop after redesigning the project overview. Complete the entire
existing UI surface.

---

## 18. Final Quality Checklist

- [ ] The redesign has a genuinely new visual structure.
- [ ] No old layout or styling was retained merely for convenience.
- [ ] The interface is dark, minimal, technical, and polished.
- [ ] Sharp geometry, typography, spacing, and alignment are
      consistent.
- [ ] Project names and metadata are easy to scan.
- [ ] Project discovery and category organization still work.
- [ ] Workspace detection and grouping still work.
- [ ] All project actions remain available.
- [ ] Search, filtering, and sorting remain functional where
      supported.
- [ ] The complete Create Project workflow remains functional.
- [ ] All existing package managers and framework options remain
      available.
- [ ] Custom creation commands still work.
- [ ] Template workflows remain intact.
- [ ] Dependency installation and progress feedback remain functional.
- [ ] Editor, terminal, and file manager integrations remain
      functional.
- [ ] All existing settings remain available and functional.
- [ ] Empty, loading, and error states are designed.
- [ ] Micro-interactions are polished but restrained.
- [ ] Intro/outro animations do not slow down important actions.
- [ ] Keyboard navigation and reduced-motion behavior are considered.
- [ ] Existing Electron architecture and type-safe IPC remain intact.
- [ ] No fake data, dead controls, or placeholder functionality
      remains.

---

## 19. Standing Instruction

Whenever Junie is asked to modify Orbit's UI, it must read and follow
this document first.

**Design north star:** Orbit should feel like a beautifully engineered
home for a developer's projects: organized without feeling rigid,
technical without feeling intimidating, minimal without feeling empty,
and polished without getting in the way of work.

---

## 20. Decision Log

- Restored the original app icon (`logo.png`) in the sidebar brand and
  Settings → About after it was removed during the redesign.
- Restored the left sidebar and redesigned it in the Console visual
  language rather than copying the previous sidebar.
- Restructured the shell as a full-height sidebar beside a content column
  with a top command bar and a bottom telemetry ribbon.
- Added native interface zoom (`Shift +` `+`, `-`, `0`) with a persisted
  scale, Settings stepper, and status-ribbon readout.
- Added a persisted sidebar collapse (`Ctrl/Cmd+B`) that falls back to
  icons only on narrow windows.
- Converted Settings from a stacked index + panels into a horizontal tab
  strip that shows exactly one section at a time.
- Restored technology brand icons inside every technology badge, with a
  neutral monogram fallback for unknown technologies.
- Removed category colour dots from stack rows, workspace summaries, and
  category chrome so every technology is identified by its brand icon.
- Enlarged the bottom status ribbon and added a full interface-scale
  stepper (decrease, reset, increase).
- Moved search out of the top command bar and into each view. Projects,
  Favorites, Workspaces, and Technologies keep independent search terms,
  and `Ctrl/Cmd+K` focuses the active view's field.
- Rebuilt the grid project card around a header row plus a hairline stack
  footer with a technology count, category roles, and a `+N` overflow chip.
