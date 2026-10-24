import type { ReactElement, ReactNode, Ref } from 'react';
import styles from './Tooltip.module.css';

/**
 * Anchor placements for `<Tooltip />` (Material Pencel Float layer).
 */
export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  readonly content: string;
  readonly shortcut?: string;
  readonly placement?: TooltipPlacement;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLSpanElement>;
}

export function Tooltip({
  content,
  shortcut,
  placement = 'top',
  children,
  className,
  ref,
}: TooltipProps): ReactElement {
  return (
    <span ref={ref} className={[styles.wrapper, className].filter(Boolean).join(' ')}>
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
