import type { ReactElement, ReactNode } from 'react';
import styles from './Toolbar.module.css';

export interface ToolbarGroupProps {
  readonly ariaLabel: string;
  readonly floating?: boolean;
  readonly children: ReactNode;
}

export function ToolbarGroup({
  ariaLabel,
  floating = false,
  children,
}: ToolbarGroupProps): ReactElement {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={[styles.toolbar, floating ? styles.floating : ''].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function ToolbarDivider(): ReactElement {
  return <span className={styles.divider} role="separator" aria-orientation="vertical" />;
}
