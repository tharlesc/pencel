import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import styles from './Badge.module.css';

/**
 * Semantic visual tones supported by `<Badge />`.
 */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLSpanElement>;
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  ref,
  ...rest
}: BadgeProps): ReactElement {
  const classes = [styles.badge, styles[`tone-${tone}`], className].filter(Boolean).join(' ');
  return (
    <span ref={ref} className={classes} {...rest}>
      <span className={styles.dot} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
