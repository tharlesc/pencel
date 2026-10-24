import type { HTMLAttributes, ReactElement, Ref } from 'react';
import styles from './Skeleton.module.css';

/**
 * Shape variants for `<Skeleton />` loading placeholders.
 */
export type SkeletonVariant = 'rect' | 'text' | 'pill';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: SkeletonVariant;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function Skeleton({
  variant = 'rect',
  className,
  ref,
  ...rest
}: SkeletonProps): ReactElement {
  const classes = [styles.skeleton, styles[`variant-${variant}`], className]
    .filter(Boolean)
    .join(' ');
  return <div ref={ref} aria-hidden="true" className={classes} {...rest} />;
}
