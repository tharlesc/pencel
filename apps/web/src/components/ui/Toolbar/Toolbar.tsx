import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import styles from './Toolbar.module.css';

/**
 * Surface modes for `<ToolbarGroup />`.
 */
export type ToolbarVariant = 'inline' | 'floating' | 'chrome';

export interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  readonly ariaLabel: string;
  readonly floating?: boolean;
  readonly variant?: ToolbarVariant;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function ToolbarGroup({
  ariaLabel,
  floating = false,
  variant = 'inline',
  children,
  className,
  ref,
  ...rest
}: ToolbarGroupProps): ReactElement {
  const resolvedVariant = floating ? 'floating' : variant;
  const classes = [styles.toolbar, styles[resolvedVariant], className].filter(Boolean).join(' ');
  return (
    <div ref={ref} role="toolbar" aria-label={ariaLabel} className={classes} {...rest}>
      {children}
    </div>
  );
}

export interface ToolbarDividerProps {
  readonly className?: string;
  readonly ref?: Ref<HTMLSpanElement>;
}

export function ToolbarDivider({ className, ref }: ToolbarDividerProps): ReactElement {
  return (
    <span
      ref={ref}
      className={[styles.divider, className].filter(Boolean).join(' ')}
      role="separator"
      aria-orientation="vertical"
    />
  );
}
