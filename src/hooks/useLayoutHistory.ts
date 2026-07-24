import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cloneLayout } from "../editor-helpers";
import { areLayoutSnapshotsEqual } from "../layout-history";
import type { Layout } from "../types";

const MAX_LAYOUT_HISTORY = 100;

interface UseLayoutHistoryOptions {
  layout: Layout;
  layoutRef: MutableRefObject<Layout>;
  setLayout: Dispatch<SetStateAction<Layout>>;
  onRestore: (layout: Layout) => void;
}

export function useLayoutHistory({
  layout,
  layoutRef,
  setLayout,
  onRestore,
}: UseLayoutHistoryOptions) {
  const undoStackRef = useRef<Layout[]>([]);
  const redoStackRef = useRef<Layout[]>([]);
  const dragHistoryStartRef = useRef<Layout | null>(null);
  const [availability, setAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout, layoutRef]);

  const syncAvailability = useCallback(() => {
    setAvailability({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    });
  }, []);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    dragHistoryStartRef.current = null;
    syncAvailability();
  }, [syncAvailability]);

  const pushUndoSnapshot = useCallback(
    (snapshot: Layout) => {
      const nextStack = [...undoStackRef.current, cloneLayout(snapshot)];
      if (nextStack.length > MAX_LAYOUT_HISTORY) nextStack.shift();
      undoStackRef.current = nextStack;
      syncAvailability();
    },
    [syncAvailability],
  );

  const restoreLayout = useCallback(
    (nextLayout: Layout) => {
      layoutRef.current = nextLayout;
      setLayout(nextLayout);
      onRestore(nextLayout);
    },
    [layoutRef, onRestore, setLayout],
  );

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current = [
      ...redoStackRef.current,
      cloneLayout(layoutRef.current),
    ];
    restoreLayout(previous);
    syncAvailability();
  }, [layoutRef, restoreLayout, syncAvailability]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    pushUndoSnapshot(layoutRef.current);
    restoreLayout(next);
    syncAvailability();
  }, [layoutRef, pushUndoSnapshot, restoreLayout, syncAvailability]);

  const updateLayout = useCallback(
    (updater: (layout: Layout) => void) => {
      setLayout((current) => {
        const next = cloneLayout(current);
        updater(next);
        if (areLayoutSnapshotsEqual(current, next)) return current;
        pushUndoSnapshot(current);
        redoStackRef.current = [];
        syncAvailability();
        layoutRef.current = next;
        return next;
      });
    },
    [layoutRef, pushUndoSnapshot, setLayout, syncAvailability],
  );

  const beginDrag = useCallback(() => {
    dragHistoryStartRef.current = cloneLayout(layoutRef.current);
  }, [layoutRef]);

  const endDrag = useCallback(() => {
    const startLayout = dragHistoryStartRef.current;
    dragHistoryStartRef.current = null;
    if (!startLayout || areLayoutSnapshotsEqual(startLayout, layoutRef.current))
      return;
    pushUndoSnapshot(startLayout);
    redoStackRef.current = [];
    syncAvailability();
  }, [layoutRef, pushUndoSnapshot, syncAvailability]);

  return {
    beginDrag,
    clearHistory,
    endDrag,
    historyAvailability: availability,
    redoLayout: redo,
    restoreLayout,
    undoLayout: undo,
    updateLayout,
  };
}
