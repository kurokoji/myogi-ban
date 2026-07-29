// biome-ignore-all assist/source/organizeImports: DOM setup must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import { useRef, useState } from "react";
import {
  COALESCE_DEBOUNCE_MS,
  useLayoutHistory,
} from "../src/hooks/useLayoutHistory";
import { createDefaultLayout } from "../src/layout";
import type { Layout } from "../src/types";

function useFieldHistory(initialLayout = createDefaultLayout()) {
  const [layout, setLayout] = useState<Layout>(() => initialLayout);
  const layoutRef = useRef(layout);
  const history = useLayoutHistory({
    layout,
    layoutRef,
    setLayout,
    onRestore: () => {},
  });

  return { layout, ...history };
}

test("a burst of rapid updateLayout calls collapses into one history entry", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { result } = renderHook(() => useFieldHistory());
  const original = result.current.layout.stick.x;

  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "1";
    });
  });
  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "2";
    });
  });
  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "3";
    });
  });

  assert.equal(result.current.layout.stick.x, "3");
  assert.equal(result.current.historyAvailability.canUndo, false);

  act(() => {
    t.mock.timers.tick(COALESCE_DEBOUNCE_MS + 50);
  });

  assert.equal(result.current.historyAvailability.canUndo, true);

  act(() => result.current.undoLayout());

  assert.equal(result.current.layout.stick.x, original);
  assert.equal(result.current.historyAvailability.canUndo, false);
});

test("undo flushes a still-pending burst instead of skipping it", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { result } = renderHook(() => useFieldHistory());
  const original = result.current.layout.stick.x;

  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "5";
    });
  });

  assert.equal(result.current.historyAvailability.canUndo, false);

  act(() => result.current.undoLayout());

  assert.equal(result.current.layout.stick.x, original);
});

test("holding a NumberInput's step control records only one history entry", () => {
  // The real app brackets the whole press-to-release gesture with
  // beginDrag()/endDrag() (see editor.tsx's onPointerDownCapture / the
  // window pointerup listener), so this no longer depends on any timing
  // window lining up with NumberInput's stepHoldDelay.
  const { result } = renderHook(() => useFieldHistory());
  const original = result.current.layout.stick.x;

  act(() => result.current.beginDrag());
  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "501";
    });
  });
  for (let value = 502; value <= 550; value += 1) {
    act(() => {
      result.current.updateLayout((next) => {
        next.stick.x = String(value);
      });
    });
  }

  assert.equal(result.current.historyAvailability.canUndo, false);

  act(() => result.current.endDrag());

  assert.equal(result.current.layout.stick.x, "550");

  act(() => result.current.undoLayout());

  assert.equal(result.current.layout.stick.x, original);
});

test("updateLayout calls during an active drag do not start their own coalescing window", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { result } = renderHook(() => useFieldHistory());

  act(() => result.current.beginDrag());
  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "10";
    });
  });
  act(() => {
    t.mock.timers.tick(COALESCE_DEBOUNCE_MS + 50);
  });

  // If updateLayout had started its own debounce, it would have flushed
  // by now even though the drag never ended.
  assert.equal(result.current.historyAvailability.canUndo, false);
});

test("beginning a drag flushes a pending coalesced burst first", () => {
  const { result } = renderHook(() => useFieldHistory());
  const original = result.current.layout.stick.x;

  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "1";
    });
  });

  assert.equal(result.current.historyAvailability.canUndo, false);

  act(() => result.current.beginDrag());
  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "2";
    });
  });
  act(() => result.current.endDrag());

  assert.equal(result.current.layout.stick.x, "2");

  act(() => result.current.undoLayout());
  assert.equal(result.current.layout.stick.x, "1");

  act(() => result.current.undoLayout());
  assert.equal(result.current.layout.stick.x, original);
});

test("a paused edit still records its own history entry", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { result } = renderHook(() => useFieldHistory());
  const original = result.current.layout.stick.x;

  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "1";
    });
  });
  act(() => {
    t.mock.timers.tick(COALESCE_DEBOUNCE_MS + 50);
  });
  act(() => {
    result.current.updateLayout((next) => {
      next.stick.x = "2";
    });
  });
  act(() => {
    t.mock.timers.tick(COALESCE_DEBOUNCE_MS + 50);
  });

  assert.equal(result.current.layout.stick.x, "2");

  act(() => result.current.undoLayout());
  assert.equal(result.current.layout.stick.x, "1");

  act(() => result.current.undoLayout());
  assert.equal(result.current.layout.stick.x, original);
});
