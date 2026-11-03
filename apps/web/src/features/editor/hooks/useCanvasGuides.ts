import { snapGuidePosition, type GuideLine } from '@pencel/editor-core';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import type { ActiveGuideDragState } from '../components/Ruler/CanvasGuidesOverlay/index.js';

export interface UseCanvasGuidesOptions {
  readonly viewportRef: RefObject<HTMLDivElement | null>;
  readonly artboardRef?: RefObject<HTMLDivElement | null>;
  readonly pageDimensions: { readonly width: number; readonly height: number };
  readonly zoom: number;
  readonly pan: { readonly x: number; readonly y: number };
  readonly setPan: (pan: { x: number; y: number }) => void;
  readonly onResetZoom: () => void;
}

export interface UseCanvasGuidesResult {
  readonly showRulers: boolean;
  readonly showGuides: boolean;
  readonly toggleRulers: () => void;
  readonly toggleGuides: () => void;
  readonly guides: readonly GuideLine[];
  readonly activeGuideDrag: ActiveGuideDragState | null;
  readonly mousePos: { readonly x: number; readonly y: number } | null;
  readonly viewportDimensions: { readonly width: number; readonly height: number };
  readonly artboardOrigin: { readonly x: number; readonly y: number };
  readonly handleStartCreateGuide: (
    orientation: 'horizontal' | 'vertical',
    startClientPos: { clientX: number; clientY: number },
  ) => void;
  readonly handleStartDragExistingGuide: (guide: GuideLine, e: ReactMouseEvent) => void;
  readonly handleDeleteGuide: (id: string) => void;
  readonly setGuideLines: (guides: readonly GuideLine[]) => void;
  readonly handleResetOrigin: () => void;
  readonly handleViewportMouseMove: (e: ReactMouseEvent<HTMLDivElement>) => void;
  readonly handleViewportMouseLeave: () => void;
}

export function useCanvasGuides({
  viewportRef,
  artboardRef,
  pageDimensions,
  zoom,
  pan,
  setPan,
  onResetZoom,
}: UseCanvasGuidesOptions): UseCanvasGuidesResult {
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [guides, setGuides] = useState<readonly GuideLine[]>([]);
  const [activeGuideDrag, setActiveGuideDrag] = useState<ActiveGuideDragState | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 });
  const [measuredOrigin, setMeasuredOrigin] = useState<{ x: number; y: number } | null>(null);

  const toggleRulers = useCallback(() => setShowRulers((prev) => !prev), []);
  const toggleGuides = useCallback(() => setShowGuides((prev) => !prev), []);

  // Safe measurement of viewport size with SSR/JSDOM fallback
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateSize = (): void => {
      const rect = el.getBoundingClientRect();
      setViewportDimensions({ width: rect.width, height: rect.height });
    };
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [viewportRef]);

  const displayWidth = Math.max(1, Math.round(pageDimensions.width * zoom));
  const displayHeight = Math.max(1, Math.round(pageDimensions.height * zoom));

  useEffect(() => {
    if (!artboardRef?.current || !viewportRef.current) return;
    const updateOrigin = (): void => {
      if (!artboardRef?.current || !viewportRef.current) return;
      const vRect = viewportRef.current.getBoundingClientRect();
      const aRect = artboardRef.current.getBoundingClientRect();
      if (vRect.width > 0 && vRect.height > 0) {
        setMeasuredOrigin({
          x: Math.round(aRect.left - vRect.left),
          y: Math.round(aRect.top - vRect.top),
        });
      }
    };
    updateOrigin();
  }, [artboardRef, viewportRef, pan, zoom, pageDimensions, viewportDimensions]);

  const mathOrigin = useMemo(
    () => ({
      x: Math.round(viewportDimensions.width / 2 + pan.x - displayWidth / 2),
      y: Math.round(viewportDimensions.height / 2 + pan.y - displayHeight / 2),
    }),
    [
      viewportDimensions.width,
      viewportDimensions.height,
      pan.x,
      pan.y,
      displayWidth,
      displayHeight,
    ],
  );

  const artboardOrigin = measuredOrigin ?? mathOrigin;

  // Dragging interaction for guides
  useEffect(() => {
    if (!activeGuideDrag) return;

    const handleWindowMouseMove = (e: MouseEvent): void => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const originX = artboardOrigin.x;
      const originY = artboardOrigin.y;

      if (activeGuideDrag.orientation === 'horizontal') {
        const rawDoc = (screenY - originY) / zoom;
        const snap = snapGuidePosition({
          position: rawDoc,
          orientation: 'horizontal',
          pageSize: pageDimensions,
          existingGuides: guides,
          currentGuideId: activeGuideDrag.id,
          zoom,
        });
        const isDeleting = screenY <= 24 || screenY >= rect.height;
        setActiveGuideDrag((prev) =>
          prev
            ? {
                ...prev,
                currentDocPos: snap.position,
                isSnapped: snap.isSnapped,
                snappedTarget: snap.snappedTarget,
                isDeleting,
                screenX,
                screenY,
              }
            : null,
        );
      } else {
        const rawDoc = (screenX - originX) / zoom;
        const snap = snapGuidePosition({
          position: rawDoc,
          orientation: 'vertical',
          pageSize: pageDimensions,
          existingGuides: guides,
          currentGuideId: activeGuideDrag.id,
          zoom,
        });
        const isDeleting = screenX <= 24 || screenX >= rect.width;
        setActiveGuideDrag((prev) =>
          prev
            ? {
                ...prev,
                currentDocPos: snap.position,
                isSnapped: snap.isSnapped,
                snappedTarget: snap.snappedTarget,
                isDeleting,
                screenX,
                screenY,
              }
            : null,
        );
      }
    };

    const handleWindowMouseUp = (): void => {
      setActiveGuideDrag((drag) => {
        if (!drag) return null;
        if (drag.isDeleting) {
          if (drag.id) {
            setGuides((prev) => prev.filter((g) => g.id !== drag.id));
          }
        } else {
          if (drag.id) {
            setGuides((prev) =>
              prev.map((g) => (g.id === drag.id ? { ...g, position: drag.currentDocPos } : g)),
            );
          } else {
            const newGuide: GuideLine = {
              id: `guide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              orientation: drag.orientation,
              position: drag.currentDocPos,
            };
            setGuides((prev) => [...prev, newGuide]);
          }
        }
        return null;
      });
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    activeGuideDrag,
    pageDimensions,
    zoom,
    pan,
    guides,
    viewportRef,
    displayWidth,
    displayHeight,
    artboardOrigin,
  ]);

  const handleStartCreateGuide = useCallback(
    (
      orientation: 'horizontal' | 'vertical',
      startClientPos: { clientX: number; clientY: number },
    ): void => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const screenX = startClientPos.clientX - rect.left;
      const screenY = startClientPos.clientY - rect.top;

      const rawDoc =
        orientation === 'horizontal'
          ? (screenY - artboardOrigin.y) / zoom
          : (screenX - artboardOrigin.x) / zoom;

      const snap = snapGuidePosition({
        position: rawDoc,
        orientation,
        pageSize: pageDimensions,
        existingGuides: guides,
        zoom,
      });

      setActiveGuideDrag({
        orientation,
        currentDocPos: snap.position,
        isSnapped: snap.isSnapped,
        snappedTarget: snap.snappedTarget,
        isDeleting: false,
        screenX,
        screenY,
      });
    },
    [viewportRef, artboardOrigin, zoom, pageDimensions, guides],
  );

  const handleStartDragExistingGuide = useCallback(
    (guide: GuideLine, e: ReactMouseEvent): void => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      setActiveGuideDrag({
        id: guide.id,
        orientation: guide.orientation,
        currentDocPos: guide.position,
        isSnapped: false,
        isDeleting: false,
        screenX,
        screenY,
      });
    },
    [viewportRef],
  );

  const handleDeleteGuide = useCallback((id: string): void => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const handleResetOrigin = useCallback((): void => {
    setPan({ x: 0, y: 0 });
    onResetZoom();
  }, [setPan, onResetZoom]);

  const handleViewportMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleViewportMouseLeave = useCallback((): void => {
    setMousePos(null);
  }, []);

  return {
    showRulers,
    showGuides,
    toggleRulers,
    toggleGuides,
    guides,
    activeGuideDrag,
    mousePos,
    viewportDimensions,
    artboardOrigin,
    handleStartCreateGuide,
    handleStartDragExistingGuide,
    handleDeleteGuide,
    setGuideLines: setGuides,
    handleResetOrigin,
    handleViewportMouseMove,
    handleViewportMouseLeave,
  };
}
