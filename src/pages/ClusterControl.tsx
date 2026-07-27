import { useMemo, useState, useCallback } from 'react';
import { useWorkloads, useNodes, useQuotas } from '../hooks/useKueueData';
import { MetricCard } from '../components/cards/MetricCard';
import { QueueWorkloadsPopover } from '../components/queues/QueueWorkloadsPopover';
import { Loader2, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCpu, formatMemoryGi, percentUsed } from '../utils/formatResources';
import type { QuotaNode } from '../types/kueue';

interface QueueTileData {
  name: string;
  usedGpus: number;
  nominalGpus: number;
  usedCpu: number;
  nominalCpu: number;
  usedMemory: number;
  nominalMemory: number;
}

export function ClusterControl() {
  const [selectedQueue, setSelectedQueue] = useState<{
    name: string;
    usedGpus: number;
    nominalGpus: number;
    usedCpu: number;
    nominalCpu: number;
    usedMemory: number;
    nominalMemory: number;
    rect: DOMRect;
  } | null>(null);

  const handleQueueClick = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    queue: QueueTileData
  ) => {
    e.stopPropagation();

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

  const { workloads, isLoading: workloadsLoading, error: workloadsError } = useWorkloads();
  const { summary, isLoading: nodesLoading, error: nodesError } = useNodes();
  const { quotas, isLoading: quotasLoading } = useQuotas();

  const metrics = useMemo(() => {
    if (summary) {
      return {
        totalClusterNodes: summary.totalClusterNodes,
        healthyClusterNodes: summary.healthyClusterNodes,
        gpuNodes: summary.gpuNodes,
        healthyGpuNodes: summary.healthyGpuNodes,
        totalGpus: summary.allocatableGpus,
        usedGpus: summary.gpusInUse,
        cpuAllocatable: summary.cpuAllocatable,
        cpuInUse: summary.cpuInUse,
        memoryAllocatableGi: summary.memoryAllocatableGi,
        memoryInUseGi: summary.memoryInUseGi,
      };
    }
    return {
      totalClusterNodes: 0,
      healthyClusterNodes: 0,
      gpuNodes: 0,
      healthyGpuNodes: 0,
      totalGpus: 0,
      usedGpus: 0,
      cpuAllocatable: 0,
      cpuInUse: 0,
      memoryAllocatableGi: 0,
      memoryInUseGi: 0,
    };
  }, [summary]);

  const workloadStats = useMemo(() => {
    const running = workloads.filter((w) => w.status === 'running').length;
    const pending = workloads.filter((w) => w.status === 'pending').length;
    const completed = workloads.filter((w) => w.status === 'completed').length;
    const preempted = workloads.filter((w) => w.status === 'preempted').length;

    const byType = new Map<string, number>();
    for (const w of workloads) {
      const type = w.type || 'Job';
      byType.set(type, (byType.get(type) || 0) + 1);
    }

    const runningWorkloads = workloads.filter((w) => w.status === 'running');
    const gpusInUse = runningWorkloads.reduce((sum, w) => sum + (w.gpusRequested || 0), 0);
    const cpuInUse = runningWorkloads.reduce((sum, w) => sum + (w.cpuRequested || 0), 0);
    const memoryInUseGi = runningWorkloads.reduce((sum, w) => sum + (w.memoryRequested || 0), 0);

    return {
      total: workloads.length,
      running,
      pending,
      completed,
      preempted,
      byType: Array.from(byType.entries()).sort((a, b) => b[1] - a[1]),
      gpusInUse,
      cpuInUse,
      memoryInUseGi,
    };
  }, [workloads]);

  const clusterQueues = useMemo(() => {
    const queues: QueueTileData[] = [];
    const extractQueues = (nodes: QuotaNode[]) => {
      for (const node of nodes) {
        if (node.type === 'clusterQueue') {
          queues.push({
            name: node.name,
            usedGpus: node.usedGpus,
            nominalGpus: node.nominalGpus,
            usedCpu: node.usedCpu ?? 0,
            nominalCpu: node.nominalCpu ?? 0,
            usedMemory: node.usedMemory ?? 0,
            nominalMemory: node.nominalMemory ?? 0,
          });
        }
        if (node.children) extractQueues(node.children);
      }
    };
    extractQueues(quotas);
    return queues;
  }, [quotas]);

  const insights = useMemo(() => {
    const items: Array<{ severity: 'info' | 'warning' | 'success'; message: string }> = [];

    if (metrics.totalGpus > 0) {
      const utilization = percentUsed(metrics.usedGpus, metrics.totalGpus);
      if (utilization >= 90) {
        items.push({ severity: 'warning', message: `High GPU utilization: ${utilization}% of GPUs in use.` });
      } else if (utilization >= 70) {
        items.push({ severity: 'info', message: `GPU utilization at ${utilization}%. Cluster is moderately loaded.` });
      } else {
        items.push({ severity: 'success', message: `GPU utilization at ${utilization}%. Resources available.` });
      }
    }

    if (metrics.cpuAllocatable > 0) {
      const cpuUtil = percentUsed(metrics.cpuInUse, metrics.cpuAllocatable);
      if (cpuUtil >= 90) {
        items.push({ severity: 'warning', message: `High CPU utilization: ${cpuUtil}% of allocatable cores requested.` });
      } else if (cpuUtil >= 70) {
        items.push({ severity: 'info', message: `CPU utilization at ${cpuUtil}%.` });
      }
    }

    if (metrics.memoryAllocatableGi > 0) {
      const memUtil = percentUsed(metrics.memoryInUseGi, metrics.memoryAllocatableGi);
      if (memUtil >= 90) {
        items.push({ severity: 'warning', message: `High memory utilization: ${memUtil}% of allocatable memory requested.` });
      } else if (memUtil >= 70) {
        items.push({ severity: 'info', message: `Memory utilization at ${memUtil}%.` });
      }
    }

    if (workloadStats.pending > 0) {
      items.push({
        severity: workloadStats.pending > 5 ? 'warning' : 'info',
        message: `${workloadStats.pending} workload${workloadStats.pending > 1 ? 's' : ''} pending in queue.`,
      });
    }

    const unhealthyClusterNodes = metrics.totalClusterNodes - metrics.healthyClusterNodes;
    if (unhealthyClusterNodes > 0) {
      items.push({
        severity: 'warning',
        message: `${unhealthyClusterNodes} node${unhealthyClusterNodes > 1 ? 's' : ''} reporting unhealthy status.`,
      });
    }

    if (items.length === 0 || (items.length === 1 && items[0].severity === 'success')) {
      if (workloadStats.running > 0) {
        items.push({ severity: 'success', message: `${workloadStats.running} workload${workloadStats.running > 1 ? 's' : ''} running smoothly.` });
      }
    }

    return items;
  }, [metrics, workloadStats]);

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

  const renderUtilBar = (used: number, total: number, colorClass: string) => {
    const utilization = percentUsed(used, total);
    return (
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard
          label="Cluster Nodes"
          value={metrics.totalClusterNodes}
          sub={`Healthy: ${metrics.healthyClusterNodes}  ·  ${metrics.gpuNodes} GPU`}
          barValue={metrics.healthyClusterNodes}
          barMax={metrics.totalClusterNodes || 1}
          barColor="var(--color-success)"
        />
        <MetricCard
          label="Total GPUs"
          value={metrics.totalGpus}
          sub={`Used: ${metrics.usedGpus}  ·  Free: ${metrics.totalGpus - metrics.usedGpus}`}
          barValue={metrics.usedGpus}
          barMax={metrics.totalGpus || 1}
          barColor="var(--color-primary)"
        />
        <MetricCard
          label="CPU"
          value={`${formatCpu(metrics.cpuInUse)} / ${formatCpu(metrics.cpuAllocatable)}`}
          sub="cores in use"
          barValue={metrics.cpuInUse}
          barMax={metrics.cpuAllocatable || 1}
          barColor="var(--color-compute)"
        />
        <MetricCard
          label="Memory"
          value={`${formatMemoryGi(metrics.memoryInUseGi)} / ${formatMemoryGi(metrics.memoryAllocatableGi)}`}
          sub="GiB in use"
          barValue={metrics.memoryInUseGi}
          barMax={metrics.memoryAllocatableGi || 1}
          barColor="var(--color-memory)"
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
          barColor="var(--color-primary)"
        />
      </div>

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

      {clusterQueues.length > 0 && (
        <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-medium text-text-primary mb-4">Cluster Queue Overview</h3>
          <div className="flex flex-wrap gap-4">
            {clusterQueues.map((queue) => {
              const gpuUtil = percentUsed(queue.usedGpus, queue.nominalGpus);
              const cpuUtil = percentUsed(queue.usedCpu, queue.nominalCpu);
              const memUtil = percentUsed(queue.usedMemory, queue.nominalMemory);
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
                  <div className="text-[11px] text-text-muted mb-1">
                    {queue.usedGpus} / {queue.nominalGpus} GPUs ({gpuUtil}%)
                  </div>
                  {renderUtilBar(queue.usedGpus, queue.nominalGpus, 'bg-primary')}
                  {queue.nominalCpu > 0 && (
                    <>
                      <div className="text-[11px] text-text-muted mt-2 mb-1">
                        {formatCpu(queue.usedCpu)} / {formatCpu(queue.nominalCpu)} CPU ({cpuUtil}%)
                      </div>
                      {renderUtilBar(queue.usedCpu, queue.nominalCpu, 'bg-compute')}
                    </>
                  )}
                  {queue.nominalMemory > 0 && (
                    <>
                      <div className="text-[11px] text-text-muted mt-2 mb-1">
                        {formatMemoryGi(queue.usedMemory)} / {formatMemoryGi(queue.nominalMemory)} GiB ({memUtil}%)
                      </div>
                      {renderUtilBar(queue.usedMemory, queue.nominalMemory, 'bg-memory')}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <QueueWorkloadsPopover
            queueName={selectedQueue?.name || ''}
            workloads={workloads}
            usedGpus={selectedQueue?.usedGpus || 0}
            nominalGpus={selectedQueue?.nominalGpus || 0}
            usedCpu={selectedQueue?.usedCpu || 0}
            nominalCpu={selectedQueue?.nominalCpu || 0}
            usedMemory={selectedQueue?.usedMemory || 0}
            nominalMemory={selectedQueue?.nominalMemory || 0}
            isOpen={selectedQueue !== null}
            onClose={closePopover}
            anchorRect={selectedQueue?.rect || null}
          />
        </div>
      )}

      <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="text-sm font-medium text-text-primary mb-4">Workload Summary</h3>
        <div className="grid grid-cols-2 gap-6">
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

        {workloadStats.running > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {workloadStats.gpusInUse > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">GPUs requested by running workloads</span>
                <span className="font-medium text-text-primary">{workloadStats.gpusInUse}</span>
              </div>
            )}
            {workloadStats.cpuInUse > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">CPU cores requested by running workloads</span>
                <span className="font-medium text-text-primary">{formatCpu(workloadStats.cpuInUse)}</span>
              </div>
            )}
            {workloadStats.memoryInUseGi > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">Memory requested by running workloads</span>
                <span className="font-medium text-text-primary">{formatMemoryGi(workloadStats.memoryInUseGi)} GiB</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
