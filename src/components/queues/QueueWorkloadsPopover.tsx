import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Clock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';
import { formatCpu, formatMemoryGi, percentUsed } from '../../utils/formatResources';
import type { Workload } from '../../types/kueue';

interface QueueWorkloadsPopoverProps {
  queueName: string;
  workloads: Workload[];
  usedGpus: number;
  nominalGpus: number;
  usedCpu?: number;
  nominalCpu?: number;
  usedMemory?: number;
  nominalMemory?: number;
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-status-running',
  pending: 'bg-status-pending',
  resuming: 'bg-status-resuming',
  preempted: 'bg-status-preempted',
  completed: 'bg-status-completed',
};

export function QueueWorkloadsPopover({
  queueName,
  workloads,
  usedGpus,
  nominalGpus,
  usedCpu = 0,
  nominalCpu = 0,
  usedMemory = 0,
  nominalMemory = 0,
  isOpen,
  onClose,
  anchorRect,
}: QueueWorkloadsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showCpuWorkloads, setShowCpuWorkloads] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  // Filter workloads for this queue (running and pending)
  const queueWorkloads = workloads.filter(
    (w) => w.pool === queueName && (w.status === 'running' || w.status === 'pending')
  );

  // Separate GPU and CPU workloads
  const gpuWorkloads = queueWorkloads.filter((w) => w.gpusRequested > 0);
  const cpuWorkloads = queueWorkloads.filter((w) => w.gpusRequested === 0);

  // Apply filter
  const filteredWorkloads = showCpuWorkloads ? queueWorkloads : gpuWorkloads;

  const runningWorkloads = filteredWorkloads.filter((w) => w.status === 'running');
  const pendingWorkloads = filteredWorkloads.filter((w) => w.status === 'pending');

  // Calculate position - popover appears ABOVE the tile
  const getPosition = () => {
    if (!anchorRect) return { top: 0, left: 0 };

    const popoverWidth = 360;
    const popoverMaxHeight = 400;
    const padding = 12;
    const gap = 8; // Gap between popover and tile

    // Center horizontally over the tile
    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;

    // Position popover above the tile (bottom of popover at top of tile)
    let top = anchorRect.top - popoverMaxHeight - gap;

    // If not enough space above, position below the tile instead
    if (top < padding) {
      top = anchorRect.bottom + gap;
    }

    // Adjust if would go off right edge
    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }

    // Adjust if would go off left edge
    if (left < padding) {
      left = padding;
    }

    return { top, left };
  };

  const position = getPosition();
  const gpuUtil = percentUsed(usedGpus, nominalGpus);
  const cpuUtil = percentUsed(usedCpu, nominalCpu);
  const memUtil = percentUsed(usedMemory, nominalMemory);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed z-50 w-[360px] max-h-[400px] bg-surface border border-border rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ top: position.top, left: position.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium text-text-primary">{queueName}</h3>
              <div className="flex flex-col gap-0.5 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <Zap size={12} className="text-primary" />
                  {usedGpus} / {nominalGpus} GPUs ({gpuUtil}%)
                </span>
                {nominalCpu > 0 && (
                  <span className="flex items-center gap-1">
                    <Cpu size={12} className="text-compute" />
                    {formatCpu(usedCpu)} / {formatCpu(nominalCpu)} CPU ({cpuUtil}%)
                  </span>
                )}
                {nominalMemory > 0 && (
                  <span>
                    {formatMemoryGi(usedMemory)} / {formatMemoryGi(nominalMemory)} GiB ({memUtil}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* CPU workloads toggle */}
              {cpuWorkloads.length > 0 && (
                <button
                  onClick={() => setShowCpuWorkloads(!showCpuWorkloads)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] transition-colors ${
                    showCpuWorkloads
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface text-text-muted hover:text-text-secondary'
                  }`}
                  title={showCpuWorkloads ? 'Hide CPU workloads' : `Show ${cpuWorkloads.length} CPU workload${cpuWorkloads.length > 1 ? 's' : ''}`}
                >
                  {showCpuWorkloads ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>CPU ({cpuWorkloads.length})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-[6px] hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* GPU Progress Bar */}
          <div className="px-4 py-3 border-b border-border">
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(gpuUtil, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  gpuUtil > 90 ? 'bg-warning' : 'bg-primary'
                }`}
              />
            </div>
          </div>

          {/* Workloads List */}
          <div className="overflow-y-auto max-h-[280px]">
            {filteredWorkloads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <Clock size={24} className="mb-2 opacity-50" />
                <span className="text-[13px]">
                  {queueWorkloads.length === 0
                    ? 'No active workloads'
                    : `No GPU workloads (${cpuWorkloads.length} CPU)`}
                </span>
                {cpuWorkloads.length > 0 && !showCpuWorkloads && (
                  <button
                    onClick={() => setShowCpuWorkloads(true)}
                    className="mt-2 text-[12px] text-primary hover:text-primary/80 transition-colors"
                  >
                    Show CPU workloads
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2">
                {/* Running Section */}
                {runningWorkloads.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wide">
                      Running ({runningWorkloads.length})
                    </div>
                    {runningWorkloads.map((workload) => (
                      <WorkloadItem key={workload.id} workload={workload} />
                    ))}
                  </div>
                )}

                {/* Pending Section */}
                {pendingWorkloads.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wide">
                      Pending ({pendingWorkloads.length})
                    </div>
                    {pendingWorkloads.map((workload) => (
                      <WorkloadItem key={workload.id} workload={workload} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredWorkloads.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-2">
              <span className="text-[11px] text-text-muted">
                {runningWorkloads.filter(w => w.gpusRequested > 0).length} GPU workloads using{' '}
                {runningWorkloads.reduce((sum, w) => sum + (w.gpusRequested || 0), 0)} GPUs
              </span>
              <button className="flex items-center gap-1 text-[12px] text-primary hover:text-primary/80 transition-colors">
                View all workloads
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WorkloadItem({ workload }: { workload: Workload }) {
  const isGpuWorkload = workload.gpusRequested > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-2 py-2 rounded-[8px] hover:bg-surface-2 transition-colors cursor-default"
    >
      {/* Status indicator */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[workload.status]}`} />

      {/* Workload info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-text-primary truncate">
            {workload.name}
          </span>
          {workload.type && (
            <span className="px-1.5 py-0.5 text-[10px] bg-surface-2 border border-border rounded text-text-muted">
              {workload.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-text-muted truncate">
            {workload.namespace}
          </span>
        </div>
      </div>

      {/* Resource indicator - GPU or CPU */}
      <div className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded ${
        isGpuWorkload ? 'bg-primary/10' : 'bg-surface-2'
      }`}>
        {isGpuWorkload ? (
          <Zap size={12} className="text-primary" />
        ) : (
          <Cpu size={12} className="text-text-muted" />
        )}
        <span className={`text-[12px] font-medium ${
          isGpuWorkload ? 'text-primary' : 'text-text-muted'
        }`}>
          {isGpuWorkload
            ? workload.gpusRequested
            : workload.cpuRequested
              ? `${formatCpu(workload.cpuRequested)} CPU`
              : 'CPU'}
        </span>
      </div>
    </motion.div>
  );
}
