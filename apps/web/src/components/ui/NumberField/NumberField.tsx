import { useId, type InputHTMLAttributes, type ReactElement, type Ref } from 'react';
import styles from './NumberField.module.css';

/**
 * Presentation variants for `<NumberField />`.
 */
export type NumberFieldVariant = 'default' | 'stepper';

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  readonly label?: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly suffix?: string;
  readonly variant?: NumberFieldVariant;
  readonly onChange: (value: number) => void;
  readonly className?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  variant = 'default',
  disabled = false,
  onChange,
  className,
  id,
  ref,
  ...rest
}: NumberFieldProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const clampValue = (next: number): number => {
    let clamped = Number.isFinite(next) ? next : value;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  };

  return (
    <div
      className={[styles.field, styles[`variant-${variant}`], className].filter(Boolean).join(' ')}
    >
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div className={styles.wrapper}>
        {variant === 'stepper' ? (
          <button
            type="button"
            className={styles.stepBtn}
            disabled={disabled || (min !== undefined && value <= min)}
            aria-label={`Diminuir ${label ?? 'valor'}`}
            onClick={() => onChange(clampValue(value - step))}
          >
            −
          </button>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type="number"
          className={styles.input}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={label ?? rest['aria-label']}
          onChange={(e) => {
            const parsed = Number.parseFloat(e.target.value);
            if (!Number.isNaN(parsed)) {
              onChange(clampValue(parsed));
            }
          }}
          {...rest}
        />
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
        {variant === 'stepper' ? (
          <button
            type="button"
            className={styles.stepBtn}
            disabled={disabled || (max !== undefined && value >= max)}
            aria-label={`Aumentar ${label ?? 'valor'}`}
            onClick={() => onChange(clampValue(value + step))}
          >
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}
