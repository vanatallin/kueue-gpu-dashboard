import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkloads, useNodes, useQuotas } from '../hooks/useKueueData';
import { MetricCard } from '../components/cards/MetricCard';
import { QueueWorkloadsPopover } from '../components/queues/QueueWorkloadsPopover';
import { Loader2, AlertCircle, LogIn, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { QuotaNode } from '../types/kueue';

export function ClusterControl() {
  const { isAuthenticated, login } = useAuth();

  // Popover state
  const [selectedQueue, setSelectedQueue] = useState<{
    name: string;
    usedGpus: number;
    nominalGpus: number;
    rect: DOMRect;
  } | null>(null);

  const handleQueueClick = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    queue: { name: string; usedGpus: number; nominalGpus: number }
  ) => {
    // Stop propagation to prevent click-outside handler from interfering
    e.stopPropagation();

    // Toggle: close if clicking the same queue
    if (selectedQueue?.name === queue.name) {
      setSelectedQueue(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedQueue({ ...queue, rect });
  }, [selectedQueue?.name]);

  const closePopover = useCallback(() => {
    setSelectedQueue(null);
  }, []);

  // Fetch real data
  const { workloads, isLoading: workloadsLoading, error: workloadsError } = useWorkloads();
  const { summary, isLoading: nodesLoading, error: nodesError } = useNodes();
  const { quotas, isLoading: quotasLoading } = useQuotas();

  // Compute metrics from real data
  const metrics = useMemo(() => {
    if (summary) {
      return {
        totalNodes: summary.totalNodes,
        healthyNodes: summary.healthyNodes,
        totalGpus: summary.allocatableGpus,
        usedGpus: summary.gpusInUse,
      };
    }
    return {
      totalNodes: 0,
      healthyNodes: 0,
      totalGpus: 0,
      usedGpus: 0,
    };
  }, [summary]);

  // Compute workload stats
  const workloadStats = useMemo(() => {
    const running = workloads.filter((w) => w.status === 'running').length;
    const pending = workloads.filter((w) => w.status === 'pending').length;
    const completed = workloads.filter((w) => w.status === 'completed').length;
    const preempted = workloads.filter((w) => w.status === 'preempted').length;

    // Group by type
    const byType = new Map<string, number>();
    for (const w of workloads) {
      const type = w.type || 'Job';
      byType.set(type, (byType.get(type) || 0) + 1);
    }

    // Calculate total GPUs requested by running workloads
    const gpusInUse = workloads
      .filter((w) => w.status === 'running')
      .reduce((sum, w) => sum + (w.gpusRequested || 0), 0);

    return {
      total: workloads.length,
      running,
      pending,
      completed,
      preempted,
      byType: Array.from(byType.entries()).sort((a, b) => b[1] - a[1]),
      gpusInUse,
    };
  }, [workloads]);

  // Extract ClusterQueues for overview
  const clusterQueues = useMemo(() => {
    const queues: Array<{ name: string; usedGpus: number; nominalGpus: number }> = [];
    const extractQueues = (nodes: QuotaNode[]) => {
      for (const node of nodes) {
        if (node.type === 'clusterQueue') {
          queues.push({
            name: node.name,
            usedGpus: node.usedGpus,
            nominalGpus: node.nominalGpus,
          });
        }
        if (node.children) extractQueues(node.children);
      }
    };
    extractQueues(quotas);
    return queues;
  }, [quotas]);

  // Generate insights based on real data
  const insights = useMemo(() => {
    const items: Array<{ severity: 'info' | 'warning' | 'success'; message: string }> = [];

    // GPU utilization insight
    if (metrics.totalGpus > 0) {
      const utilization = Math.round((metrics.usedGpus / metrics.totalGpus) * 100);
      if (utilization >= 90) {
        items.push({ severity: 'warning', message: `High GPU utilization: ${utilization}% of GPUs in use.` });
      } else if (utilization >= 70) {
        items.push({ severity: 'info', message: `GPU utilization at ${utilization}%. Cluster is moderately loaded.` });
      } else {
        items.push({ severity: 'success', message: `GPU utilization at ${utilization}%. Resources available.` });
      }
    }

    // Pending workloads insight
    if (workloadStats.pending > 0) {
      items.push({
        severity: workloadStats.pending > 5 ? 'warning' : 'info',
        message: `${workloadStats.pending} workload${workloadStats.pending > 1 ? 's' : ''} pending in queue.`,
      });
    }

    // Unhealthy nodes insight
    const unhealthyNodes = metrics.totalNodes - metrics.healthyNodes;
    if (unhealthyNodes > 0) {
      items.push({
        severity: 'warning',
        message: `${unhealthyNodes} GPU node${unhealthyNodes > 1 ? 's' : ''} reporting unhealthy status.`,
      });
    }

    // All healthy
    if (items.length === 0 || (items.length === 1 && items[0].severity === 'success')) {
      if (workloadStats.running > 0) {
        items.push({ severity: 'success', message: `${workloadStats.running} workload${workloadStats.running > 1 ? 's' : ''} running smoothly.` });
      }
    }

    return items;
  }, [metrics, workloadStats]);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-text-primary mb-2">Login Required</h2>
          <p className="text-sm text-text-secondary mb-4">
            Connect to your OpenShift cluster to view real-time Kueue data.
          </p>
        </div>
        <Button variant="primary" onClick={login} className="gap-2">
          <LogIn size={16} />
          Login with OpenShift
        </Button>
      </div>
    );
  }

  const isLoading = workloadsLoading || nodesLoading || quotasLoading;
  const error = workloadsError || nodesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading cluster data...</span>
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

  const InsightIcon = ({ severity }: { severity: 'info' | 'warning' | 'success' }) => {
    if (severity === 'warning') return <AlertTriangle size={16} className="text-warning shrink-0" />;
    if (severity === 'success') return <CheckCircle size={16} className="text-success shrink-0" />;
    return <Info size={16} className="text-compute shrink-0" />;
  };

  const TYPE_COLORS: Record<string, string> = {
    PyTorchJob: 'bg-orange-500',
    RayJob: 'bg-blue-500',
    MPIJob: 'bg-purple-500',
    TFJob: 'bg-yellow-500',
    Job: 'bg-gray-500',
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          label="GPU Nodes"
          value={metrics.totalNodes}
          sub={`Healthy: ${metrics.healthyNodes}  ·  Unhealthy: ${metrics.totalNodes - metrics.healthyNodes}`}
          barValue={metrics.healthyNodes}
          barMax={metrics.totalNodes}
          barColor="var(--color-success)"
        />
        <MetricCard
          label="Total GPUs"
          value={metrics.totalGpus}
          sub={`Used: ${metrics.usedGpus}  ·  Free: ${metrics.totalGpus - metrics.usedGpus}`}
          barValue={metrics.usedGpus}
          barMax={metrics.totalGpus}
          barColor="var(--color-primary)"
        />
        <MetricCard
          label="Workloads"
          value={workloadStats.total}
          sub={`Running: ${workloadStats.running}  ·  Pending: ${workloadStats.pending}`}
          barValue={workloadStats.running}
          barMax={workloadStats.total || 1}
          barColor="var(--color-compute)"
        />
        <MetricCard
          label="Cluster Queues"
          value={clusterQueues.length}
          sub="Active queues"
          barValue={clusterQueues.length}
          barMax={clusterQueues.length || 1}
          barColor="var(--color-memory)"
        />
      </div>

      {/* Insights Section */}
      <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="text-sm font-medium text-text-primary mb-3">Cluster Insights</h3>
        <div className="flex flex-col gap-2">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <InsightIcon severity={insight.severity} />
              <p className="text-[13px] text-text-secondary leading-[18px]">{insight.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster Queue Overview */}
      {clusterQueues.length > 0 && (
        <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-medium text-text-primary mb-4">Cluster Queue Overview</h3>
          <div className="flex flex-wrap gap-4">
            {clusterQueues.map((queue) => {
              const utilization = queue.nominalGpus > 0 ? Math.round((queue.usedGpus / queue.nominalGpus) * 100) : 0;
              const queueWorkloads = workloads.filter(
                (w) => w.pool === queue.name && (w.status === 'running' || w.status === 'pending')
              );
              const isSelected = selectedQueue?.name === queue.name;
              return (
                <div
                  key={queue.name}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleQueueClick(e, queue)}
                  className={`w-[200px] p-3 rounded-[10px] bg-surface-2 border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary truncate" title={queue.name}>
                      {queue.name}
                    </span>
                    {queueWorkloads.length > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-primary text-white text-[10px] font-medium rounded-full">
                        {queueWorkloads.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted mb-2">
                    {queue.usedGpus} / {queue.nominalGpus} GPUs ({utilization}%)
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Queue Workloads Popover */}
          <QueueWorkloadsPopover
            queueName={selectedQueue?.name || ''}
            workloads={workloads}
            usedGpus={selectedQueue?.usedGpus || 0}
            nominalGpus={selectedQueue?.nominalGpus || 0}
            isOpen={selectedQueue !== null}
            onClose={closePopover}
            anchorRect={selectedQueue?.rect || null}
          />
        </div>
      )}

      {/* Workload Summary */}
      <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="text-sm font-medium text-text-primary mb-4">Workload Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Status breakdown */}
          <div>
            <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-3">By Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-[13px] text-text-secondary">Running</span>
                </div>
                <span className="text-[13px] font-medium text-text-primary">{workloadStats.running}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-[13px] text-text-secondary">Pending</span>
                </div>
                <span className="text-[13px] font-medium text-text-primary">{workloadStats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-text-muted" />
                  <span className="text-[13px] text-text-secondary">Completed</span>
                </div>
                <span className="text-[13px] font-medium text-text-primary">{workloadStats.completed}</span>
              </div>
              {workloadStats.preempted > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-critical" />
                    <span className="text-[13px] text-text-secondary">Preempted</span>
                  </div>
                  <span className="text-[13px] font-medium text-text-primary">{workloadStats.preempted}</span>
                </div>
              )}
            </div>
          </div>

          {/* Type breakdown */}
          <div>
            <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-3">By Type</h4>
            <div className="space-y-2">
              {workloadStats.byType.length > 0 ? (
                workloadStats.byType.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[type] || 'bg-gray-500'}`} />
                      <span className="text-[13px] text-text-secondary">{type}</span>
                    </div>
                    <span className="text-[13px] font-medium text-text-primary">{count}</span>
                  </div>
                ))
              ) : (
                <span className="text-[13px] text-text-muted">No workloads</span>
              )}
            </div>
          </div>
        </div>

        {/* GPU usage by workloads */}
        {workloadStats.gpusInUse > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">GPUs requested by running workloads</span>
              <span className="font-medium text-text-primary">{workloadStats.gpusInUse}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
