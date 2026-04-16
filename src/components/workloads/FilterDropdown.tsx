import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  allowFreeText = false,
  freeTextPlaceholder = 'Add custom...',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const addFreeTextValue = () => {
    const trimmed = freeTextValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setFreeTextValue('');
  };

  const handleFreeTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFreeTextValue();
    }
  };

  // Combine options with any custom selected values not in options
  const optionValues = new Set(options.map((o) => o.value));
  const customSelected = selected.filter((s) => !optionValues.has(s));

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] border transition-colors ${
          selected.length > 0
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-surface-2 border-border text-text-secondary hover:text-text-primary hover:border-border'
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-medium rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[180px] bg-surface border border-border rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
          >
            {/* Free text input */}
            {allowFreeText && (
              <div className="flex items-center gap-1 p-2 border-b border-border">
                <input
                  ref={inputRef}
                  type="text"
                  value={freeTextValue}
                  onChange={(e) => setFreeTextValue(e.target.value)}
                  onKeyDown={handleFreeTextKeyDown}
                  placeholder={freeTextPlaceholder}
                  className="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <button
                  onClick={addFreeTextValue}
                  disabled={!freeTextValue.trim()}
                  className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {/* Custom selected values (not in predefined options) */}
            {customSelected.map((value) => (
              <button
                key={value}
                onClick={() => toggleOption(value)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-[13px] bg-primary/10 text-text-primary"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded border bg-primary border-primary">
                  <Check size={12} className="text-white" />
                </span>
                <span className="italic">{value}</span>
              </button>
            ))}

            {/* Predefined options */}
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left text-[13px] transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-4 h-4 rounded border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </span>
                  {option.color && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                </button>
              );
            })}

            {options.length === 0 && customSelected.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-text-muted">
                No types found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
