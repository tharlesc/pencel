import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type RefObject,
} from 'react';
import type { UseCanvasEngineResult } from './useCanvasEngine.js';

export interface UseCanvasDropZoneOptions {
  readonly engine: UseCanvasEngineResult | null | undefined;
  readonly artboardRef: RefObject<HTMLDivElement | null>;
  readonly zoom: number;
}

export interface UseCanvasDropZoneResult {
  readonly isDragOver: boolean;
  readonly handleDragEnter: (e: ReactDragEvent<HTMLDivElement>) => void;
  readonly handleDragOver: (e: ReactDragEvent<HTMLDivElement>) => void;
  readonly handleDragLeave: (e: ReactDragEvent<HTMLDivElement>) => void;
  readonly handleDrop: (e: ReactDragEvent<HTMLDivElement>) => Promise<void>;
}

export function isImageFileName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Falha ao ler o arquivo como data URL'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export async function processDroppedData(
  dataTransfer: DataTransfer,
  engine: UseCanvasEngineResult,
  position?: { x: number; y: number },
): Promise<void> {
  // 1. Collect image files from dataTransfer.files and items
  const imageFiles: File[] = [];

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file && (file.type.startsWith('image/') || isImageFileName(file.name))) {
        imageFiles.push(file);
      }
    }
  }

  if (imageFiles.length === 0 && dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item && item.kind === 'file') {
        const file = item.getAsFile();
        if (file && (file.type.startsWith('image/') || isImageFileName(file.name))) {
          imageFiles.push(file);
        }
      }
    }
  }

  if (imageFiles.length > 0) {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file) continue;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const pos = position ? { x: position.x + i * 24, y: position.y + i * 24 } : undefined;
        const name = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Imagem';
        await engine.addImageFromUrl(dataUrl, name, undefined, pos);
      } catch (err) {
        console.warn('Erro ao carregar arquivo de imagem arrastado:', err);
      }
    }
    return;
  }

  // 2. Check for image URI list or HTML img tag
  const uriList = dataTransfer.getData('text/uri-list');
  if (uriList && (isImageFileName(uriList) || uriList.startsWith('data:image/'))) {
    await engine.addImageFromUrl(uriList.trim(), 'Imagem', undefined, position);
    return;
  }

  const html = dataTransfer.getData('text/html');
  if (html) {
    const match = /<img\s+[^>]*src=["']([^"']+)["']/i.exec(html);
    if (match && match[1]) {
      await engine.addImageFromUrl(match[1], 'Imagem', undefined, position);
      return;
    }
  }

  // 3. Check for text or SVG
  const text = dataTransfer.getData('text/plain');
  if (text && text.trim()) {
    const trimmed = text.trim();
    if (trimmed.startsWith('<svg') || (trimmed.startsWith('<?xml') && trimmed.includes('<svg'))) {
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
      await engine.addImageFromUrl(dataUri, 'Vetor SVG', undefined, position);
      return;
    }

    if (trimmed.startsWith('data:image/') || isImageFileName(trimmed)) {
      await engine.addImageFromUrl(trimmed, 'Imagem', undefined, position);
      return;
    }

    engine.addText({
      text: trimmed,
      fontSize: trimmed.length > 80 ? 24 : 36,
      position,
    });
  }
}

export function useCanvasDropZone({
  engine,
  artboardRef,
  zoom,
}: UseCanvasDropZoneOptions): UseCanvasDropZoneResult {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Global window listeners to prevent browser from navigating away on dropped files
  useEffect(() => {
    const preventDefaultWindow = (e: DragEvent): void => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefaultWindow);
    window.addEventListener('drop', preventDefaultWindow);
    return () => {
      window.removeEventListener('dragover', preventDefaultWindow);
      window.removeEventListener('drop', preventDefaultWindow);
    };
  }, []);

  const handleDragEnter = useCallback((e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer && e.dataTransfer.types.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: ReactDragEvent<HTMLDivElement>): Promise<void> => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (!engine) return;

      let dropPosition: { x: number; y: number } | undefined;
      if (artboardRef.current) {
        const rect = artboardRef.current.getBoundingClientRect();
        const effectiveZoom = zoom > 0 ? zoom : 1;
        dropPosition = {
          x: Math.round((e.clientX - rect.left) / effectiveZoom),
          y: Math.round((e.clientY - rect.top) / effectiveZoom),
        };
      }

      await processDroppedData(e.dataTransfer, engine, dropPosition);
    },
    [engine, artboardRef, zoom],
  );

  return {
    isDragOver,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
