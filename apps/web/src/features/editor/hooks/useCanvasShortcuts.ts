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

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.getAttribute('data-fabric') === 'textarea') {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

function isImageFileName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(name);
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
      if (isTextInputTarget(e.target)) return;
      if (!engine) return;

      const isFabricTextEditing =
        e.target instanceof HTMLElement && e.target.getAttribute('data-fabric') === 'textarea';

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Collect image files from items and files
      const imageFiles: File[] = [];
      if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item && item.kind === 'file') {
            const file = item.getAsFile();
            if (file && (file.type.startsWith('image/') || isImageFileName(file.name))) {
              imageFiles.push(file);
            }
          }
        }
      }

      if (imageFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file && (file.type.startsWith('image/') || isImageFileName(file.name))) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        for (const file of imageFiles) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            if (typeof dataUrl === 'string') {
              const label = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Imagem Colada';
              void engine.addImageFromUrl(dataUrl, label || 'Imagem Colada');
            }
          };
          reader.readAsDataURL(file);
        }
        return;
      }

      // 2. Check for HTML <img> tag
      const html = clipboardData.getData('text/html');
      if (html) {
        const match = /<img\s+[^>]*src=["']([^"']+)["']/i.exec(html);
        if (match && match[1]) {
          e.preventDefault();
          void engine.addImageFromUrl(match[1], 'Imagem Colada');
          return;
        }
      }

      // 3. Check for text or SVG
      const text = clipboardData.getData('text/plain');
      if (text && text.trim()) {
        if (isFabricTextEditing) {
          return;
        }

        const trimmed = text.trim();

        if (
          trimmed.startsWith('<svg') ||
          (trimmed.startsWith('<?xml') && trimmed.includes('<svg'))
        ) {
          e.preventDefault();
          const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
          void engine.addImageFromUrl(dataUri, 'Vetor SVG');
          return;
        }

        if (trimmed.startsWith('data:image/')) {
          e.preventDefault();
          void engine.addImageFromUrl(trimmed, 'Imagem Colada');
          return;
        }

        e.preventDefault();
        engine.addText({
          text: trimmed,
          fontSize: trimmed.length > 80 ? 24 : 36,
        });
        return;
      }

      // 4. Fallback: Internal canvas copy
      if (!isFabricTextEditing && engine.hasInternalClipboard?.()) {
        e.preventDefault();
        void engine.pasteCopied();
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
