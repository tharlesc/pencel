import type { ReactElement, Ref } from 'react';
import styles from './BrandLogo.module.css';

/**
 * Display modes for `<BrandLogo />`.
 */
export type BrandLogoVariant = 'lockup' | 'symbol' | 'wordmark';

/**
 * Optical height presets for `<BrandLogo />`.
 */
export type BrandLogoSize = 'sm' | 'md' | 'lg';

export interface BrandLogoProps {
  readonly variant?: BrandLogoVariant;
  readonly size?: BrandLogoSize;
  readonly monochrome?: boolean;
  readonly label?: string;
  readonly className?: string;
  readonly ref?: Ref<SVGSVGElement>;
}

const SYMBOL_PATH =
  'M 76 24 H 180 C 212 24 232 44 232 76 V 180 C 232 212 212 232 180 232 H 114 V 176 H 142 C 180 176 204 150 204 110 C 204 70 180 44 142 44 C 96 44 66 74 66 116 V 232 C 38 230 24 210 24 180 V 76 C 24 44 44 24 76 24 Z M 112 134 V 104 C 112 81 127 66 148 66 C 169 66 184 81 184 104 C 184 127 169 140 148 140 H 118 C 114 140 112 138 112 134 Z';

const WORDMARK_LOCKUP_PATH =
  'M 264 72 H 289 V 86 C 298 75 312 70 328 70 C 360 70 382 94 382 128 C 382 162 360 186 328 186 C 312 186 299 181 290 170 V 222 C 290 232 283 238 273 238 H 264 V 72 Z M 323 163 C 343 163 356 149 356 128 C 356 107 343 93 323 93 C 303 93 290 107 290 128 C 290 149 303 163 323 163 Z M 448 70 C 482 70 504 93 504 126 V 136 H 417 C 420 154 433 164 452 164 C 466 164 477 158 484 148 L 501.32 158 C 490 176 472 186 450 186 C 415 186 392 162 392 128 C 392 94 415 70 448 70 Z M 418 117 H 479 C 476 100 465 91 448 91 C 432 91 421 100 418 117 Z M 518 72 H 543 V 86 C 552 75 565 70 582 70 C 610 70 624 88 624 116 V 184 H 598 V 120 C 598 102 589 93 572 93 C 555 93 544 105 544 124 V 184 H 518 V 72 Z M 696 70 C 719 70 736 81 744.32 100 L 727 110 C 721 98 410 93 696 93 C 677 93 664 107 664 128 C 664 149 677 163 696 163 C 710 163 721 158 727 146 L 744.32 156 C 736 175 719 186 696 186 C 662 186 638 162 638 128 C 638 94 662 70 696 70 Z M 808 70 C 842 70 864 93 864 126 V 136 H 777 C 780 154 793 164 812 164 C 826 164 837 158 844 148 L 861.32 158 C 850 176 832 186 810 186 C 775 186 752 162 752 128 C 752 94 775 70 808 70 Z M 778 117 H 839 C 836 100 825 91 808 91 C 792 91 781 100 778 117 Z M 880 28 H 894 C 901 28 906 33 906 40 V 148 C 906 159 911 163 922 163 H 930 V 185 H 916 C 892 185 880 173 880 149 V 28 Z';

const WORDMARK_ONLY_PATH =
  'M 27 72 H 52 V 86 C 61 75 75 70 91 70 C 123 70 145 94 145 128 C 145 162 123 186 91 186 C 75 186 62 181 53 170 V 222 C 53 232 46 238 36 238 H 27 V 72 Z M 86 163 C 106 163 119 149 119 128 C 119 107 106 93 86 93 C 66 93 53 107 53 128 C 53 149 66 163 86 163 Z M 211 70 C 245 70 267 93 267 126 V 136 H 180 C 183 154 196 164 215 164 C 229 164 240 158 247 148 L 264.32 158 C 253 176 235 186 213 186 C 178 186 155 162 155 128 C 155 94 178 70 211 70 Z M 181 117 H 242 C 239 100 228 91 211 91 C 195 91 184 100 181 117 Z M 281 72 H 306 V 86 C 315 75 328 70 345 70 C 373 70 387 88 387 116 V 184 H 361 V 120 C 361 102 352 93 335 93 C 318 93 307 105 307 124 V 184 H 281 V 72 Z M 459 70 C 482 70 499 81 507.32 100 L 490 110 C 484 98 473 93 459 93 C 440 93 427 107 427 128 C 427 149 440 163 459 163 C 473 163 484 158 490 146 L 507.32 156 C 499 175 482 186 459 186 C 425 186 401 162 401 128 C 401 94 425 70 459 70 Z M 571 70 C 605 70 627 93 627 126 V 136 H 540 C 543 154 556 164 575 164 C 589 164 600 158 607 148 L 624.32 158 C 613 176 595 186 573 186 C 538 186 515 162 515 128 C 515 94 538 70 571 70 Z M 541 117 H 602 C 599 100 588 91 571 91 C 555 91 544 100 541 117 Z M 643 28 H 657 C 664 28 669 33 669 40 V 148 C 669 159 674 163 685 163 H 693 V 185 H 679 C 655 185 643 173 643 149 V 28 Z';

export function BrandLogo({
  variant = 'lockup',
  size = 'md',
  monochrome = false,
  label,
  className,
  ref,
}: BrandLogoProps): ReactElement {
  const classes = [styles.logo, styles[size], monochrome ? styles.monochrome : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  const a11yProps = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  if (variant === 'symbol') {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className={classes}
        {...a11yProps}
      >
        <path className={styles.symbol} fillRule="evenodd" d={SYMBOL_PATH} />
      </svg>
    );
  }

  if (variant === 'wordmark') {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 720 256"
        className={classes}
        {...a11yProps}
      >
        <path className={styles.wordmark} fillRule="evenodd" d={WORDMARK_ONLY_PATH} />
      </svg>
    );
  }

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 960 256"
      className={classes}
      {...a11yProps}
    >
      <path className={styles.symbol} fillRule="evenodd" d={SYMBOL_PATH} />
      <path className={styles.wordmark} fillRule="evenodd" d={WORDMARK_LOCKUP_PATH} />
    </svg>
  );
}
