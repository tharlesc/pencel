import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import styles from './Panel.module.css';

/**
 * Surface variants for `<PanelSection />`.
 */
export type PanelVariant = 'default' | 'compact' | 'chrome';

export interface PanelSectionProps extends HTMLAttributes<HTMLElement> {
  readonly title: string;
  readonly badge?: ReactNode;
  readonly variant?: PanelVariant;
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLElement>;
}

export function PanelSection({
  title,
  badge,
  variant = 'default',
  children,
  className,
  ref,
  ...rest
}: PanelSectionProps): ReactElement {
  const classes = [styles.section, styles[`variant-${variant}`], className]
    .filter(Boolean)
    .join(' ');
  return (
    <section ref={ref} className={classes} {...rest}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {badge ? <div>{badge}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
