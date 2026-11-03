import { useEffect } from 'react';
import type { UseCanvasEngineResult } from './useCanvasEngine.js';

interface UseCanvasShortcutsOptions {
  readonly engine: UseCanvasEngineResult | null | undefined;
  readonly onSpaceStateChange: (isDown: boolean) => void;
  readonly onToggleRulers?: () => void;
  readonly onToggleGuides?: () => void;
  readonly onOpenNewDocumentModal?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function useCanvasShortcuts({
  engine,
  onSpaceStateChange,
  onToggleRulers,
  onToggleGuides,
  onOpenNewDocumentModal,
}: UseCanvasShortcutsOptions): void {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent): void => {
      if (isEditableTarget(e.target)) return;

      const items = e.clipboardData?.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                if (dataUrl && engine) {
                  void engine.addImageFromUrl(dataUrl, 'Imagem Colada');
                }
              };
              reader.readAsDataURL(file);
              return;
            }
          }
        }
      }

      const text = e.clipboardData?.getData('text/plain');
      if (text && text.trim() && engine) {
        e.preventDefault();
        engine.addText({ text: text.trim(), fontSize: 32 });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [engine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !e.repeat) {
        if (isEditableTarget(e.target)) return;
        onSpaceStateChange(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        onToggleRulers?.();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        onOpenNewDocumentModal?.();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === ';' || e.key === 'ç')) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        onToggleGuides?.();
      } else if (
        (e.key === 't' || e.key === 'T') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.repeat
      ) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.addText({ text: 'Adicionar texto', fontSize: 48 });
      } else if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.setToolMode('select');
      } else if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.setToolMode('directSelect');
      } else if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.setToolMode('pen');
      } else if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.setToolMode('brush');
      } else if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.setToolMode('eraser');
      } else if (e.shiftKey && (e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        engine?.performBooleanOperation('union');
      } else if (e.key === 'Enter') {
        if (isEditableTarget(e.target)) return;
        if (engine?.getToolMode?.() === 'pen') {
          e.preventDefault();
          engine.finishPenPath(true);
        }
      } else if (e.key === 'Escape') {
        if (engine?.getToolMode?.() === 'pen') {
          e.preventDefault();
          engine.finishPenPath(false);
          engine.setToolMode('select');
        }
      } else if (
        (e.key === '[' || e.code === 'BracketLeft') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        const current = engine?.getBrushWidth() ?? 8;
        const next = Math.max(1, current <= 10 ? current - 2 : current - 4);
        engine?.setDrawingMode(true, engine.getDrawingTool() === 'eraser' ? 'eraser' : 'brush', {
          width: next,
        });
      } else if (
        (e.key === ']' || e.code === 'BracketRight') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        const current = engine?.getBrushWidth() ?? 8;
        const next = Math.min(128, current < 10 ? current + 2 : current + 4);
        engine?.setDrawingMode(true, engine.getDrawingTool() === 'eraser' ? 'eraser' : 'brush', {
          width: next,
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        onSpaceStateChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onSpaceStateChange, onToggleRulers, onToggleGuides, onOpenNewDocumentModal]);
}
