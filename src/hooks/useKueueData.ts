import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useRefresh } from '../context/RefreshContext';
import { api } from '../services/api';
import type { ClusterQueueInfo, LocalQueueInfo } from '../services/api';
import type { Workload, QuotaNode } from '../types/kueue';

interface WorkloadsData {
  workloads: Workload[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

interface QuotasData {
  quotas: QuotaNode[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

interface NodeInfo {
  nodeId: string;
  nodeName: string;
  gpuCount: number;
  gpuAllocatable: number;
  gpuInUse: number;
  gpuType: string;
  healthy: boolean;
}

interface NodesData {
  nodes: NodeInfo[];
  summary: {
    totalGpus: number;
    allocatableGpus: number;
    gpusInUse: number;
    totalNodes: number;
    healthyNodes: number;
  } | null;
  gpuTypes: Array<{ type: string; count: number }>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

interface MetricsData {
  totalGpus: number;
  usedGpus: number;
  compute: number;
  memory: number;
  isLoading: boolean;
  error: string | null;
}

export function useWorkloads(): WorkloadsData {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { refreshTrigger, setLastUpdated: setGlobalLastUpdated, setIsRefreshing } = useRefresh();
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const hasLoadedOnce = useRef(false);

  const fetchWorkloads = useCallback(async () => {
    if (!isAuthenticated) return;

    // Only show loading spinner on initial load
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await api.getWorkloads();
      if (isMounted.current) {
        setWorkloads(data.workloads as Workload[]);
        const now = new Date();
        setLastUpdated(now);
        setGlobalLastUpdated(now);
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workloads');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, setGlobalLastUpdated, setIsRefreshing]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchWorkloads();
    return () => {
      isMounted.current = false;
    };
  }, [fetchWorkloads]);

  // Manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchWorkloads();
    }
  }, [refreshTrigger, fetchWorkloads]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !settings.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchWorkloads();
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.autoRefreshEnabled, settings.autoRefreshInterval, fetchWorkloads]);

  return { workloads, isLoading, error, refetch: fetchWorkloads, lastUpdated };
}

export function useQuotas(): QuotasData {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { refreshTrigger, setLastUpdated: setGlobalLastUpdated, setIsRefreshing } = useRefresh();
  const [quotas, setQuotas] = useState<QuotaNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const hasLoadedOnce = useRef(false);

  const fetchQuotas = useCallback(async () => {
    if (!isAuthenticated) return;

    // Only show loading spinner on initial load
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await api.getQuotas();
      if (isMounted.current) {
        setQuotas(data.quotas);
        const now = new Date();
        setLastUpdated(now);
        setGlobalLastUpdated(now);
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quotas');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, setGlobalLastUpdated, setIsRefreshing]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchQuotas();
    return () => {
      isMounted.current = false;
    };
  }, [fetchQuotas]);

  // Manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchQuotas();
    }
  }, [refreshTrigger, fetchQuotas]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !settings.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchQuotas();
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.autoRefreshEnabled, settings.autoRefreshInterval, fetchQuotas]);

  return { quotas, isLoading, error, refetch: fetchQuotas, lastUpdated };
}

export function useNodes(): NodesData {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { refreshTrigger, setLastUpdated: setGlobalLastUpdated, setIsRefreshing } = useRefresh();
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [summary, setSummary] = useState<NodesData['summary']>(null);
  const [gpuTypes, setGpuTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const hasLoadedOnce = useRef(false);

  const fetchNodes = useCallback(async () => {
    if (!isAuthenticated) return;

    // Only show loading spinner on initial load
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await api.getNodes();
      if (isMounted.current) {
        setNodes(data.nodes);
        setSummary(data.summary);
        setGpuTypes(data.gpuTypes);
        const now = new Date();
        setLastUpdated(now);
        setGlobalLastUpdated(now);
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, setGlobalLastUpdated, setIsRefreshing]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchNodes();
    return () => {
      isMounted.current = false;
    };
  }, [fetchNodes]);

  // Manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchNodes();
    }
  }, [refreshTrigger, fetchNodes]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !settings.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchNodes();
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.autoRefreshEnabled, settings.autoRefreshInterval, fetchNodes]);

  return { nodes, summary, gpuTypes, isLoading, error, refetch: fetchNodes, lastUpdated };
}

export function useMetrics(): MetricsData {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { refreshTrigger, setLastUpdated: setGlobalLastUpdated, setIsRefreshing } = useRefresh();
  const [metrics, setMetrics] = useState({ totalGpus: 0, usedGpus: 0, compute: 0, memory: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const hasLoadedOnce = useRef(false);

  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) return;

    // Only show loading spinner on initial load
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await api.getMetrics();
      if (isMounted.current) {
        setMetrics(data);
        setGlobalLastUpdated(new Date());
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, setGlobalLastUpdated, setIsRefreshing]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchMetrics();
    return () => {
      isMounted.current = false;
    };
  }, [fetchMetrics]);

  // Manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchMetrics();
    }
  }, [refreshTrigger, fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !settings.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.autoRefreshEnabled, settings.autoRefreshInterval, fetchMetrics]);

  return { ...metrics, isLoading, error };
}

interface ClusterQueuesData {
  clusterQueues: ClusterQueueInfo[];
  localQueues: LocalQueueInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useClusterQueues(): ClusterQueuesData {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { refreshTrigger, setLastUpdated: setGlobalLastUpdated, setIsRefreshing } = useRefresh();
  const [clusterQueues, setClusterQueues] = useState<ClusterQueueInfo[]>([]);
  const [localQueues, setLocalQueues] = useState<LocalQueueInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const hasLoadedOnce = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    // Only show loading spinner on initial load
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setError(null);

    try {
      const [cqData, lqData] = await Promise.all([
        api.getClusterQueues(),
        api.getLocalQueues(),
      ]);
      if (isMounted.current) {
        setClusterQueues(cqData.clusterQueues);
        setLocalQueues(lqData.localQueues);
        const now = new Date();
        setLastUpdated(now);
        setGlobalLastUpdated(now);
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cluster queues');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, setGlobalLastUpdated, setIsRefreshing]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // Manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !settings.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchData();
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.autoRefreshEnabled, settings.autoRefreshInterval, fetchData]);

  return { clusterQueues, localQueues, isLoading, error, refetch: fetchData, lastUpdated };
}
