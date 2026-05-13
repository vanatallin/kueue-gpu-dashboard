import { useMemo } from 'react';
import { useSearch } from '../context/SearchContext';
import { useNodes } from '../hooks/useKueueData';
import { Loader2, AlertCircle, CheckCircle, XCircle, Cpu, HardDrive, RefreshCw } from 'lucide-react';

export function Nodes() {
  const { query } = useSearch();
  const { nodes, summary, gpuTypes, isLoading, error, refetch } = useNodes();

  // Filter nodes by search query
  const filteredNodes = useMemo(() => {
    if (!query.trim()) return nodes;
    const lowerQuery = query.toLowerCase();
    return nodes.filter(
      (n) =>
        (n.nodeName?.toLowerCase() || '').includes(lowerQuery) ||
        (n.gpuType?.toLowerCase() || '').includes(lowerQuery)
    );
  }, [nodes, query]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading nodes...</span>
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

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Cluster Nodes</h2>
          <p className="text-[13px] text-text-secondary mt-0.5">
            View GPU nodes and their specifications
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard
            label="Total Nodes"
            value={summary.totalNodes}
            subtext={`${summary.healthyNodes} healthy`}
          />
          <SummaryCard
            label="Total GPUs"
            value={summary.totalGpus}
            subtext="across all nodes"
          />
          <SummaryCard
            label="Allocatable GPUs"
            value={summary.allocatableGpus}
            subtext="available for workloads"
          />
          <SummaryCard
            label="GPU Types"
            value={gpuTypes.length}
            subtext="unique types"
          />
        </div>
      )}

      {/* GPU Types Breakdown */}
      {gpuTypes.length > 0 && (
        <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-[14px] font-medium text-text-primary mb-3">GPU Types</h3>
          <div className="flex flex-wrap gap-3">
            {gpuTypes.map((gpu) => (
              <div
                key={gpu.type}
                className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg border border-border"
              >
                <Cpu size={14} className="text-primary" />
                <span className="text-[13px] text-text-primary font-medium">{gpu.type}</span>
                <span className="text-[12px] text-text-muted">x{gpu.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nodes Table */}
      <div className="bg-surface rounded-[12px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wide px-4 py-3">
                Node Name
              </th>
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wide px-4 py-3">
                Status
              </th>
              <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wide px-4 py-3">
                GPU Type
              </th>
              <th className="text-center text-[11px] font-medium text-text-muted uppercase tracking-wide px-4 py-3">
                Total GPUs
              </th>
              <th className="text-center text-[11px] font-medium text-text-muted uppercase tracking-wide px-4 py-3">
                Allocatable
              </th>
              <th className="text-center text-[11px] font-medium text-text-muted uppercase tracking-wide px-4 py-3">
                In Use
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredNodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-text-muted text-[13px]">
                  {query ? 'No nodes match your search' : 'No GPU nodes found in the cluster'}
                </td>
              </tr>
            ) : (
              filteredNodes.map((node) => (
                <tr
                  key={node.nodeId}
                  className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-text-muted" />
                      <span className="text-[13px] text-text-primary font-medium">
                        {node.nodeName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {node.healthy ? (
                      <div className="flex items-center gap-1.5 text-status-running">
                        <CheckCircle size={14} />
                        <span className="text-[12px] font-medium">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-critical">
                        <XCircle size={14} />
                        <span className="text-[12px] font-medium">Not Ready</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-text-secondary">{node.gpuType}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[13px] text-text-primary font-medium">
                      {node.gpuCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[13px] text-text-primary font-medium">
                      {node.gpuAllocatable}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[13px] text-text-secondary">
                      {node.gpuInUse || 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subtext }: { label: string; value: number; subtext: string }) {
  return (
    <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <p className="text-[11px] text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-[12px] text-text-secondary mt-1">{subtext}</p>
    </div>
  );
}
