import type { ReactElement, Ref } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './Tabs.module.css';

/**
 * Layout variants for `<Tabs />`.
 */
export type TabsVariant = 'segmented' | 'pills';

export interface TabItem<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly icon?: IconName;
}

export interface TabsProps<T extends string> {
  readonly ariaLabel: string;
  readonly items: readonly TabItem<T>[];
  readonly activeId: T;
  readonly onChange: (id: T) => void;
  readonly variant?: TabsVariant;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function Tabs<T extends string>({
  ariaLabel,
  items,
  activeId,
  onChange,
  variant = 'segmented',
  className,
  ref,
}: TabsProps<T>): ReactElement {
  const classes = [styles.tabList, styles[`variant-${variant}`], className]
    .filter(Boolean)
    .join(' ');
  return (
    <div ref={ref} className={classes} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isSelected = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={isSelected}
            aria-controls={`tabpanel-${item.id}`}
            className={[styles.tabButton, isSelected ? styles.active : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(item.id)}
          >
            {item.icon ? (
              <Icon
                name={item.icon}
                size="sm"
                weight={isSelected ? 'medium' : 'regular'}
                tone={isSelected ? 'active' : 'muted'}
              />
            ) : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
