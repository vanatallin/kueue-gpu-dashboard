import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortConfig, SortableField } from '../../hooks/useWorkloadSort';

interface SortableHeaderProps {
  field: SortableField;
  label: string;
  sortConfig: SortConfig;
  onSort: (field: SortableField, shiftKey: boolean) => void;
}

export function SortableHeader({ field, label, sortConfig, onSort }: SortableHeaderProps) {
  const isPrimary = sortConfig.primary?.field === field;
  const isSecondary = sortConfig.secondary?.field === field;
  const isActive = isPrimary || isSecondary;
  const direction = isPrimary
    ? sortConfig.primary?.direction
    : isSecondary
      ? sortConfig.secondary?.direction
      : null;

  const handleClick = (e: React.MouseEvent) => {
    onSort(field, e.shiftKey);
  };

  return (
    <th
      onClick={handleClick}
      className="pb-2 text-left text-[11px] font-medium uppercase tracking-wide cursor-pointer select-none group"
    >
      <span
        className={`inline-flex items-center gap-1 transition-colors ${
          isActive ? 'text-text-primary' : 'text-text-muted group-hover:text-text-secondary'
        }`}
      >
        {label}
        <span className="inline-flex items-center">
          {direction === 'asc' ? (
            <ArrowUp size={12} />
          ) : direction === 'desc' ? (
            <ArrowDown size={12} />
          ) : (
            <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-70" />
          )}
          {isSecondary && (
            <span className="ml-0.5 text-[9px] text-text-muted">(2)</span>
          )}
        </span>
      </span>
    </th>
  );
}
