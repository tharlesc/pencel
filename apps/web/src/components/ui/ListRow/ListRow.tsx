import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import styles from './ListRow.module.css';

/**
 * Density variants for `<ListRow />`.
 */
export type ListRowSize = 'sm' | 'md';

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly leading?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly trailing?: ReactNode;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly size?: ListRowSize;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  selected = false,
  disabled = false,
  size = 'md',
  className,
  ref,
  ...rest
}: ListRowProps): ReactElement {
  const classes = [
    styles.row,
    styles[`size-${size}`],
    selected ? styles.selected : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classes} aria-disabled={disabled || undefined} {...rest}>
      {leading ? <div className={styles.leading}>{leading}</div> : null}
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </div>
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </div>
  );
}
