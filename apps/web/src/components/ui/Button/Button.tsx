import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './Button.module.css';

/**
 * Visual hierarchy variants for `<Button />`.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'toolbar' | 'danger';

/**
 * Compact desktop control heights for `<Button />`.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: IconName;
  readonly active?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  active = false,
  disabled = false,
  className,
  type = 'button',
  children,
  ref,
  ...rest
}: ButtonProps): ReactElement {
  const isIconOnly = Boolean(icon && !children);
  const classes = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    active ? styles.active : '',
    isIconOnly ? styles.iconOnly : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-pressed={variant === 'toolbar' ? active : undefined}
      {...rest}
    >
      {icon ? (
        <Icon
          name={icon}
          size={size === 'sm' ? 'xs' : 'sm'}
          weight={active ? 'medium' : 'regular'}
          tone={disabled ? 'disabled' : active && variant === 'toolbar' ? 'active' : 'default'}
        />
      ) : null}
      {children ? <span className={styles.label}>{children}</span> : null}
    </button>
  );
}
