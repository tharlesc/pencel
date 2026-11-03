/**
 * Utilities for rendering PDF/AI document previews onto the artboard.
 */

interface PdfJsGlobal {
  getDocument: (opts: { data: ArrayBuffer }) => {
    promise: Promise<{
      getPage: (pageNum: number) => Promise<{
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (opts: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
      }>;
    }>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

/**
 * Loads PDF.js on demand and renders the first page of a PDF or AI document into a PNG Data URL.
 */
export async function renderPdfFileToDataUrl(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const win = window as unknown as { pdfjsLib?: PdfJsGlobal };

    if (!win.pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('PDF.js could not be loaded'));
        document.head.appendChild(script);
      });
    }

    const pdfLib = (window as unknown as { pdfjsLib?: PdfJsGlobal }).pdfjsLib;
    if (!pdfLib) return null;
    pdfLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const loadingTask = pdfLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) return null;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('PDF document render failed:', err);
    return null;
  }
}
