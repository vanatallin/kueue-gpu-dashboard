import { useState, useMemo, useCallback } from 'react';
import { useClusterQueues } from '../hooks/useKueueData';
import { ClusterQueueConfigPopover } from '../components/queues/ClusterQueueConfigPopover';
import { Loader2, AlertCircle, Layers, CheckCircle, Clock, ArrowRightLeft, Info } from 'lucide-react';
import type { ClusterQueueInfo } from '../services/api';

export function ClusterQueues() {
  const { clusterQueues, localQueues, isLoading, error } = useClusterQueues();
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  // Config popover state
  const [configPopover, setConfigPopover] = useState<{
    queue: ClusterQueueInfo;
    rect: DOMRect;
  } | null>(null);

  const handleConfigClick = useCallback((
    e: React.MouseEvent<HTMLButtonElement>,
    queue: ClusterQueueInfo
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Toggle if clicking the same queue
    if (configPopover?.queue.id === queue.id) {
      setConfigPopover(null);
    } else {
      setConfigPopover({ queue, rect });
    }
  }, [configPopover?.queue.id]);

  const closeConfigPopover = useCallback(() => {
    setConfigPopover(null);
  }, []);

  // Get unique cohorts
  const cohorts = useMemo(() => {
    const cohortSet = new Set<string>();
    for (const cq of clusterQueues) {
      cohortSet.add(cq.cohort || 'default');
    }
    return Array.from(cohortSet).sort();
  }, [clusterQueues]);

  // Group cluster queues by cohort
  const groupedQueues = useMemo(() => {
    const groups = new Map<string, typeof clusterQueues>();
    for (const cq of clusterQueues) {
      const cohort = cq.cohort || 'default';
      if (!groups.has(cohort)) {
        groups.set(cohort, []);
      }
      groups.get(cohort)!.push(cq);
    }
    return groups;
  }, [clusterQueues]);

  // Get filtered queues based on selected cohort
  const filteredQueues = useMemo(() => {
    if (selectedCohort === null) {
      // Return all queues sorted by cohort then name
      return [...clusterQueues].sort((a, b) => {
        const cohortA = a.cohort || 'default';
        const cohortB = b.cohort || 'default';
        if (cohortA !== cohortB) return cohortA.localeCompare(cohortB);
        return a.name.localeCompare(b.name);
      });
    }
    return clusterQueues.filter((cq) => (cq.cohort || 'default') === selectedCohort);
  }, [clusterQueues, selectedCohort]);

  // Get local queues for a cluster queue
  const getLocalQueuesForCQ = (cqName: string) => {
    return localQueues.filter((lq) => lq.clusterQueue === cqName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading cluster queues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-critical">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (clusterQueues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p>No cluster queues found in the cluster.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Cohort Filter Sidebar */}
      <div className="w-56 shrink-0">
        <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-[11px] uppercase tracking-wide text-text-muted mb-3">Cohorts</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedCohort(null)}
              className={`text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                selectedCohort === null
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              All Cohorts ({clusterQueues.length})
            </button>
            {cohorts.map((cohort) => {
              const count = groupedQueues.get(cohort)?.length || 0;
              return (
                <button
                  key={cohort}
                  onClick={() => setSelectedCohort(cohort)}
                  className={`text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    selectedCohort === cohort
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  {cohort} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue Tiles */}
      <div className="flex-1 overflow-y-auto">
        {/* Header when a specific cohort is selected */}
        {selectedCohort && (
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-primary" />
            <h2 className="text-sm font-medium text-text-primary">{selectedCohort}</h2>
            <span className="text-[11px] text-text-muted">({filteredQueues.length} queues)</span>
          </div>
        )}

        {/* Queue Tiles Grid - single responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredQueues.map((cq) => {
            const localQs = getLocalQueuesForCQ(cq.name);
            const availableGpus = cq.nominalGpus - cq.usedGpus + cq.borrowedGpus;

            return (
              <div
                key={cq.id}
                className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:border-primary transition-colors min-w-0"
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] text-text-muted uppercase tracking-wide">
                      {cq.cohort || 'default'}
                    </div>
                    <button
                      onClick={(e) => handleConfigClick(e, cq)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`p-1 rounded-md transition-colors ${
                        configPopover?.queue.id === cq.id
                          ? 'bg-primary/20 text-primary'
                          : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                      }`}
                      title="View configuration"
                    >
                      <Info size={14} />
                    </button>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary truncate" title={cq.name}>
                    {cq.name}
                  </h3>
                </div>

                {/* Local Queues */}
                {localQs.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[11px] text-text-muted mb-1">Local Queues</div>
                    <div className="flex flex-wrap gap-1">
                      {localQs.slice(0, 3).map((lq) => (
                        <span
                          key={lq.id}
                          className="px-2 py-0.5 bg-surface-2 rounded text-[11px] text-text-secondary truncate max-w-[120px]"
                          title={`${lq.namespace}/${lq.name}`}
                        >
                          {lq.name}
                        </span>
                      ))}
                      {localQs.length > 3 && (
                        <span className="px-2 py-0.5 bg-surface-2 rounded text-[11px] text-text-muted">
                          +{localQs.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* GPU Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <div className="text-[11px] text-text-muted">Quota</div>
                    <div className="text-lg font-semibold text-text-primary">{cq.nominalGpus}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-muted">Allocated</div>
                    <div className="text-lg font-semibold text-primary">{cq.usedGpus}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-muted">Available</div>
                    <div className="text-lg font-semibold text-success">{Math.max(0, availableGpus)}</div>
                  </div>
                </div>

                {/* Borrowing/Lending Indicators */}
                {(cq.borrowedGpus > 0 || (cq.lentGpus ?? 0) > 0) && (
                  <div className="mb-4 flex flex-col gap-2">
                    {/* Borrowed GPUs */}
                    {cq.borrowedGpus > 0 && (
                      <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft size={14} className="text-warning" />
                          <span className="text-[12px] text-warning">
                            Borrowing {cq.borrowedGpus} GPU{cq.borrowedGpus > 1 ? 's' : ''} from cohort
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Lent GPUs */}
                    {(cq.lentGpus ?? 0) > 0 && (
                      <div className="p-2 bg-compute/10 rounded-lg border border-compute/20">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft size={14} className="text-compute" />
                          <span className="text-[12px] text-compute">
                            Lending {cq.lentGpus} GPU{cq.lentGpus > 1 ? 's' : ''} to cohort
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Utilization Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${cq.nominalGpus > 0 ? Math.min((cq.usedGpus / cq.nominalGpus) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-text-muted mt-1 text-right">
                    {cq.nominalGpus > 0 ? Math.round((cq.usedGpus / cq.nominalGpus) * 100) : 0}% utilized
                  </div>
                </div>

                {/* Workload Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-success" />
                    <span className="text-[12px] text-text-secondary">
                      {cq.admittedWorkloads} admitted
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-warning" />
                    <span className="text-[12px] text-text-secondary">
                      {cq.pendingWorkloads} pending
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Config Popover */}
        <ClusterQueueConfigPopover
          queueName={configPopover?.queue.name || ''}
          config={configPopover?.queue.config}
          isOpen={configPopover !== null}
          onClose={closeConfigPopover}
          anchorRect={configPopover?.rect || null}
        />
      </div>
    </div>
  );
}
