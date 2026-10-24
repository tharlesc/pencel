import { useId, type InputHTMLAttributes, type ReactElement, type Ref } from 'react';
import styles from './Slider.module.css';

/**
 * Density variants for `<Slider />`.
 */
export type SliderSize = 'sm' | 'md';

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'onChange'
> {
  readonly label?: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly suffix?: string;
  readonly showValue?: boolean;
  readonly size?: SliderSize;
  readonly onChange: (value: number) => void;
  readonly className?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  showValue = true,
  size = 'md',
  disabled = false,
  onChange,
  className,
  id,
  ref,
  ...rest
}: SliderProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      className={[styles.container, styles[`size-${size}`], className].filter(Boolean).join(' ')}
    >
      {label || showValue ? (
        <div className={styles.header}>
          {label ? (
            <label htmlFor={inputId} className={styles.label}>
              {label}
            </label>
          ) : null}
          {showValue ? (
            <span className={styles.valueReadout}>
              {value}
              {suffix}
            </span>
          ) : null}
        </div>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        type="range"
        className={styles.rangeInput}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label ?? rest['aria-label']}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
    </div>
  );
}
