const API_BASE = import.meta.env.VITE_API_URL || '';

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
    gpuType: string;
    healthy: boolean;
  }>;
  summary: {
    totalGpus: number;
    allocatableGpus: number;
    gpusInUse: number;
    totalNodes: number;
    healthyNodes: number;
  };
  gpuTypes: Array<{
    type: string;
    count: number;
  }>;
}

interface MetricsResponse {
  totalGpus: number;
  usedGpus: number;
  compute: number;
  memory: number;
}

interface ClusterQueueInfo {
  id: string;
  name: string;
  type: 'clusterQueue';
  cohort?: string;
  nominalGpus: number;
  usedGpus: number;
  borrowedGpus: number;
  lentGpus: number;
  borrowingLimit: number;
  lendingLimit: number;
  priority: number;
  admittedWorkloads: number;
  pendingWorkloads: number;
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
  LocalQueueInfo,
  ClusterQueuesResponse,
  LocalQueuesResponse,
};
