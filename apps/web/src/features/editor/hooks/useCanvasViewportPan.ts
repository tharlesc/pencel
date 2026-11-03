import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';

export interface UseCanvasViewportPanOptions {
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onDeselectAll?: () => void;
  readonly artboardRef: RefObject<HTMLDivElement | null>;
}

export interface UseCanvasViewportPanResult {
  readonly viewportRef: RefObject<HTMLDivElement | null>;
  readonly pan: { x: number; y: number };
  readonly setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  readonly isPanning: boolean;
  readonly isSpaceDown: boolean;
  readonly handleSpaceStateChange: (isDown: boolean) => void;
  readonly handleMouseDown: (e: ReactMouseEvent<HTMLDivElement>) => void;
}

export function useCanvasViewportPan({
  onZoomIn,
  onZoomOut,
  onDeselectAll,
  artboardRef,
}: UseCanvasViewportPanOptions): UseCanvasViewportPanResult {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const handleSpaceStateChange = useCallback((isDown: boolean) => {
    setIsSpaceDown(isDown);
    if (!isDown) setIsPanning(false);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let accumulatedDelta = 0;
    let rafId: number | null = null;

    const handleWheel = (e: WheelEvent): void => {
      if (e.altKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        accumulatedDelta += e.deltaY;
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            if (Math.abs(accumulatedDelta) >= 15) {
              if (accumulatedDelta < 0) {
                onZoomIn();
              } else {
                onZoomOut();
              }
              accumulatedDelta = 0;
            }
            rafId = null;
          });
        }
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [onZoomIn, onZoomOut]);

  useEffect(() => {
    if (!isPanning) return;
    const handleWindowMouseMove = (e: MouseEvent): void => {
      setPan({
        x: Math.round(dragStartRef.current.panX + (e.clientX - dragStartRef.current.x)),
        y: Math.round(dragStartRef.current.panY + (e.clientY - dragStartRef.current.y)),
      });
    };
    const handleWindowMouseUp = (): void => setIsPanning(false);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>): void => {
    if (isSpaceDown || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }
    const isInsideArtboard = Boolean(
      artboardRef.current && artboardRef.current.contains(e.target as Node),
    );
    if (!isInsideArtboard && e.button === 0) {
      onDeselectAll?.();
    }
  };

  return {
    viewportRef,
    pan,
    setPan,
    isPanning,
    isSpaceDown,
    handleSpaceStateChange,
    handleMouseDown,
  };
}
