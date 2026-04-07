import { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { MetricCard } from '../components/cards/MetricCard';
import { RecommendationCard } from '../components/cards/RecommendationCard';
import { ActionBar } from '../components/actions/ActionBar';
import { WorkloadTable } from '../components/workloads/WorkloadTable';
import { TopologyView } from '../components/topology/TopologyView';
import { CreatePoolModal } from '../components/wizard/CreatePoolModal';

export function ClusterControl() {
  const { state } = useDemo();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { metrics, recommendations, workloads } = state;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          label="Total GPUs"
          value={metrics.totalGpus}
          sub={`Used: ${metrics.usedGpus}  ·  Free: ${metrics.totalGpus - metrics.usedGpus}`}
          barValue={metrics.usedGpus}
          barMax={metrics.totalGpus}
          barColor="var(--color-primary)"
        />
        <MetricCard
          label="Compute"
          value={`${metrics.compute}%`}
          barValue={metrics.compute}
          barColor="var(--color-compute)"
        />
        <MetricCard
          label="Memory"
          value={`${metrics.memory}%`}
          barValue={metrics.memory}
          barColor="var(--color-memory)"
        />
      </div>

      <RecommendationCard recommendations={recommendations} />

      <ActionBar onCreatePool={() => setWizardOpen(true)} />

      <TopologyView />

      <WorkloadTable workloads={workloads} compact />

      <CreatePoolModal open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
