import { useDemo } from '../context/DemoContext';
import { WorkloadTable } from '../components/workloads/WorkloadTable';
import { EventLog } from '../components/workloads/EventLog';

export function Workloads() {
  const { state } = useDemo();

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <WorkloadTable workloads={state.workloads} />
      <EventLog events={state.events} />
    </div>
  );
}
