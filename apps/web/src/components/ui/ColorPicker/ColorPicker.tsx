import { useId, useMemo, useRef, useState, type ReactElement } from 'react';
import { Icon } from '../Icon/Icon.js';
import styles from './ColorPicker.module.css';

export interface ColorPickerProps {
  readonly color: string;
  readonly onChange: (hex: string) => void;
  readonly onClose?: () => void;
  readonly showTintsShades?: boolean;
}

// Convert Hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = Number.parseInt(clean || '000000', 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

// Convert HSV to Hex & RGB
function hsvToRgb(
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number; hex: string } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
  } else if (h >= 120 && h < 180) {
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

  return { r, g, b, hex };
}

export function ColorPicker({ color, onChange, onClose }: ColorPickerProps): ReactElement {
  const panelRef = useRef<HTMLDivElement>(null);
  const spectrumBoxRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  const [prevColor, setPrevColor] = useState(color);
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(() => color.replace('#', '').toUpperCase());

  // Keep internal state aligned if prop changes from outside without effect warning
  if (color !== prevColor) {
    setPrevColor(color);
    setHsv(hexToHsv(color));
    setHexInput(color.replace('#', '').toUpperCase());
  }

  const { r, g, b, hex } = useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v), [hsv]);
  const pureHueHex = useMemo(() => hsvToRgb(hsv.h, 1, 1).hex, [hsv.h]);

  // Handle Dragging in Saturation/Brightness 2D Map
  const handleMapPointer = (clientX: number, clientY: number): void => {
    const el = spectrumBoxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = x / rect.width;
    const v = 1 - y / rect.height;

    const nextHsv = { ...hsv, s, v };
    setHsv(nextHsv);
    const result = hsvToRgb(nextHsv.h, s, v);
    setHexInput(result.hex.replace('#', ''));
    onChange(result.hex);
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    handleMapPointer(e.clientX, e.clientY);

    const onMove = (moveEvent: MouseEvent) => {
      handleMapPointer(moveEvent.clientX, moveEvent.clientY);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Handle Hue Slider Dragging
  const handleHuePointer = (clientX: number): void => {
    const el = hueSliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const h = Math.round((x / rect.width) * 360) % 360;

    const nextHsv = { ...hsv, h };
    setHsv(nextHsv);
    const result = hsvToRgb(h, nextHsv.s, nextHsv.v);
    setHexInput(result.hex.replace('#', ''));
    onChange(result.hex);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    handleHuePointer(e.clientX);

    const onMove = (moveEvent: MouseEvent) => {
      handleHuePointer(moveEvent.clientX);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Hex input direct change
  const handleHexChange = (val: string): void => {
    const clean = val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(clean);
    if (clean.length === 6 || clean.length === 3) {
      const fullHex = `#${clean}`;
      setHsv(hexToHsv(fullHex));
      onChange(fullHex);
    }
  };

  // Eyedropper API
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

  return (
    <div
      ref={panelRef}
      className={styles.pickerContainer}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Seletor Profissional de Cores"
    >
      {/* 1. 2D Saturation / Value Gradient Map */}
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

      {/* 2. Hue Slider & Controls Row */}
      <div className={styles.controlsRow}>
        {onClose && (
          <button
            type="button"
            className={styles.pipetteBtn}
            onClick={onClose}
            title="Fechar seletor"
            aria-label="Fechar seletor"
          >
            <Icon name="close" size="xs" />
          </button>
        )}
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

      {/* 3. Hex & RGB Values with Pro Typography */}
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

      {/* Quick Swatches / Presets */}
      <div className={styles.swatchesStrip}>
        {[
          '#1D1D1F',
          '#F8FAFC',
          '#0066CC',
          '#16A34A',
          '#D97706',
          '#DC2626',
          '#7C3AED',
          '#EAB308',
        ].map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={styles.quickSwatch}
            style={{ backgroundColor: swatch }}
            onClick={() => {
              setHsv(hexToHsv(swatch));
              setHexInput(swatch.replace('#', ''));
              onChange(swatch);
            }}
            title={swatch}
          />
        ))}
      </div>
    </div>
  );
}
