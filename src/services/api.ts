const API_BASE = import.meta.env.VITE_API_URL || '';

// Callback for handling auth errors (401)
let onAuthErrorCallback: (() => void) | null = null;

export function setOnAuthError(callback: () => void) {
  onAuthErrorCallback = callback;
}

interface AuthStatus {
  authenticated: boolean;
  user?: {
    name: string;
    uid: string;
  };
}

interface WorkloadResponse {
  workloads: Array<{
    id: string;
    name: string;
    namespace: string;
    team: string;
    priority: 'low' | 'high';
    gpusRequested: number;
    cpuRequested: number;
    memoryRequested: number;
    status: 'running' | 'pending' | 'preempted' | 'completed';
    pool: string;
    progress: number;
    submittedAt: string;
  }>;
}

interface QuotaNode {
  id: string;
  name: string;
  type: 'cohort' | 'clusterQueue' | 'localQueue';
  nominalGpus: number;
  usedGpus: number;
  nominalCpu: number;
  usedCpu: number;
  nominalMemory: number;
  usedMemory: number;
  borrowedGpus?: number;
  borrowingLimit: number;
  lendingLimit: number;
  priority: number;
  children: QuotaNode[];
}

interface QuotasResponse {
  quotas: QuotaNode[];
}

interface NodesResponse {
  nodes: Array<{
    nodeId: string;
    nodeName: string;
    gpuCount: number;
    gpuAllocatable: number;
    gpuInUse: number;
    cpuAllocatable: number;
    cpuInUse: number;
    memoryAllocatable: number;
    memoryInUse: number;
    gpuType: string;
    healthy: boolean;
  }>;
  summary: {
    totalGpus: number;
    allocatableGpus: number;
    gpusInUse: number;
    totalClusterNodes: number;
    healthyClusterNodes: number;
    gpuNodes: number;
    healthyGpuNodes: number;
    totalNodes: number;
    healthyNodes: number;
    cpuAllocatable: number;
    cpuInUse: number;
    memoryAllocatableGi: number;
    memoryInUseGi: number;
  };
  gpuTypes: Array<{
    type: string;
    count: number;
  }>;
}

interface MetricsResponse {
  totalGpus: number;
  allocatableGpus: number;
  usedGpus: number;
  cpuAllocatable: number;
  cpuInUse: number;
  memoryAllocatableGi: number;
  memoryInUseGi: number;
  compute: number;
  memory: number;
}

interface FlavorResource {
  name: string;
  nominalQuota: number;
  nominalQuotaRaw: string;
  borrowingLimit: number;
  borrowingLimitRaw: string;
  lendingLimit: number;
  lendingLimitRaw: string;
}

interface FlavorInfo {
  name: string;
  nodeLabels: Record<string, string> | null;
  nodeTaints: Array<{ key: string; value?: string; effect: string }> | null;
  resources: FlavorResource[];
}

interface ClusterQueueConfig {
  queueingStrategy: 'BestEffortFIFO' | 'StrictFIFO';
  flavors: FlavorInfo[];
  flavorFungibility: {
    whenCanBorrow?: 'Borrow' | 'TryNextFlavor';
    whenCanPreempt?: 'Preempt' | 'TryNextFlavor';
  } | null;
  preemption: {
    reclaimWithinCohort?: 'Never' | 'LowerPriority' | 'Any';
    borrowWithinCohort?: {
      policy?: 'Never' | 'LowerPriority' | 'Any';
      maxPriorityThreshold?: number;
    };
    withinClusterQueue?: 'Never' | 'LowerPriority' | 'LowerOrNewerEqualPriority';
  } | null;
}

interface ClusterQueueInfo {
  id: string;
  name: string;
  type: 'clusterQueue';
  cohort?: string;
  nominalGpus: number;
  usedGpus: number;
  nominalCpu: number;
  usedCpu: number;
  nominalMemory: number;
  usedMemory: number;
  borrowedGpus: number;
  lentGpus: number;
  borrowingLimit: number;
  lendingLimit: number;
  priority: number;
  admittedWorkloads: number;
  pendingWorkloads: number;
  config?: ClusterQueueConfig;
}

interface LocalQueueInfo {
  id: string;
  name: string;
  namespace: string;
  type: 'localQueue';
  clusterQueue: string;
  admittedWorkloads: number;
  pendingWorkloads: number;
}

interface ClusterQueuesResponse {
  clusterQueues: ClusterQueueInfo[];
}

interface LocalQueuesResponse {
  localQueues: LocalQueueInfo[];
}

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Notify auth context about the auth failure
      if (onAuthErrorCallback) {
        onAuthErrorCallback();
      }
      throw new Error('Not authenticated');
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  getLoginUrl: () => `${API_BASE}/auth/login`,

  getLogoutUrl: () => `${API_BASE}/auth/logout`,

  async checkAuth(): Promise<AuthStatus> {
    return fetchApi<AuthStatus>('/auth/me');
  },

  async getWorkloads(): Promise<WorkloadResponse> {
    return fetchApi<WorkloadResponse>('/api/workloads');
  },

  async getQuotas(): Promise<QuotasResponse> {
    return fetchApi<QuotasResponse>('/api/quotas');
  },

  async getClusterQueues(): Promise<ClusterQueuesResponse> {
    return fetchApi<ClusterQueuesResponse>('/api/clusterqueues');
  },

  async getLocalQueues(): Promise<LocalQueuesResponse> {
    return fetchApi<LocalQueuesResponse>('/api/localqueues');
  },

  async getNodes(): Promise<NodesResponse> {
    return fetchApi<NodesResponse>('/api/nodes');
  },

  async getMetrics(): Promise<MetricsResponse> {
    return fetchApi<MetricsResponse>('/api/nodes/metrics');
  },
};

export type {
  AuthStatus,
  WorkloadResponse,
  QuotaNode,
  QuotasResponse,
  NodesResponse,
  MetricsResponse,
  ClusterQueueInfo,
  ClusterQueueConfig,
  FlavorInfo,
  FlavorResource,
  LocalQueueInfo,
  ClusterQueuesResponse,
  LocalQueuesResponse,
};
