import type { ReactElement, Ref } from 'react';
import styles from './Icon.module.css';
import {
  ICON_REGISTRY,
  ICON_SIZE_PX,
  ICON_STROKE_WIDTH,
  type IconName,
  type IconSize,
  type IconTone,
  type IconWeight,
} from './iconRegistry.js';

export interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  readonly weight?: IconWeight;
  readonly tone?: IconTone;
  /**
   * Accessible label. When provided, renders `role="img"` and `aria-label`.
   * When omitted (decorative icon alongside text), sets `aria-hidden="true"`.
   */
  readonly label?: string;
  readonly className?: string;
  readonly ref?: Ref<HTMLSpanElement>;
}

export function Icon({
  name,
  size = 'md',
  weight = 'regular',
  tone = 'default',
  label,
  className,
  ref,
}: IconProps): ReactElement {
  const GlyphComponent = ICON_REGISTRY[name];
  const pixelSize = ICON_SIZE_PX[size];
  const strokeWidth = ICON_STROKE_WIDTH[weight];
  const isDecorative = !label;

  const classes = [styles.icon, styles[`tone-${tone}`], className].filter(Boolean).join(' ');

  return (
    <span
      ref={ref}
      className={classes}
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : label}
      aria-hidden={isDecorative ? 'true' : undefined}
    >
      <GlyphComponent size={pixelSize} strokeWidth={strokeWidth} focusable="false" />
    </span>
  );
}
