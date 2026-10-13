import { Button } from "@/components/ui/button";
import { useOrbit } from "@/contexts/orbit-context";
import { cn } from "@/lib/utils";
import { FolderSearch } from "lucide-react";

/**
 * Opens the native directory picker so users can fix a wrong/empty projects
 * root straight from an empty state, without detouring through Settings.
 */
export function ChangeFolderButton({ label = "Change folder" }: { label?: string }) {
    const { changeProjectsRoot, changingProjectsRoot } = useOrbit();

    return (
        <Button variant="primary" size="md" onClick={changeProjectsRoot} disabled={changingProjectsRoot}>
            <FolderSearch className={cn("size-3.5", changingProjectsRoot && "animate-pulse")} />
            {changingProjectsRoot ? "Opening…" : label}
        </Button>
    );
}
