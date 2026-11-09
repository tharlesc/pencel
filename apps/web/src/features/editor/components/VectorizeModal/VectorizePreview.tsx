import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../components/ui/index.js';
import { stripSvgBackground } from '../../engine/vectorTraceEngine.js';
import styles from './VectorizeModal.module.css';

export interface VectorizePreviewProps {
  readonly originalSrc: string;
  readonly vectorSvg?: string;
  readonly removeBackground?: boolean;
  readonly isProcessing: boolean;
  readonly progressPhase?: string;
  readonly progressFraction?: number;
}

type ViewMode = 'vector' | 'split' | 'original';
type StageBg = 'checkerboard' | 'light' | 'dark';

export function VectorizePreview({
  originalSrc,
  vectorSvg,
  removeBackground = false,
  isProcessing,
  progressPhase,
  progressFraction,
}: VectorizePreviewProps): ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('vector');
  const [stageBg, setStageBg] = useState<StageBg>('checkerboard');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });

  const renderedSvg = removeBackground && vectorSvg ? stripSvgBackground(vectorSvg) : vectorSvg;

  const calculateFitZoom = useCallback((w: number, h: number): number => {
    if (!viewportRef.current || w <= 0 || h <= 0) return 1;
    const pad = 48;
    const availW = Math.max(100, viewportRef.current.clientWidth - pad);
    const availH = Math.max(100, viewportRef.current.clientHeight - pad);
    const scale = Math.min(availW / w, availH / h, 1);
    return Math.max(0.1, Number(scale.toFixed(2)));
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 800;
      setNaturalSize({ width: w, height: h });
      setZoomLevel(calculateFitZoom(w, h));
    };
    img.src = originalSrc;
  }, [originalSrc, calculateFitZoom]);

  const phaseLabel =
    (progressPhase &&
      {
        segment: 'Agrupando paletas de cores...',
        compose: 'Ajustando splines cúbicos de Bézier...',
        optimize: 'Otimizando geometria vetorial...',
      }[progressPhase]) ||
    'Processando vetorização...';

  const percentProgress = progressFraction !== undefined ? Math.round(progressFraction * 100) : 0;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoomLevel((prev) => Math.max(0.15, Math.min(4, Number((prev + delta).toFixed(2)))));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    setIsPanning(true);
    panStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!isPanning) return;
    setPan({
      x: Math.round(panStartRef.current.panX + (e.clientX - panStartRef.current.mouseX)),
      y: Math.round(panStartRef.current.panY + (e.clientY - panStartRef.current.mouseY)),
    });
  };

  const handleMouseUp = (): void => setIsPanning(false);

  const handleResetZoomAndPan = (): void => {
    setZoomLevel(naturalSize ? calculateFitZoom(naturalSize.width, naturalSize.height) : 1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.viewModeTabs}>
          {(['vector', 'split', 'original'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={[styles.viewTab, viewMode === m ? styles.viewTabActive : ''].join(' ')}
              onClick={() => setViewMode(m)}
              disabled={m !== 'original' && (!vectorSvg || isProcessing)}
            >
              {m === 'vector' ? 'Vetor SVG' : m === 'split' ? 'Antes / Depois' : 'Original'}
            </button>
          ))}
        </div>

        <div className={styles.zoomControlGroup}>
          <div className={styles.bgControlGroup} title="Cor de fundo do visualizador">
            {(
              [
                ['checkerboard', 'sparkles', 'Fundo Xadrez'],
                ['light', 'sun', 'Fundo Claro'],
                ['dark', 'moon', 'Fundo Escuro'],
              ] as const
            ).map(([b, icon, title]) => (
              <button
                key={b}
                type="button"
                className={[styles.bgBtn, stageBg === b ? styles.bgBtnActive : ''].join(' ')}
                onClick={() => setStageBg(b)}
                title={title}
                aria-label={title}
              >
                <Icon name={icon} size="xs" />
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon="zoomOut"
            onClick={() => setZoomLevel((z) => Math.max(0.15, Number((z - 0.25).toFixed(2))))}
            aria-label="Reduzir zoom do preview"
          />
          <span className={styles.zoomDisplay}>{Math.round(zoomLevel * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            icon="zoomIn"
            onClick={() => setZoomLevel((z) => Math.min(4, Number((z + 0.25).toFixed(2))))}
            aria-label="Aumentar zoom do preview"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoomAndPan}
            aria-label="Ajustar e redefinir zoom"
            title="Enquadrar arte no visualizador"
          >
            Ajustar
          </Button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={[
          styles.viewportStage,
          stageBg === 'checkerboard' ? styles.viewportStageCheckerboard : '',
          stageBg === 'light' ? styles.viewportStageLight : '',
          stageBg === 'dark' ? styles.viewportStageDark : '',
          isPanning ? styles.viewportStagePanning : '',
          zoomLevel > 1 ? styles.viewportStageZoomed : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className={styles.stageContent}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
          }}
        >
          {viewMode === 'original' && (
            <img src={originalSrc} alt="Original raster" className={styles.previewImage} />
          )}

          {viewMode === 'vector' && renderedSvg && (
            <div
              className={styles.svgWrapper}
              style={{
                width: naturalSize ? `${naturalSize.width}px` : 'auto',
                height: naturalSize ? `${naturalSize.height}px` : 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              dangerouslySetInnerHTML={{ __html: renderedSvg }}
              aria-label="Vetor SVG gerado"
            />
          )}

          {viewMode === 'split' && (
            <div className={styles.splitViewer}>
              <div className={styles.splitBadgeOriginal}>Original</div>
              <div className={styles.splitBadgeVector}>Vetor SVG</div>

              <img src={originalSrc} alt="Original raster" className={styles.previewImage} />

              {renderedSvg && (
                <div
                  className={styles.splitOverlay}
                  style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
                >
                  <div
                    className={styles.svgWrapper}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                  />
                </div>
              )}

              {renderedSvg && !isProcessing && (
                <div className={styles.splitHandle} style={{ left: `${splitPos}%` }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className={styles.splitSliderControl}
                    aria-label="Posição do divisor antes e depois"
                  />
                  <div className={styles.splitLine} />
                  <div className={styles.splitKnob}>
                    <Icon name="chevronLeft" size="xs" />
                    <Icon name="chevronRight" size="xs" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isProcessing && (
          <div className={styles.processingOverlay}>
            <div className={styles.spinnerCard}>
              <div className={styles.spinnerRing} />
              <div className={styles.progressTextGroup}>
                <span className={styles.progressStatus}>{phaseLabel}</span>
                {progressFraction !== undefined && (
                  <span className={styles.progressPercent}>{percentProgress}%</span>
                )}
              </div>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${percentProgress}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.previewFooterBar}>
        <span className={styles.engineBadge}>
          <Icon name="sparkles" size="xs" tone="accent" />
          <span>Motor WebAssembly VTracer (Rust Otimizado)</span>
        </span>
        <span className={styles.securityNote}>Role o mouse para zoom • Arraste para navegar</span>
      </div>
    </div>
  );
}
