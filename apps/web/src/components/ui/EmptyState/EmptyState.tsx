import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './EmptyState.module.css';

/**
 * Density variants for `<EmptyState />`.
 */
export type EmptyStateVariant = 'compact' | 'default';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly icon?: IconName;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly variant?: EmptyStateVariant;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  ref,
  ...rest
}: EmptyStateProps): ReactElement {
  const classes = [styles.empty, styles[`variant-${variant}`], className].filter(Boolean).join(' ');
  return (
    <div ref={ref} className={classes} {...rest}>
      {icon ? (
        <div className={styles.iconBadge}>
          <Icon name={icon} size="lg" tone="muted" />
        </div>
      ) : null}
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
