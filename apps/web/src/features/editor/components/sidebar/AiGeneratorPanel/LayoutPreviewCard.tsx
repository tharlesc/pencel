import type { Dimensions } from '@pencel/shared-types';
import type { ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import type {
  CanvasLayoutElementDto,
  GeneratedLayoutDto,
} from '../../../services/aiLayoutService.js';
import styles from './AiGeneratorPanel.module.css';

export interface LayoutPreviewCardProps {
  readonly layout: GeneratedLayoutDto;
  readonly dimensions: Dimensions;
  readonly label?: string;
  readonly isActive: boolean;
  readonly onSelect: (layout: GeneratedLayoutDto) => void;
  readonly onApplyToNewArtboard?: (layout: GeneratedLayoutDto) => void;
}

function renderMiniElement(el: CanvasLayoutElementDto, idx: number): ReactElement | null {
  const fill = el.fillGradient?.stops[0]?.color ?? el.fill ?? '#F8FAFC';
  const opacity = el.opacity ?? 1;
  const transform =
    el.angle && el.angle !== 0
      ? `rotate(${el.angle} ${el.left + (el.width ?? 0) / 2} ${el.top + (el.height ?? 0) / 2})`
      : undefined;

  switch (el.type) {
    case 'circle': {
      const r = el.radius ?? (el.width ?? 80) / 2;
      return (
        <circle
          key={el.id || idx}
          cx={el.left + r}
          cy={el.top + r}
          r={r}
          fill={fill}
          fillOpacity={opacity}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
        />
      );
    }
    case 'ellipse': {
      const rx = el.rx ?? (el.width ?? 100) / 2;
      const ry = el.ry ?? (el.height ?? 60) / 2;
      return (
        <ellipse
          key={el.id || idx}
          cx={el.left + rx}
          cy={el.top + ry}
          rx={rx}
          ry={ry}
          fill={fill}
          fillOpacity={opacity}
          transform={transform}
        />
      );
    }
    case 'triangle': {
      const w = el.width ?? 100;
      const h = el.height ?? 100;
      const pts = `${el.left + w / 2},${el.top} ${el.left + w},${el.top + h} ${el.left},${el.top + h}`;
      return (
        <polygon
          key={el.id || idx}
          points={pts}
          fill={fill}
          fillOpacity={opacity}
          transform={transform}
        />
      );
    }
    case 'polygon': {
      const r = el.radius ?? Math.min(el.width ?? 100, el.height ?? 100) / 2;
      return (
        <circle
          key={el.id || idx}
          cx={el.left + r}
          cy={el.top + r}
          r={r}
          fill={fill}
          fillOpacity={opacity}
        />
      );
    }
    case 'image': {
      const w = el.width ?? 300;
      const h = el.height ?? 200;
      const r = el.borderRadius ?? el.rx ?? 0;
      return (
        <g key={el.id || idx} opacity={opacity}>
          <rect
            x={el.left}
            y={el.top}
            width={w}
            height={h}
            rx={r}
            ry={r}
            fill={fill}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
          />
          <circle
            cx={el.left + w * 0.34}
            cy={el.top + h * 0.38}
            r={Math.min(w, h) * 0.12}
            fill="#F8FAFC"
            fillOpacity={0.22}
          />
          <polygon
            points={`${el.left + w * 0.15},${el.top + h * 0.85} ${el.left + w * 0.45},${el.top + h * 0.48} ${el.left + w * 0.72},${el.top + h * 0.78} ${el.left + w * 0.88},${el.top + h * 0.62} ${el.left + w * 0.92},${el.top + h * 0.85}`}
            fill="#F8FAFC"
            fillOpacity={0.18}
          />
        </g>
      );
    }
    case 'textbox': {
      const w = el.width ?? 300;
      const fs = el.fontSize ?? 28;
      const lineH = Math.max(10, Math.round(fs * 0.78));
      const align = el.textAlign ?? 'left';
      const barW = Math.min(w, Math.max(w * 0.45, Math.min((el.text?.length ?? 8) * fs * 0.48, w)));
      const barX =
        align === 'center'
          ? el.left + (w - barW) / 2
          : align === 'right'
            ? el.left + (w - barW)
            : el.left;
      const isMultiLine = (el.text?.length ?? 0) * fs * 0.52 > w * 1.15;
      const isHollow = el.fill === 'transparent' && Boolean(el.stroke);

      return (
        <g key={el.id || idx} opacity={opacity} transform={transform}>
          {el.textBackgroundColor ? (
            <rect
              x={barX - 4}
              y={el.top - 4}
              width={barW + 8}
              height={lineH + 8}
              rx={4}
              fill={el.textBackgroundColor}
            />
          ) : null}
          <rect
            x={barX}
            y={el.top}
            width={barW}
            height={lineH}
            rx={Math.round(lineH * 0.35)}
            fill={isHollow ? 'none' : fill}
            stroke={isHollow ? el.stroke : undefined}
            strokeWidth={isHollow ? Math.max(2, el.strokeWidth ?? 3) : undefined}
          />
          {isMultiLine ? (
            <rect
              x={align === 'center' ? el.left + w * 0.14 : barX}
              y={el.top + Math.round(fs * 1.15)}
              width={Math.round(barW * 0.72)}
              height={lineH}
              rx={Math.round(lineH * 0.35)}
              fill={isHollow ? 'none' : fill}
              stroke={isHollow ? el.stroke : undefined}
              strokeWidth={isHollow ? Math.max(2, el.strokeWidth ?? 3) : undefined}
              fillOpacity={0.85}
            />
          ) : null}
        </g>
      );
    }
    case 'rect':
    case 'line':
    default: {
      return (
        <rect
          key={el.id || idx}
          x={el.left}
          y={el.top}
          width={el.width ?? 100}
          height={el.height ?? (el.type === 'line' ? 4 : 100)}
          rx={el.rx ?? 0}
          ry={el.ry ?? el.rx ?? 0}
          fill={fill}
          fillOpacity={opacity}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          transform={transform}
        />
      );
    }
  }
}

export function LayoutPreviewCard({
  layout,
  dimensions,
  label,
  isActive,
  onSelect,
  onApplyToNewArtboard,
}: LayoutPreviewCardProps): ReactElement {
  const { t } = useI18n();
  const gradId = `ai-prev-bg-${(layout.id ?? label ?? '0').replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const swatches = (layout.palette ?? [layout.backgroundColor]).slice(0, 4);

  return (
    <div
      className={[styles.conceptCard, isActive ? styles.conceptCardActive : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={styles.conceptPreviewBtn}
        onClick={() => onSelect(layout)}
        aria-pressed={isActive}
        aria-label={`${label ? `${label}: ` : ''}${layout.title}`}
      >
        <div className={styles.conceptThumbFrame}>
          <svg
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className={styles.conceptSvg}
            aria-hidden="true"
            preserveAspectRatio="xMidYMid meet"
          >
            {layout.backgroundGradient ? (
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  {layout.backgroundGradient.stops.map((stop, idx) => (
                    <stop
                      key={idx}
                      offset={`${Math.round(stop.offset * 100)}%`}
                      stopColor={stop.color}
                      stopOpacity={stop.opacity ?? 1}
                    />
                  ))}
                </linearGradient>
              </defs>
            ) : null}
            <rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill={layout.backgroundGradient ? `url(#${gradId})` : layout.backgroundColor}
            />
            {layout.elements.slice(0, 22).map((el, idx) => renderMiniElement(el, idx))}
          </svg>
          {label ? <span className={styles.conceptIndexBadge}>{label}</span> : null}
        </div>

        <div className={styles.conceptMeta}>
          <span className={styles.conceptTitle}>{layout.title}</span>
          <div className={styles.conceptMetaBottom}>
            {layout.archetype ? (
              <span className={styles.conceptArchetypeTag}>{layout.archetype}</span>
            ) : null}
            <div className={styles.swatchDotsRow} aria-hidden="true">
              {swatches.map((hex, i) => (
                <span
                  key={`${hex}-${i}`}
                  className={styles.swatchDot}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </button>

      {onApplyToNewArtboard ? (
        <button
          type="button"
          className={styles.conceptNewPageBtn}
          onClick={() => onApplyToNewArtboard(layout)}
          title={t('ai.applyToNewArtboard')}
          aria-label={`${t('ai.applyToNewArtboard')}: ${layout.title}`}
        >
          <Icon name="filePlus" size="xs" />
        </button>
      ) : null}
    </div>
  );
}
