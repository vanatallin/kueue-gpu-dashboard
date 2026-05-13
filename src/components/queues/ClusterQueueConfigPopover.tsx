import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Shuffle, Swords, ListOrdered, ChevronRight } from 'lucide-react';
import type { ClusterQueueConfig, FlavorInfo } from '../../services/api';

interface ClusterQueueConfigPopoverProps {
  queueName: string;
  config: ClusterQueueConfig | undefined;
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

// Helper to format policy values for display
function formatPolicy(value: string | undefined): string {
  if (!value) return 'Not set';
  // Add spaces before capital letters: LowerPriority -> Lower Priority
  return value.replace(/([A-Z])/g, ' $1').trim();
}

// Helper to format Kubernetes quantities for display
function formatQuantity(raw: string): string {
  if (!raw || raw === '0') return '0';

  // Already has a unit suffix, just make it more readable
  // Common suffixes: Ki, Mi, Gi, Ti, Pi, Ei (binary) or k, M, G, T, P, E (decimal)
  // Also: m (milli), "" (no suffix = bytes or count)

  const match = raw.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]*)$/);
  if (!match) return raw;

  const [, num, unit] = match;

  // Map Kubernetes units to readable format
  const unitMap: Record<string, string> = {
    '': '',
    'm': 'm',      // milli (for CPU)
    'Ki': ' KiB',
    'Mi': ' MiB',
    'Gi': ' GiB',
    'Ti': ' TiB',
    'k': ' KB',
    'M': ' MB',
    'G': ' GB',
    'T': ' TB',
  };

  const displayUnit = unitMap[unit] ?? ` ${unit}`;
  return `${num}${displayUnit}`;
}

export function ClusterQueueConfigPopover({
  queueName,
  config,
  isOpen,
  onClose,
  anchorRect,
}: ClusterQueueConfigPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

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

  // Calculate position - appear to the right of the tile
  const getPosition = () => {
    if (!anchorRect) return { top: 0, left: 0 };

    const popoverWidth = 340;
    const padding = 12;
    const gap = 8;

    // Position to the right of the anchor
    let left = anchorRect.right + gap;
    let top = anchorRect.top;

    // If not enough space on right, position to the left
    if (left + popoverWidth > window.innerWidth - padding) {
      left = anchorRect.left - popoverWidth - gap;
    }

    // If still not enough space, center horizontally
    if (left < padding) {
      left = Math.max(padding, (window.innerWidth - popoverWidth) / 2);
    }

    // Adjust if would go off bottom
    const popoverMaxHeight = 500;
    if (top + popoverMaxHeight > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - popoverMaxHeight - padding);
    }

    return { top, left };
  };

  const position = getPosition();

  if (!config) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed z-50 w-[340px] max-h-[500px] bg-surface border border-border rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ top: position.top, left: position.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium text-text-primary">{queueName}</h3>
              <span className="text-[11px] text-text-muted">Queue Configuration</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[420px] p-4 space-y-4">
            {/* Queueing Strategy */}
            <ConfigSection
              icon={<ListOrdered size={16} />}
              title="Queueing Strategy"
              iconColor="text-primary"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">Strategy</span>
                <span className="text-[13px] font-medium text-text-primary">
                  {formatPolicy(config.queueingStrategy)}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                {config.queueingStrategy === 'StrictFIFO'
                  ? 'Workloads are strictly ordered; blocked head blocks all.'
                  : 'Workloads can be skipped if head is blocked.'}
              </p>
            </ConfigSection>

            {/* Flavors */}
            {config.flavors.length > 0 && (
              <ConfigSection
                icon={<Layers size={16} />}
                title="Resource Flavors"
                iconColor="text-compute"
              >
                <div className="space-y-2">
                  {config.flavors.map((flavor) => (
                    <FlavorItem key={flavor.name} flavor={flavor} />
                  ))}
                </div>
              </ConfigSection>
            )}

            {/* Flavor Fungibility */}
            {config.flavorFungibility && (
              <ConfigSection
                icon={<Shuffle size={16} />}
                title="Flavor Fungibility"
                iconColor="text-memory"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-text-secondary">When Can Borrow</span>
                    <PolicyBadge value={config.flavorFungibility.whenCanBorrow} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-text-secondary">When Can Preempt</span>
                    <PolicyBadge value={config.flavorFungibility.whenCanPreempt} />
                  </div>
                </div>
              </ConfigSection>
            )}

            {/* Preemption */}
            {config.preemption && (
              <ConfigSection
                icon={<Swords size={16} />}
                title="Preemption"
                iconColor="text-warning"
              >
                <div className="space-y-2">
                  {config.preemption.withinClusterQueue && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-text-secondary">Within Queue</span>
                      <PolicyBadge value={config.preemption.withinClusterQueue} />
                    </div>
                  )}
                  {config.preemption.reclaimWithinCohort && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-text-secondary">Reclaim from Cohort</span>
                      <PolicyBadge value={config.preemption.reclaimWithinCohort} />
                    </div>
                  )}
                  {config.preemption.borrowWithinCohort?.policy && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-text-secondary">Borrow from Cohort</span>
                      <PolicyBadge value={config.preemption.borrowWithinCohort.policy} />
                    </div>
                  )}
                </div>
              </ConfigSection>
            )}

            {/* No config case */}
            {!config.flavorFungibility && !config.preemption && config.flavors.length === 0 && (
              <div className="text-center py-4 text-text-muted text-[13px]">
                Using default configuration
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Section wrapper component
function ConfigSection({
  icon,
  title,
  iconColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor}>{icon}</span>
        <span className="text-[12px] font-medium text-text-primary uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

// Expandable flavor item component
function FlavorItem({ flavor }: { flavor: FlavorInfo }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasNodeLabels = flavor.nodeLabels && Object.keys(flavor.nodeLabels).length > 0;
  const hasNodeTaints = flavor.nodeTaints && flavor.nodeTaints.length > 0;

  return (
    <div className="bg-surface-2 rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 flex items-center gap-2 hover:bg-surface transition-colors"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={12} className="text-text-muted" />
        </motion.div>
        <span className="text-[12px] font-medium text-text-primary">
          {flavor.name}
        </span>
        <span className="text-[10px] text-text-muted ml-auto">
          {flavor.resources.length} resource{flavor.resources.length !== 1 ? 's' : ''}
        </span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 pt-1 space-y-2 border-t border-border">
              {/* Node Labels */}
              {hasNodeLabels && (
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">
                    Node Labels
                  </div>
                  <div className="space-y-0.5">
                    {Object.entries(flavor.nodeLabels!).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1 text-[11px] bg-surface rounded px-1.5 py-0.5"
                      >
                        <span className="text-text-muted truncate" title={key}>
                          {key.replace('nvidia.com/', '')}:
                        </span>
                        <span className="text-text-primary font-medium truncate" title={value}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Node Taints */}
              {hasNodeTaints && (
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">
                    Node Taints
                  </div>
                  <div className="space-y-0.5">
                    {flavor.nodeTaints!.map((taint, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-[11px] bg-warning/10 border border-warning/20 rounded px-1.5 py-0.5"
                      >
                        <span className="text-warning">
                          {taint.key}={taint.value || '*'}:{taint.effect}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">
                  Resources
                </div>
                <div className="space-y-1">
                  {flavor.resources.map((resource) => (
                    <div
                      key={resource.name}
                      className="flex items-center justify-between text-[11px] py-0.5"
                    >
                      <span className="text-text-muted truncate max-w-[120px]" title={resource.name}>
                        {resource.name.replace('nvidia.com/', '')}
                      </span>
                      <div className="flex gap-3 text-text-secondary">
                        <span>Q: {formatQuantity(resource.nominalQuotaRaw)}</span>
                        {resource.borrowingLimit > 0 && (
                          <span className="text-warning">B: +{formatQuantity(resource.borrowingLimitRaw)}</span>
                        )}
                        {resource.lendingLimit > 0 && (
                          <span className="text-compute">L: {formatQuantity(resource.lendingLimitRaw)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Policy badge component
function PolicyBadge({ value }: { value: string | undefined }) {
  if (!value) {
    return (
      <span className="px-2 py-0.5 bg-surface-2 rounded text-[11px] text-text-muted">
        Default
      </span>
    );
  }

  const colorMap: Record<string, string> = {
    Never: 'bg-surface-2 text-text-muted',
    LowerPriority: 'bg-warning/10 text-warning border border-warning/20',
    Any: 'bg-critical/10 text-critical border border-critical/20',
    Borrow: 'bg-compute/10 text-compute border border-compute/20',
    TryNextFlavor: 'bg-memory/10 text-memory border border-memory/20',
    Preempt: 'bg-warning/10 text-warning border border-warning/20',
    LowerOrNewerEqualPriority: 'bg-warning/10 text-warning border border-warning/20',
  };

  const colorClass = colorMap[value] || 'bg-surface-2 text-text-secondary';

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colorClass}`}>
      {formatPolicy(value)}
    </span>
  );
}
