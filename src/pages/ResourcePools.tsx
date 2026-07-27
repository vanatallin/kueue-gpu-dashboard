import { useMemo } from 'react';
import { useQuotas, useNodes } from '../hooks/useKueueData';
import { GaugeChart } from '../components/charts/GaugeChart';
import { DonutChart } from '../components/charts/DonutChart';
import { HeatmapGrid } from '../components/charts/HeatmapGrid';
import { HorizontalBarChart } from '../components/charts/HorizontalBarChart';
import { GpuVendorChart } from '../components/charts/GpuVendorChart';
import { Loader2, AlertCircle } from 'lucide-react';
import type { QuotaNode } from '../types/kueue';
import { percentUsed } from '../utils/formatResources';

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-[12px] border border-border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex flex-col ${className}`}>
      <h3 className="text-[11px] uppercase tracking-wide text-text-muted mb-3">{title}</h3>
      <div className="flex-1 flex items-center">{children}</div>
    </div>
  );
}

export function ResourcePools() {
  const { quotas, isLoading: quotasLoading, error: quotasError } = useQuotas();
  const { nodes, summary, gpuTypes, isLoading: nodesLoading, error: nodesError } = useNodes();

  // Extract ClusterQueues as resource pools
  const clusterQueues = useMemo(() => {
    const queues: Array<{
      name: string;
      usedGpus: number;
      nominalGpus: number;
      usedCpu: number;
      nominalCpu: number;
      usedMemory: number;
      nominalMemory: number;
      gpuUtilization: number;
      cpuUtilization: number;
      memoryUtilization: number;
    }> = [];
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
            gpuUtilization: percentUsed(node.usedGpus, node.nominalGpus),
            cpuUtilization: percentUsed(node.usedCpu ?? 0, node.nominalCpu ?? 0),
            memoryUtilization: percentUsed(node.usedMemory ?? 0, node.nominalMemory ?? 0),
          });
        }
        if (node.children) extractQueues(node.children);
      }
    };
    extractQueues(quotas);
    return queues;
  }, [quotas]);

  // Calculate GPU efficiency score based on utilization
  const gpuEfficiencyScore = useMemo(() => {
    if (!summary || summary.allocatableGpus === 0) return 0;
    return percentUsed(summary.gpusInUse, summary.allocatableGpus);
  }, [summary]);

  const cpuUtilizationScore = useMemo(() => {
    if (!summary || summary.cpuAllocatable === 0) return 0;
    return percentUsed(summary.cpuInUse, summary.cpuAllocatable);
  }, [summary]);

  const memoryUtilizationScore = useMemo(() => {
    if (!summary || summary.memoryAllocatableGi === 0) return 0;
    return percentUsed(summary.memoryInUseGi, summary.memoryAllocatableGi);
  }, [summary]);

  // Calculate GPU utilization data for donut chart
  const gpuUtilization = useMemo(() => {
    if (!summary) {
      return { allocated: 0, unallocated: 0, utilization: 0, healthy: 0, warning: 0 };
    }
    const unhealthyNodes = summary.totalNodes - summary.healthyNodes;
    return {
      allocated: summary.gpusInUse,
      unallocated: summary.allocatableGpus - summary.gpusInUse,
      utilization: percentUsed(summary.gpusInUse, summary.allocatableGpus),
      healthy: summary.healthyNodes,
      warning: unhealthyNodes,
    };
  }, [summary]);

  const memoryUtilization = useMemo(() => {
    if (!summary) {
      return { allocated: 0, unallocated: 0, utilization: 0, healthy: 0, warning: 0 };
    }
    return {
      allocated: summary.memoryInUseGi,
      unallocated: summary.memoryAllocatableGi - summary.memoryInUseGi,
      utilization: memoryUtilizationScore,
      healthy: summary.healthyNodes,
      warning: summary.totalNodes - summary.healthyNodes,
    };
  }, [summary, memoryUtilizationScore]);

  // Generate heatmap data from node GPU usage
  const gpuMemoryDevices = useMemo(() => {
    if (nodes.length === 0) {
      // Return empty array if no nodes
      return [];
    }
    // Generate utilization percentages for each GPU across nodes
    return nodes.flatMap(node => {
      const utilization = node.gpuAllocatable > 0
        ? Math.round((node.gpuInUse / node.gpuAllocatable) * 100)
        : 0;
      // Return one value per GPU on this node
      return Array(node.gpuCount).fill(utilization);
    }).slice(0, 30); // Limit to 30 for display
  }, [nodes]);

  // Top 5 most used resource pools (ClusterQueues)
  const topPools = useMemo(() => {
    return [...clusterQueues]
      .sort((a, b) => b.gpuUtilization - a.gpuUtilization)
      .slice(0, 5)
      .map(q => ({ name: q.name, utilized: q.gpuUtilization }));
  }, [clusterQueues]);

  const bottomPools = useMemo(() => {
    return [...clusterQueues]
      .sort((a, b) => a.gpuUtilization - b.gpuUtilization)
      .slice(0, 5)
      .map(q => ({ name: q.name, utilized: q.gpuUtilization }));
  }, [clusterQueues]);

  const topCpuPools = useMemo(() => {
    return [...clusterQueues]
      .filter((q) => q.nominalCpu > 0)
      .sort((a, b) => b.cpuUtilization - a.cpuUtilization)
      .slice(0, 5)
      .map(q => ({ name: q.name, utilized: q.cpuUtilization }));
  }, [clusterQueues]);

  // GPU usage by vendor/type
  const gpuByType = useMemo(() => {
    return gpuTypes.map(gt => {
      // Determine vendor from GPU type name
      const lowerType = gt.type.toLowerCase();
      const vendor: 'nvidia' | 'amd' = lowerType.includes('mi') || lowerType.includes('radeon') ? 'amd' : 'nvidia';

      // Calculate utilization from nodes with this GPU type
      const nodesWithType = nodes.filter(n => n.gpuType === gt.type);
      const totalGpus = nodesWithType.reduce((sum, n) => sum + n.gpuAllocatable, 0);
      const usedGpus = nodesWithType.reduce((sum, n) => sum + n.gpuInUse, 0);
      const utilized = totalGpus > 0 ? Math.round((usedGpus / totalGpus) * 100) : 0;

      return { type: gt.type, vendor, utilized };
    }).slice(0, 5); // Top 5 GPU types
  }, [gpuTypes, nodes]);

  const isLoading = quotasLoading || nodesLoading;
  const error = quotasError || nodesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading resource pool data...</span>
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

  // Show empty state if no data
  if (clusterQueues.length === 0 && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p>No resource pools or GPU nodes found in the cluster.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div className="grid grid-cols-3 gap-6">
        <Card title="GPU Efficiency Score" className="min-h-[220px]">
          <GaugeChart value={gpuEfficiencyScore} />
        </Card>
        <Card title="GPU Utilization" className="min-h-[220px]">
          <DonutChart {...gpuUtilization} />
        </Card>
        <Card title="GPU Allocation by Device" className="min-h-[220px]">
          {gpuMemoryDevices.length > 0 ? (
            <HeatmapGrid values={gpuMemoryDevices} />
          ) : (
            <div className="text-text-muted text-sm">No GPU data available</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="CPU Utilization" className="min-h-[220px]">
          <GaugeChart value={cpuUtilizationScore} />
        </Card>
        <Card title="Memory Utilization" className="min-h-[220px]">
          <DonutChart {...memoryUtilization} />
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Top 5 Most Used Resource Pools">
          {topPools.length > 0 ? (
            <HorizontalBarChart data={topPools} />
          ) : (
            <div className="text-text-muted text-sm">No resource pools</div>
          )}
        </Card>
        <Card title="Top 5 Least Used Resource Pools">
          {bottomPools.length > 0 ? (
            <HorizontalBarChart data={bottomPools} />
          ) : (
            <div className="text-text-muted text-sm">No resource pools</div>
          )}
        </Card>
        <Card title="Top 5 CPU Pools">
          {topCpuPools.length > 0 ? (
            <HorizontalBarChart data={topCpuPools} />
          ) : (
            <div className="text-text-muted text-sm">No CPU quotas configured</div>
          )}
        </Card>
      </div>

      {gpuByType.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <Card title="GPU Usage by Vendor & Type">
            <GpuVendorChart data={gpuByType} />
          </Card>
        </div>
      )}
    </div>
  );
}
