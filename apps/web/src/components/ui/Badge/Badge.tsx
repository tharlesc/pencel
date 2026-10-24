import type { ReactElement, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning';

export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps): ReactElement {
  return (
    <span className={[styles.badge, styles[`tone-${tone}`]].join(' ')}>
      <span className={styles.dot} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
