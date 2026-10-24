import type { ReactElement } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/iconRegistry.js';
import styles from './Tabs.module.css';

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
}

export function Tabs<T extends string>({
  ariaLabel,
  items,
  activeId,
  onChange,
}: TabsProps<T>): ReactElement {
  return (
    <div className={styles.tabList} role="tablist" aria-label={ariaLabel}>
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
