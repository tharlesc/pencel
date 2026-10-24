import { useId, useMemo, useRef, useState, type ReactElement, type Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import { hexToHsv, hsvToRgb } from './colorMath.js';
import styles from './ColorPicker.module.css';

/**
 * Display modes for `<ColorPicker />`.
 */
export type ColorPickerVariant = 'popover' | 'inline';

export interface ColorPickerProps {
  readonly color: string;
  readonly onChange: (hex: string) => void;
  readonly onClose?: () => void;
  readonly showTintsShades?: boolean;
  readonly variant?: ColorPickerVariant;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

const STUDIO_QUICK_SWATCHES = [
  { id: 'ink', value: '#1D1D1F', className: 'swatchInk' },
  { id: 'paper', value: '#F8FAFC', className: 'swatchPaper' },
  { id: 'blue', value: '#0066CC', className: 'swatchBlue' },
  { id: 'emerald', value: '#16A34A', className: 'swatchEmerald' },
  { id: 'amber', value: '#D97706', className: 'swatchAmber' },
  { id: 'rose', value: '#DC2626', className: 'swatchRose' },
  { id: 'violet', value: '#6D28D9', className: 'swatchViolet' },
  { id: 'gold', value: '#EAB308', className: 'swatchGold' },
] as const;

export function ColorPicker({
  color,
  onChange,
  onClose,
  variant = 'popover',
  className,
  ref,
}: ColorPickerProps): ReactElement {
  const spectrumBoxRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  const [prevColor, setPrevColor] = useState(color);
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(() => color.replace('#', '').toUpperCase());

  if (color !== prevColor) {
    setPrevColor(color);
    setHsv(hexToHsv(color));
    setHexInput(color.replace('#', '').toUpperCase());
  }

  const { r, g, b, hex } = useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v), [hsv]);
  const pureHueHex = useMemo(() => hsvToRgb(hsv.h, 1, 1).hex, [hsv.h]);

  const handleMapPointer = (clientX: number, clientY: number): void => {
    const el = spectrumBoxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = rect.width > 0 ? x / rect.width : 0;
    const v = rect.height > 0 ? 1 - y / rect.height : 0;

    const nextHsv = { ...hsv, s, v };
    setHsv(nextHsv);
    const result = hsvToRgb(nextHsv.h, s, v);
    setHexInput(result.hex.replace('#', ''));
    onChange(result.hex);
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    handleMapPointer(e.clientX, e.clientY);

    const onMove = (moveEvent: MouseEvent): void => {
      handleMapPointer(moveEvent.clientX, moveEvent.clientY);
    };

    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleHuePointer = (clientX: number): void => {
    const el = hueSliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const h = rect.width > 0 ? Math.round((x / rect.width) * 360) % 360 : 0;

    const nextHsv = { ...hsv, h };
    setHsv(nextHsv);
    const result = hsvToRgb(h, nextHsv.s, nextHsv.v);
    setHexInput(result.hex.replace('#', ''));
    onChange(result.hex);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    handleHuePointer(e.clientX);

    const onMove = (moveEvent: MouseEvent): void => {
      handleHuePointer(moveEvent.clientX);
    };

    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleHexChange = (val: string): void => {
    const clean = val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(clean);
    if (clean.length === 6 || clean.length === 3) {
      const fullHex = `#${clean}`;
      setHsv(hexToHsv(fullHex));
      onChange(fullHex);
    }
  };

  const handleEyedropper = async (): Promise<void> => {
    if (typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined') {
      try {
        type EyeDropperInstance = { open: () => Promise<{ sRGBHex: string }> };
        type EyeDropperConstructor = new () => EyeDropperInstance;
        const EyeDropperClass = (window as unknown as { EyeDropper: EyeDropperConstructor })
          .EyeDropper;
        const dropper = new EyeDropperClass();
        const res = await dropper.open();
        if (res?.sRGBHex) {
          const pickedHex = res.sRGBHex.toUpperCase();
          setHsv(hexToHsv(pickedHex));
          setHexInput(pickedHex.replace('#', ''));
          onChange(pickedHex);
        }
      } catch {
        // User cancelled eyedropper
      }
    }
  };

  const hexInputId = useId();
  const containerClasses = [
    styles.pickerContainer,
    variant === 'inline' ? styles.inline : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={containerClasses}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Seletor Profissional de Cores"
    >
      <div
        ref={spectrumBoxRef}
        className={styles.saturationMap}
        style={{ backgroundColor: pureHueHex }}
        onMouseDown={handleMapMouseDown}
      >
        <div className={styles.whiteGradient} />
        <div className={styles.blackGradient} />
        <div
          className={styles.mapHandle}
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hex,
          }}
        />
      </div>

      <div className={styles.controlsRow}>
        {onClose ? (
          <button
            type="button"
            className={styles.pipetteBtn}
            onClick={onClose}
            title="Fechar seletor"
            aria-label="Fechar seletor"
          >
            <Icon name="close" size="xs" />
          </button>
        ) : null}
        <button
          type="button"
          className={styles.pipetteBtn}
          onClick={handleEyedropper}
          title="Conta-gotas (capturar cor da tela)"
          aria-label="Conta-gotas"
        >
          <Icon name="pipette" size="xs" />
        </button>

        <div className={styles.sliderAndPreview}>
          <div ref={hueSliderRef} className={styles.hueTrack} onMouseDown={handleHueMouseDown}>
            <div
              className={styles.hueHandle}
              style={{
                left: `${(hsv.h / 360) * 100}%`,
              }}
            />
          </div>
        </div>

        <div
          className={styles.colorPreviewCircle}
          style={{ backgroundColor: hex }}
          title={`Cor atual: ${hex}`}
        />
      </div>

      <div className={styles.inputsRow}>
        <div className={styles.hexFieldWrapper}>
          <span className={styles.inputPrefix}>#</span>
          <input
            id={hexInputId}
            type="text"
            maxLength={6}
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            className={styles.hexInput}
            placeholder="000000"
            aria-label="Código Hex"
          />
        </div>

        <div className={styles.rgbChips}>
          <div className={styles.rgbChip}>
            <span className={styles.rgbChannel}>R</span>
            <span className={styles.rgbValue}>{r}</span>
          </div>
          <div className={styles.rgbChip}>
            <span className={styles.rgbChannel}>G</span>
            <span className={styles.rgbValue}>{g}</span>
          </div>
          <div className={styles.rgbChip}>
            <span className={styles.rgbChannel}>B</span>
            <span className={styles.rgbValue}>{b}</span>
          </div>
        </div>
      </div>

      <div className={styles.swatchesStrip}>
        {STUDIO_QUICK_SWATCHES.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            className={[styles.quickSwatch, styles[swatch.className]].filter(Boolean).join(' ')}
            onClick={() => {
              setHsv(hexToHsv(swatch.value));
              setHexInput(swatch.value.replace('#', ''));
              onChange(swatch.value);
            }}
            title={swatch.value}
            aria-label={`Selecionar cor ${swatch.value}`}
          />
        ))}
      </div>
    </div>
  );
}
