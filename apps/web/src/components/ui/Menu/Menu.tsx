import type { ReactElement, Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './Menu.module.css';

/**
 * Item tone variants for `<Menu />`.
 */
export type MenuItemTone = 'default' | 'danger';

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly shortcut?: string;
  readonly tone?: MenuItemTone;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

export interface MenuProps {
  readonly ariaLabel: string;
  readonly items: readonly MenuItem[];
  readonly floating?: boolean;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function Menu({
  ariaLabel,
  items,
  floating = true,
  className,
  ref,
}: MenuProps): ReactElement {
  const classes = [styles.menu, floating ? styles.floating : styles.inline, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} role="menu" aria-label={ariaLabel} className={classes}>
      {items.map((item) => {
        const tone = item.tone ?? 'default';
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={[styles.item, styles[`tone-${tone}`]].filter(Boolean).join(' ')}
            onClick={item.onSelect}
          >
            <span className={styles.leading}>
              {item.icon ? <Icon name={item.icon} size="xs" /> : null}
              <span>{item.label}</span>
            </span>
            {item.shortcut ? <kbd className={styles.shortcut}>{item.shortcut}</kbd> : null}
          </button>
        );
      })}
    </div>
  );
}
