export function getMonogram(name: string): string {
    const cleaned = name
        .replace(/^@/, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim();
    if (!cleaned) return "?";
    const words = cleaned.split(/\s+/);
    if (words.length === 1) {
        const word = words[0];
        return word.length <= 2 ? word.toUpperCase() : `${word[0]}${word[1]}`.toUpperCase();
    }
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function hueFromString(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash) % 360;
}

export function getBaseName(path: string): string {
    const normalized = path.replace(/[\\/]+$/, "");
    const segments = normalized.split(/[\\/]/);
    return segments[segments.length - 1] || normalized;
}

export function shortenPath(path: string, maxLength = 46): string {
    if (path.length <= maxLength) return path;
    const segments = path.split(/[\\/]/).filter(Boolean);
    let result = segments[segments.length - 1] ?? path;
    for (let index = segments.length - 2; index >= 0; index -= 1) {
        const next = `${segments[index]}/${result}`;
        if (next.length + 2 > maxLength) break;
        result = next;
    }
    return `…/${result}`;
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
    const diff = Math.max(0, now - timestamp);
    const seconds = Math.round(diff / 1000);
    if (seconds < 45) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
}
