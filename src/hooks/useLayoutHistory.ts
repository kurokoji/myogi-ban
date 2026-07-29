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
// A press-to-release gesture (beginDrag()/endDrag(), e.g. a NumberInput
// hold) always collapses into one entry regardless of how long it lasts;
// this only groups bursts with no such explicit boundary, such as typing
// several keystrokes in a row.
export const COALESCE_DEBOUNCE_MS = 300;

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
  const coalesceStartRef = useRef<Layout | null>(null);
  const coalesceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const pushUndoSnapshot = useCallback(
    (snapshot: Layout) => {
      const nextStack = [...undoStackRef.current, cloneLayout(snapshot)];
      if (nextStack.length > MAX_LAYOUT_HISTORY) nextStack.shift();
      undoStackRef.current = nextStack;
      syncAvailability();
    },
    [syncAvailability],
  );

  const cancelCoalescedUpdate = useCallback(() => {
    if (coalesceTimeoutRef.current !== null) {
      clearTimeout(coalesceTimeoutRef.current);
      coalesceTimeoutRef.current = null;
    }
    coalesceStartRef.current = null;
  }, []);

  const flushCoalescedUpdate = useCallback(() => {
    const startLayout = coalesceStartRef.current;
    cancelCoalescedUpdate();
    if (!startLayout || areLayoutSnapshotsEqual(startLayout, layoutRef.current))
      return;
    pushUndoSnapshot(startLayout);
  }, [cancelCoalescedUpdate, layoutRef, pushUndoSnapshot]);

  useEffect(() => cancelCoalescedUpdate, [cancelCoalescedUpdate]);

  const clearHistory = useCallback(() => {
    cancelCoalescedUpdate();
    undoStackRef.current = [];
    redoStackRef.current = [];
    dragHistoryStartRef.current = null;
    syncAvailability();
  }, [cancelCoalescedUpdate, syncAvailability]);

  const restoreLayout = useCallback(
    (nextLayout: Layout) => {
      layoutRef.current = nextLayout;
      setLayout(nextLayout);
      onRestore(nextLayout);
    },
    [layoutRef, onRestore, setLayout],
  );

  const undo = useCallback(() => {
    flushCoalescedUpdate();
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current = [
      ...redoStackRef.current,
      cloneLayout(layoutRef.current),
    ];
    restoreLayout(previous);
    syncAvailability();
  }, [flushCoalescedUpdate, layoutRef, restoreLayout, syncAvailability]);

  const redo = useCallback(() => {
    flushCoalescedUpdate();
    const next = redoStackRef.current.pop();
    if (!next) return;
    pushUndoSnapshot(layoutRef.current);
    restoreLayout(next);
    syncAvailability();
  }, [
    flushCoalescedUpdate,
    layoutRef,
    pushUndoSnapshot,
    restoreLayout,
    syncAvailability,
  ]);

  const updateLayout = useCallback(
    (updater: (layout: Layout) => void) => {
      setLayout((current) => {
        const next = cloneLayout(current);
        updater(next);
        if (areLayoutSnapshotsEqual(current, next)) return current;
        layoutRef.current = next;
        if (dragHistoryStartRef.current !== null) {
          // An explicit beginDrag()/endDrag() session (canvas drag, or a
          // NumberInput hold) owns this update; endDrag() records the
          // single history entry once the gesture ends.
          return next;
        }
        if (coalesceStartRef.current === null) {
          coalesceStartRef.current = current;
          redoStackRef.current = [];
          syncAvailability();
        }
        if (coalesceTimeoutRef.current !== null) {
          clearTimeout(coalesceTimeoutRef.current);
        }
        coalesceTimeoutRef.current = setTimeout(
          flushCoalescedUpdate,
          COALESCE_DEBOUNCE_MS,
        );
        return next;
      });
    },
    [flushCoalescedUpdate, layoutRef, setLayout, syncAvailability],
  );

  const beginDrag = useCallback(() => {
    flushCoalescedUpdate();
    dragHistoryStartRef.current = cloneLayout(layoutRef.current);
  }, [flushCoalescedUpdate, layoutRef]);

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
