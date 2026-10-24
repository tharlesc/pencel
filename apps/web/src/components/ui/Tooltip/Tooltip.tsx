import type { ReactElement, ReactNode } from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  readonly content: string;
  readonly shortcut?: string;
  readonly placement?: 'top' | 'bottom';
  readonly children: ReactNode;
}

export function Tooltip({
  content,
  shortcut,
  placement = 'top',
  children,
}: TooltipProps): ReactElement {
  return (
    <span className={styles.wrapper}>
      {children}
      <span
        className={[styles.bubble, placement === 'bottom' ? styles.placementBottom : '']
          .filter(Boolean)
          .join(' ')}
        role="tooltip"
      >
        <span>{content}</span>
        {shortcut ? <kbd className={styles.shortcut}>{shortcut}</kbd> : null}
      </span>
    </span>
  );
}
