import { useCallback, useState, type DragEvent } from "react";

/**
 * Props shared by every draggable row in a sortable list.
 *
 * The handlers are spread directly onto the element that should initiate the
 * drag, so the list only needs to own the ordering and the visual drag state.
 */
export type DragHandlers = {
    draggable: true;
    onDragEnd: () => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
    onDragStart: (event: DragEvent<HTMLElement>) => void;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
};

type UseDragOptions<T extends string> = {
    /** Current order of the draggable items. */
    items: T[];
    /** Receives the reordered list when an item is dropped on another item. */
    onReorder: (items: T[]) => void;
};

/**
 * Shared drag-to-reorder state for vertical lists.
 *
 * Both the sidebar navigation and the server index use the same interaction:
 * pick up a row, highlight the row it is hovering, and splice it into that
 * position on drop. Keeping the logic here avoids two subtly different copies.
 */
export function useDrag<T extends string>({ items, onReorder }: UseDragOptions<T>) {
    const [dragId, setDragId] = useState<T | null>(null);
    const [dragOverId, setDragOverId] = useState<T | null>(null);

    const reset = useCallback(() => {
        setDragId(null);
        setDragOverId(null);
    }, []);

    const onDrop = useCallback(
        (targetId: T) => {
            if (dragId && dragId !== targetId) {
                const from = items.indexOf(dragId);
                const to = items.indexOf(targetId);

                if (from !== -1 && to !== -1) {
                    const next = [...items];
                    const [moved] = next.splice(from, 1);
                    next.splice(to, 0, moved);
                    onReorder(next);
                }
            }

            reset();
        },
        [dragId, items, onReorder, reset],
    );

    const getDragHandlers = useCallback(
        (id: T): DragHandlers => ({
            draggable: true,
            onDragStart: (event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", id);
                setDragId(id);
            },
            onDragOver: (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragId && dragId !== id) setDragOverId(id);
            },
            onDrop: (event) => {
                event.preventDefault();
                onDrop(id);
            },
            onDragEnd: reset,
        }),
        [dragId, onDrop, reset],
    );

    return { dragId, dragOverId, getDragHandlers, reset };
}
