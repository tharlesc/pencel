import type { ReactElement, Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './SegmentedControl.module.css';

/**
 * Density variants for `<SegmentedControl />`.
 */
export type SegmentedControlSize = 'sm' | 'md';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: IconName;
  readonly ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly ariaLabel: string;
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly size?: SegmentedControlSize;
  readonly onChange: (value: T) => void;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  options,
  value,
  size = 'sm',
  onChange,
  className,
  ref,
}: SegmentedControlProps<T>): ReactElement {
  const classes = [styles.root, styles[`size-${size}`], className].filter(Boolean).join(' ');
  return (
    <div ref={ref} role="radiogroup" aria-label={ariaLabel} className={classes}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.ariaLabel ?? opt.label}
            className={[styles.segment, isActive ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon ? (
              <Icon
                name={opt.icon}
                size="xs"
                weight={isActive ? 'medium' : 'regular'}
                tone={isActive ? 'active' : 'muted'}
              />
            ) : null}
            {opt.label ? <span className={styles.label}>{opt.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
