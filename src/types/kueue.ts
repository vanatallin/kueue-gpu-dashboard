export type WorkloadStatus = 'running' | 'pending' | 'preempted' | 'completed' | 'resuming';

export type Priority = 'low' | 'high';

export type SliceType = 'compute' | 'memory' | 'mixed';

export type DemoStep = 1 | 2 | 3 | 4;

export type EventType = 'submit' | 'start' | 'preempt' | 'complete' | 'resume';

export type Severity = 'info' | 'warning' | 'critical';

export interface GpuSlice {
  id: string;
  type: SliceType;
  utilization: number;
  workloadId?: string;
}

export interface Workload {
  id: string;
  name: string;
  team: string;
  priority: Priority;
  gpusRequested: number;
  status: WorkloadStatus;
  pool: string;
  progress: number;
  submittedAt: string;
}

export interface GpuPool {
  name: string;
  gpuCount: number;
  usedGpus: number;
  workloads: Workload[];
  slices: GpuSlice[];
}

export interface DemoEvent {
  timestamp: string;
  type: EventType;
  message: string;
  workloadId: string;
  team: string;
}

export interface Recommendation {
  id: string;
  severity: Severity;
  message: string;
  action: string;
}

export interface ClusterMetrics {
  totalGpus: number;
  usedGpus: number;
  compute: number;
  memory: number;
}

export interface DemoState {
  step: DemoStep;
  pools: GpuPool[];
  workloads: Workload[];
  events: DemoEvent[];
  recommendations: Recommendation[];
  metrics: ClusterMetrics;
}

export type QuotaNodeType = 'cohort' | 'clusterQueue' | 'localQueue';

export interface QuotaNode {
  id: string;
  name: string;
  type: QuotaNodeType;
  nominalGpus: number;
  usedGpus: number;
  borrowingLimit: number;
  lendingLimit: number;
  priority: number;
  children: QuotaNode[];
}
