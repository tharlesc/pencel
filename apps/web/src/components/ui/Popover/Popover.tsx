import { useEffect, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import styles from './Popover.module.css';

/**
 * Alignment variants for `<Popover />` (Material Pencel Float layer).
 */
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  readonly open: boolean;
  readonly align?: PopoverAlign;
  readonly ariaLabel: string;
  readonly onClose?: () => void;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function Popover({
  open,
  align = 'start',
  ariaLabel,
  onClose,
  children,
  className,
  ref,
  ...rest
}: PopoverProps): ReactElement | null {
  useEffect(() => {
    if (!open || !onClose) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const classes = [styles.popover, styles[`align-${align}`], className].filter(Boolean).join(' ');

  return (
    <div ref={ref} role="dialog" aria-label={ariaLabel} className={classes} {...rest}>
      {children}
    </div>
  );
}
