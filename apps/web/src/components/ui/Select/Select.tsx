import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { Icon } from '../Icon/Icon.js';
import styles from './Select.module.css';

export interface SelectOption<T extends string | number = string | number> {
  readonly value: T;
  readonly label: string;
}

export interface SelectProps<T extends string | number = string | number> {
  readonly value: T;
  readonly options: readonly SelectOption<T>[];
  readonly onChange: (value: T) => void;
  readonly ariaLabel: string;
  readonly size?: 'sm' | 'md';
  readonly align?: 'start' | 'end';
  readonly disabled?: boolean;
  readonly className?: string;
  readonly triggerStyle?: React.CSSProperties;
}

export function Select<T extends string | number = string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'sm',
  align = 'start',
  disabled = false,
  className,
  triggerStyle,
}: SelectProps<T>): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (nextVal: T) => {
      onChange(nextVal);
      handleClose();
    },
    [onChange, handleClose],
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isOpen, handleClose]);

  // Keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;

    if (!isOpen) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        setIsOpen(true);
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const targetOption = options[focusedIndex] ?? selectedOption;
        if (targetOption) {
          handleSelect(targetOption.value);
        }
        break;
      }
      case 'Tab':
        handleClose();
        break;
    }
  };

  const isNumeric = typeof value === 'number' || /^\d/.test(String(value));

  return (
    <div
      ref={containerRef}
      className={[styles.selectContainer, className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        style={triggerStyle}
        className={[styles.trigger, styles[`size-${size}`], isOpen ? styles.triggerOpen : '']
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={styles.label}
          style={isNumeric ? { fontVariantNumeric: 'tabular-nums' } : undefined}
        >
          {selectedOption ? selectedOption.label : String(value)}
        </span>
        <span
          className={[styles.chevron, isOpen ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          <Icon name="chevronDown" size="xs" />
        </span>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className={[styles.dropdownPopover, styles[`align-${align}`]].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={[
                  styles.optionItem,
                  isSelected ? styles.optionItemSelected : '',
                  isFocused ? styles.optionItemFocused : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <span
                  className={styles.optionLabel}
                  style={isNumeric ? { fontVariantNumeric: 'tabular-nums' } : undefined}
                >
                  {option.label}
                </span>
                {isSelected && (
                  <span className={styles.checkIcon}>
                    <Icon name="check" size="xs" tone="accent" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
