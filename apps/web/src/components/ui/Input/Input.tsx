import { useId, type InputHTMLAttributes, type ReactElement } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly suffix?: string;
  readonly prefixIcon?: IconName;
  readonly monospace?: boolean;
  readonly onClear?: () => void;
}

export function Input({
  label,
  suffix,
  prefixIcon,
  monospace = false,
  onClear,
  className,
  id,
  value,
  ...rest
}: InputProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasValue = value !== undefined && value !== '';

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <div className={styles.inputWrapper}>
        {prefixIcon && (
          <span className={styles.prefixIcon}>
            <Icon name={prefixIcon} size="xs" tone="muted" />
          </span>
        )}
        <input
          id={inputId}
          className={[styles.input, monospace ? styles.monospace : ''].filter(Boolean).join(' ')}
          value={value}
          {...rest}
        />
        {onClear && hasValue && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="Limpar campo"
          >
            <Icon name="close" size="xs" tone="muted" />
          </button>
        )}
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </div>
    </div>
  );
}
