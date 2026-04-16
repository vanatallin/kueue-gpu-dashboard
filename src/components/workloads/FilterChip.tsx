import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterChipProps {
  label: string;
  value: string;
  color?: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, color, onRemove }: FilterChipProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-2 border border-border rounded-full text-[12px]"
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-text-muted">{label}:</span>
      <span className="text-text-primary">{value}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 p-0.5 rounded-full hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={12} />
      </button>
    </motion.span>
  );
}
