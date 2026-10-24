import { useId, type InputHTMLAttributes, type ReactElement, type Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './Input.module.css';

/**
 * Input control density variants.
 */
export type InputSize = 'sm' | 'md';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly label?: string;
  readonly suffix?: string;
  readonly prefixIcon?: IconName;
  readonly monospace?: boolean;
  readonly size?: InputSize;
  readonly onClear?: () => void;
  readonly className?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  suffix,
  prefixIcon,
  monospace = false,
  size = 'sm',
  onClear,
  className,
  id,
  value,
  ref,
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
      <div className={[styles.inputWrapper, styles[`size-${size}`]].filter(Boolean).join(' ')}>
        {prefixIcon ? (
          <span className={styles.prefixIcon}>
            <Icon name={prefixIcon} size="xs" tone="muted" />
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, monospace ? styles.monospace : ''].filter(Boolean).join(' ')}
          value={value}
          {...rest}
        />
        {onClear && hasValue ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="Limpar campo"
          >
            <Icon name="close" size="xs" tone="muted" />
          </button>
        ) : null}
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </div>
    </div>
  );
}
