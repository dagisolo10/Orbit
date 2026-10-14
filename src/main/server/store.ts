import type { ServerProject, ServerProjectDraft } from "@shared/types/server";
import { app } from "electron";
import { constants } from "fs";
import { access, mkdir, readFile, stat, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

/**
 * Tiny JSON store for configured development servers.
 *
 * Projects live in `<userData>/servers.json` as a plain JSON document (no
 * database), alongside Orbit's other settings. Reads are defensive: a missing,
 * unreadable, or malformed file resolves to an empty list so Orbit always
 * starts, and individual invalid entries are dropped rather than failing the
 * whole load.
 *
 * Only configuration is persisted here — never live process handles or runtime
 * state, which live entirely in the server manager.
 */

export type ServerConfigErrorCode = "INVALID_NAME" | "INVALID_PATH" | "INVALID_COMMAND" | "NOT_FOUND" | "DUPLICATE_PATH";

export class ServerConfigError extends Error {
    readonly code: ServerConfigErrorCode;

    constructor(message: string, code: ServerConfigErrorCode) {
        super(message);
        this.name = "ServerConfigError";
        this.code = code;
    }
}

const SERVERS_FILE = "servers.json";
const CURRENT_VERSION = 1;

type ServerFile = {
    version: number;
    projects: ServerProject[];
};

function serversFilePath(): string {
    return path.join(app.getPath("userData"), SERVERS_FILE);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/** Coerces a raw persisted entry into a valid `ServerProject`, or null when unusable. */
function parseProject(value: unknown): ServerProject | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Record<string, unknown>;

    if (!isNonEmptyString(candidate["name"])) return null;
    if (!isNonEmptyString(candidate["path"]) || !path.isAbsolute(candidate["path"])) return null;
    if (!isNonEmptyString(candidate["command"])) return null;

    return {
        id: isNonEmptyString(candidate["id"]) ? candidate["id"] : randomUUID(),
        name: candidate["name"].trim(),
        path: path.normalize(candidate["path"]),
        command: candidate["command"].trim(),
        createdAt: typeof candidate["createdAt"] === "number" ? candidate["createdAt"] : Date.now(),
    };
}

export async function readServerProjects(): Promise<ServerProject[]> {
    try {
        const raw = await readFile(serversFilePath(), "utf-8");
        const parsed = JSON.parse(raw) as Partial<ServerFile>;
        const list = Array.isArray(parsed.projects) ? parsed.projects : [];

        const projects: ServerProject[] = [];
        const seen = new Set<string>();
        for (const entry of list) {
            const project = parseProject(entry);
            if (!project) continue;
            // Guard against duplicate ids or paths in a hand-edited file.
            if (seen.has(project.id)) continue;
            seen.add(project.id);
            projects.push(project);
        }
        return projects;
    } catch {
        return [];
    }
}

async function writeServerProjects(projects: ServerProject[]): Promise<void> {
    const filePath = serversFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    const document: ServerFile = { version: CURRENT_VERSION, projects };
    await writeFile(filePath, `${JSON.stringify(document, null, 4)}\n`, "utf-8");
}

async function isReadableDirectory(target: string): Promise<boolean> {
    try {
        const info = await stat(target);
        if (!info.isDirectory()) return false;
        await access(target, constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

/** Validates a user-editable draft, returning a normalized copy or throwing. */
async function validateDraft(draft: ServerProjectDraft): Promise<ServerProjectDraft> {
    const name = typeof draft.name === "string" ? draft.name.trim() : "";
    const command = typeof draft.command === "string" ? draft.command.trim() : "";
    const rawPath = typeof draft.path === "string" ? draft.path.trim() : "";

    if (name.length === 0) {
        throw new ServerConfigError("Give this project a display name.", "INVALID_NAME");
    }

    if (command.length === 0) {
        throw new ServerConfigError("Enter the command that starts this server, for example “npm run dev”.", "INVALID_COMMAND");
    }

    if (rawPath.length === 0 || !path.isAbsolute(rawPath)) {
        throw new ServerConfigError("Choose a project folder.", "INVALID_PATH");
    }

    const normalizedPath = path.normalize(rawPath);

    if (!(await isReadableDirectory(normalizedPath))) {
        throw new ServerConfigError("That project folder does not exist or cannot be read. Choose another folder.", "INVALID_PATH");
    }

    return { name, path: normalizedPath, command };
}

/** Adds a project, rejecting a duplicate directory, and returns the new list. */
export async function addServerProject(draft: ServerProjectDraft): Promise<ServerProject[]> {
    const normalized = await validateDraft(draft);
    const projects = await readServerProjects();

    if (projects.some((project) => project.path === normalized.path)) {
        throw new ServerConfigError("That folder is already configured. Edit the existing project instead.", "DUPLICATE_PATH");
    }

    const project: ServerProject = { id: randomUUID(), ...normalized, createdAt: Date.now() };
    const next = [...projects, project];
    await writeServerProjects(next);
    return next;
}

/** Updates a project in place. Changing the directory still validates it. */
export async function updateServerProject(id: string, draft: ServerProjectDraft): Promise<ServerProject[]> {
    const projects = await readServerProjects();
    const existing = projects.find((project) => project.id === id);

    if (!existing) {
        throw new ServerConfigError("That project no longer exists.", "NOT_FOUND");
    }

    const normalized = await validateDraft(draft);

    if (projects.some((project) => project.id !== id && project.path === normalized.path)) {
        throw new ServerConfigError("Another project already uses that folder.", "DUPLICATE_PATH");
    }

    const next = projects.map((project) => (project.id === id ? { ...project, ...normalized } : project));
    await writeServerProjects(next);
    return next;
}

/** Removes a project and returns the new list. */
export async function removeServerProject(id: string): Promise<ServerProject[]> {
    const projects = await readServerProjects();

    if (!projects.some((project) => project.id === id)) {
        throw new ServerConfigError("That project no longer exists.", "NOT_FOUND");
    }

    const next = projects.filter((project) => project.id !== id);
    await writeServerProjects(next);
    return next;
}
