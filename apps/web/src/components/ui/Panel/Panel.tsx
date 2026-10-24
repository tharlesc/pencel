import type { ReactElement, ReactNode } from 'react';
import styles from './Panel.module.css';

export interface PanelSectionProps {
  readonly title: string;
  readonly badge?: ReactNode;
  readonly children: ReactNode;
}

export function PanelSection({ title, badge, children }: PanelSectionProps): ReactElement {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {badge ? <div>{badge}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
