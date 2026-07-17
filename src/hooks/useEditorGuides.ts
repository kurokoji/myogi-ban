import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { guideCoordinateFromPointer } from "../editor-guides";
import { cloneLayout } from "../editor-helpers";
import type { Layout } from "../types";

type GuideAxis = "x" | "y";
type GuideDragState = { axis: GuideAxis; index: number } | null;

interface UseEditorGuidesOptions {
  layoutRef: MutableRefObject<Layout>;
  previewScale: number;
  setLayout: Dispatch<SetStateAction<Layout>>;
}

export function useEditorGuides({
  layoutRef,
  previewScale,
  setLayout,
}: UseEditorGuidesOptions) {
  const previewRef = useRef<HTMLElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [rulerOrigin, setRulerOrigin] = useState({ x: 0, y: 0 });
  const [guideDrag, setGuideDrag] = useState<GuideDragState>(null);

  const updateRulerOrigin = useCallback(() => {
    const preview = previewRef.current;
    const container = previewContainerRef.current;
    if (!preview || !container) return;
    const previewRect = preview.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = containerRect.left - previewRect.left;
    const y = containerRect.top - previewRect.top;
    setRulerOrigin((current) =>
      current.x === x && current.y === y ? current : { x, y },
    );
  }, []);

  useEffect(() => {
    updateRulerOrigin();
  });

  useEffect(() => {
    window.addEventListener("resize", updateRulerOrigin);
    return () => window.removeEventListener("resize", updateRulerOrigin);
  }, [updateRulerOrigin]);

  const coordinateFromPointer = useCallback(
    (event: { clientX: number; clientY: number }, axis: GuideAxis) => {
      const preview = previewRef.current;
      if (!preview) return 0;
      const previewRect = preview.getBoundingClientRect();
      const origin = axis === "x" ? rulerOrigin.x : rulerOrigin.y;
      return guideCoordinateFromPointer(
        axis === "x" ? event.clientX : event.clientY,
        axis === "x" ? previewRect.left : previewRect.top,
        origin,
        previewScale,
      );
    },
    [previewScale, rulerOrigin.x, rulerOrigin.y],
  );

  const moveGuide = useCallback(
    (axis: GuideAxis, index: number, value: number) => {
      setLayout((current) => {
        const next = cloneLayout(current);
        const guides =
          axis === "x" ? next.guides.vertical : next.guides.horizontal;
        guides[index] = value;
        layoutRef.current = next;
        return next;
      });
    },
    [layoutRef, setLayout],
  );

  const startGuideDrag = useCallback(
    (axis: GuideAxis, event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const value = coordinateFromPointer(event, axis);
      setLayout((current) => {
        const next = cloneLayout(current);
        const guides =
          axis === "x" ? next.guides.vertical : next.guides.horizontal;
        setGuideDrag({ axis, index: guides.length });
        guides.push(value);
        layoutRef.current = next;
        return next;
      });
    },
    [coordinateFromPointer, layoutRef, setLayout],
  );

  const startExistingGuideDrag = useCallback(
    (axis: GuideAxis, index: number, event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setGuideDrag({ axis, index });
    },
    [],
  );

  useEffect(() => {
    if (!guideDrag) return;
    const handleMouseMove = (event: MouseEvent) => {
      moveGuide(
        guideDrag.axis,
        guideDrag.index,
        coordinateFromPointer(event, guideDrag.axis),
      );
    };
    const handleMouseUp = () => setGuideDrag(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [coordinateFromPointer, guideDrag, moveGuide]);

  return {
    previewContainerRef,
    previewRef,
    rulerOrigin,
    startExistingGuideDrag,
    startGuideDrag,
    updateRulerOrigin,
  };
}
