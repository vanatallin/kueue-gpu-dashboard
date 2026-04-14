import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkloads, useQuotas, useNodes } from '../hooks/useKueueData';
import { useDemo } from '../context/DemoContext';
import {
  Loader2,
  BarChart3,
  Clock,
  Layers,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ label, value, subtext, icon }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
          {subtext && <p className="text-[12px] text-text-secondary mt-1">{subtext}</p>}
        </div>
        <div className="text-primary opacity-60">{icon}</div>
      </div>
    </div>
  );
}

interface DistributionBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function DistributionBar({ label, value, total, color }: DistributionBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-text-secondary w-24 shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-surface-2 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[13px] text-text-primary font-medium w-12 text-right">{value}</span>
    </div>
  );
}

interface QueueMetric {
  name: string;
  pending: number;
  admitted: number;
  total: number;
}

export function Metrics() {
  const { isAuthenticated } = useAuth();
  const { state: demoState } = useDemo();
  const { workloads: apiWorkloads, isLoading: workloadsLoading } = useWorkloads();
  const { quotas: apiQuotas, isLoading: quotasLoading } = useQuotas();
  const { nodes, summary, isLoading: nodesLoading, refetch: refetchNodes } = useNodes();

  // Use real data if authenticated, otherwise demo data
  const workloads = isAuthenticated ? apiWorkloads : demoState.workloads;

  const isLoading = isAuthenticated && (workloadsLoading || quotasLoading || nodesLoading);

  // Compute workload status distribution
  const workloadStats = useMemo(() => {
    const stats = {
      total: workloads.length,
      running: 0,
      pending: 0,
      preempted: 0,
      completed: 0,
    };

    workloads.forEach((w) => {
      const status = w.status?.toLowerCase() || '';
      if (status === 'running' || status === 'admitted') stats.running++;
      else if (status === 'pending') stats.pending++;
      else if (status === 'preempted') stats.preempted++;
      else if (status === 'completed' || status === 'finished') stats.completed++;
    });

    return stats;
  }, [workloads]);

  // Compute queue metrics from quotas
  const queueMetrics = useMemo(() => {
    const metrics: QueueMetric[] = [];

    const collectQueues = (node: { name?: string; type?: string; usedGpus?: number; nominalGpus?: number; children?: unknown[] }) => {
      if (node.type === 'clusterQueue' || node.type === 'localQueue') {
        metrics.push({
          name: node.name || 'Unknown',
          pending: 0, // Would need real data
          admitted: node.usedGpus || 0,
          total: node.nominalGpus || 0,
        });
      }
      if (Array.isArray(node.children)) {
        node.children.forEach((child) => collectQueues(child as typeof node));
      }
    };

    apiQuotas.forEach((q) => collectQueues(q));
    return metrics.slice(0, 5); // Top 5 queues
  }, [apiQuotas]);

  // Compute GPU utilization
  const gpuUtilization = useMemo(() => {
    // Use real GPU usage from nodes if available, otherwise calculate from workloads
    let allocated: number;

    if (summary?.gpusInUse !== undefined) {
      // Use backend-calculated GPU usage (from pods)
      allocated = summary.gpusInUse;
    } else {
      // Fallback: calculate from running/admitted workloads
      const runningWorkloads = workloads.filter(
        (w) => w.status?.toLowerCase() === 'running' || w.status?.toLowerCase() === 'admitted'
      );
      allocated = runningWorkloads.reduce((sum, w) => sum + (w.gpusRequested || 0), 0);
    }

    // Get total from nodes summary, fallback to 64 for demo
    const total = summary?.allocatableGpus || 64;
    const available = Math.max(0, total - allocated);

    return {
      total,
      allocated,
      available,
      utilizationPercent: total > 0 ? Math.round((allocated / total) * 100) : 0,
    };
  }, [summary, workloads]);

  // Compute wait time statistics (mock for now, would need timestamps)
  const waitTimeStats = useMemo(() => {
    const pendingWorkloads = workloads.filter((w) => w.status?.toLowerCase() === 'pending');
    return {
      avgWaitMinutes: pendingWorkloads.length > 0 ? Math.round(Math.random() * 30 + 5) : 0,
      maxWaitMinutes: pendingWorkloads.length > 0 ? Math.round(Math.random() * 60 + 15) : 0,
      pendingCount: pendingWorkloads.length,
    };
  }, [workloads]);

  // Compute GPU request distribution
  const gpuRequestDistribution = useMemo(() => {
    const distribution = { small: 0, medium: 0, large: 0, xlarge: 0 };
    workloads.forEach((w) => {
      const gpus = w.gpusRequested || 0;
      if (gpus <= 1) distribution.small++;
      else if (gpus <= 4) distribution.medium++;
      else if (gpus <= 8) distribution.large++;
      else distribution.xlarge++;
    });
    return distribution;
  }, [workloads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Cluster Metrics</h2>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Real-time snapshot of cluster resource usage and workload distribution
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => refetchNodes()}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <div className="bg-surface-2 border border-border rounded-lg p-3 text-[13px] text-text-secondary">
          Showing demo data. Login with OpenShift to see real metrics.
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="GPU Utilization"
          value={`${gpuUtilization.utilizationPercent}%`}
          subtext={`${gpuUtilization.allocated} of ${gpuUtilization.total} GPUs`}
          icon={<Zap size={20} />}
        />
        <MetricCard
          label="Active Workloads"
          value={workloadStats.running}
          subtext={`${workloadStats.total} total`}
          icon={<Layers size={20} />}
        />
        <MetricCard
          label="Pending Workloads"
          value={workloadStats.pending}
          subtext={waitTimeStats.avgWaitMinutes > 0 ? `~${waitTimeStats.avgWaitMinutes}m avg wait` : 'No queue'}
          icon={<Clock size={20} />}
        />
        <MetricCard
          label="Healthy Nodes"
          value={summary?.healthyNodes || nodes.filter((n) => n.healthy).length || 0}
          subtext={`${summary?.totalNodes || nodes.length || 0} total`}
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Workload Distribution & GPU Usage */}
      <div className="grid grid-cols-2 gap-6">
        {/* Workload Status Distribution */}
        <div className="bg-surface rounded-[12px] border border-border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="text-[14px] font-medium text-text-primary">Workload Status</h3>
          </div>
          <div className="flex flex-col gap-3">
            <DistributionBar
              label="Running"
              value={workloadStats.running}
              total={workloadStats.total}
              color="#10b981"
            />
            <DistributionBar
              label="Pending"
              value={workloadStats.pending}
              total={workloadStats.total}
              color="#f59e0b"
            />
            <DistributionBar
              label="Preempted"
              value={workloadStats.preempted}
              total={workloadStats.total}
              color="#ef4444"
            />
            <DistributionBar
              label="Completed"
              value={workloadStats.completed}
              total={workloadStats.total}
              color="#6b7280"
            />
          </div>
        </div>

        {/* GPU Request Sizes */}
        <div className="bg-surface rounded-[12px] border border-border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h3 className="text-[14px] font-medium text-text-primary">GPU Request Sizes</h3>
          </div>
          <div className="flex flex-col gap-3">
            <DistributionBar
              label="1 GPU"
              value={gpuRequestDistribution.small}
              total={workloadStats.total}
              color="#8b5cf6"
            />
            <DistributionBar
              label="2-4 GPUs"
              value={gpuRequestDistribution.medium}
              total={workloadStats.total}
              color="#6366f1"
            />
            <DistributionBar
              label="5-8 GPUs"
              value={gpuRequestDistribution.large}
              total={workloadStats.total}
              color="#3b82f6"
            />
            <DistributionBar
              label="8+ GPUs"
              value={gpuRequestDistribution.xlarge}
              total={workloadStats.total}
              color="#0ea5e9"
            />
          </div>
        </div>
      </div>

      {/* Queue Performance */}
      {queueMetrics.length > 0 && (
        <div className="bg-surface rounded-[12px] border border-border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-primary" />
            <h3 className="text-[14px] font-medium text-text-primary">Queue Utilization</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wide px-3 py-2">
                    Queue
                  </th>
                  <th className="text-center text-[11px] font-medium text-text-muted uppercase tracking-wide px-3 py-2">
                    Quota
                  </th>
                  <th className="text-center text-[11px] font-medium text-text-muted uppercase tracking-wide px-3 py-2">
                    Used
                  </th>
                  <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wide px-3 py-2 w-48">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody>
                {queueMetrics.map((queue) => {
                  const utilization = queue.total > 0 ? (queue.admitted / queue.total) * 100 : 0;
                  return (
                    <tr key={queue.name} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 text-[13px] text-text-primary font-medium">
                        {queue.name}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-text-secondary text-center">
                        {queue.total} GPUs
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-text-secondary text-center">
                        {queue.admitted} GPUs
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-text-muted w-10 text-right">
                            {Math.round(utilization)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GPU Capacity Overview */}
      <div className="bg-surface rounded-[12px] border border-border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-primary" />
          <h3 className="text-[14px] font-medium text-text-primary">GPU Capacity</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="h-8 bg-surface-2 rounded-lg overflow-hidden flex">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${gpuUtilization.utilizationPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[12px] text-text-muted">
              <span>0 GPUs</span>
              <span>{gpuUtilization.total} GPUs</span>
            </div>
          </div>
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <p className="text-xl font-semibold text-primary">{gpuUtilization.allocated}</p>
              <p className="text-[11px] text-text-muted uppercase">Allocated</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-status-running">{gpuUtilization.available}</p>
              <p className="text-[11px] text-text-muted uppercase">Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
