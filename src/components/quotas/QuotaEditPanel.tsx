import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuotaNode } from '../../types/kueue';
import { Button } from '../ui/Button';

interface QuotaEditPanelProps {
  node: QuotaNode;
  onSave: (updated: QuotaNode) => void;
  onClose: () => void;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-text-muted uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 bg-surface-2 border border-border rounded-[6px] text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors"
      />
    </label>
  );
}

export function QuotaEditPanel({ node, onSave, onClose }: QuotaEditPanelProps) {
  const [draft, setDraft] = useState(node);

  useEffect(() => {
    setDraft(node);
  }, [node]);

  const set = <K extends keyof QuotaNode>(key: K, raw: string) => {
    const value = typeof node[key] === 'number' ? Number(raw) || 0 : raw;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-80 shrink-0 bg-surface border-l border-border flex flex-col h-full"
    >
      <div className="h-12 flex items-center justify-between px-4 border-b border-border">
        <span className="text-[13px] font-medium text-text-primary">Edit Node</span>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-2 text-text-muted">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <Field label="Name" value={draft.name} onChange={(v) => set('name', v)} />
        <Field label="Nominal GPUs" value={draft.nominalGpus} onChange={(v) => set('nominalGpus', v)} type="number" />
        <Field label="Borrowing Limit" value={draft.borrowingLimit} onChange={(v) => set('borrowingLimit', v)} type="number" />
        <Field label="Lending Limit" value={draft.lendingLimit} onChange={(v) => set('lendingLimit', v)} type="number" />
        <Field label="Priority" value={draft.priority} onChange={(v) => set('priority', v)} type="number" />

        {draft.nominalGpus > 0 && (
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="flex justify-between text-[11px] text-text-muted mb-1">
              <span>Usage</span>
              <span>{draft.usedGpus}/{draft.nominalGpus} GPUs ({Math.round((draft.usedGpus / draft.nominalGpus) * 100)}%)</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min((draft.usedGpus / draft.nominalGpus) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(draft)}>Save</Button>
      </div>
    </motion.aside>
  );
}
