import { GaugeChart } from '../components/charts/GaugeChart';
import { DonutChart } from '../components/charts/DonutChart';
import { HeatmapGrid } from '../components/charts/HeatmapGrid';
import { HorizontalBarChart } from '../components/charts/HorizontalBarChart';
import { GpuVendorChart } from '../components/charts/GpuVendorChart';
import {
  gpuEfficiencyScore,
  gpuUtilization,
  gpuMemoryDevices,
  topPools,
  bottomPools,
  gpuByType,
} from '../data/resourcePools';

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-[12px] border border-border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex flex-col ${className}`}>
      <h3 className="text-[11px] uppercase tracking-wide text-text-muted mb-3">{title}</h3>
      <div className="flex-1 flex items-center">{children}</div>
    </div>
  );
}

export function ResourcePools() {
  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div className="grid grid-cols-3 gap-6">
        <Card title="GPU Efficiency Score" className="min-h-[220px]">
          <GaugeChart value={gpuEfficiencyScore} />
        </Card>
        <Card title="GPU Utilization" className="min-h-[220px]">
          <DonutChart {...gpuUtilization} />
        </Card>
        <Card title="GPU Memory Utilization" className="min-h-[220px]">
          <HeatmapGrid values={gpuMemoryDevices} />
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Top 5 Most Used Resource Pools">
          <HorizontalBarChart data={topPools} />
        </Card>
        <Card title="Top 5 Least Used Resource Pools">
          <HorizontalBarChart data={bottomPools} />
        </Card>
        <Card title="GPU Usage by Vendor & Type">
          <GpuVendorChart data={gpuByType} />
        </Card>
      </div>
    </div>
  );
}
