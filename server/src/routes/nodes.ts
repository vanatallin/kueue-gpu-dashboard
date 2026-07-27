import { Router, Request, Response } from 'express';
import { requireAuth, getToken } from '../middleware/auth.js';
import { createKubeClient, K8S_API, K8sNode, KubeList, KubeClient } from '../services/kube.js';
import { parseCpu, parseMemory, percentUsed } from '../utils/resources.js';
import { fetchMetricsServerUtilization } from '../services/nodeMetrics.js';

const router = Router();

interface NodeResourceUsage {
  gpu: number;
  cpu: number;
  memoryGi: number;
}

interface NodeInfo {
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
}

interface K8sPod {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    nodeName?: string;
    containers: Array<{
      resources?: {
        requests?: Record<string, string>;
        limits?: Record<string, string>;
      };
    }>;
  };
  status: {
    phase: string;
  };
}

async function getResourceUsageByNode(client: KubeClient): Promise<Map<string, NodeResourceUsage>> {
  const usage = new Map<string, NodeResourceUsage>();

  try {
    const pods = await client.get<KubeList<K8sPod>>('/api/v1/pods?fieldSelector=status.phase=Running');

    for (const pod of pods.items) {
      if (!pod.spec.nodeName) continue;

      let podGpus = 0;
      let podCpu = 0;
      let podMemoryGi = 0;

      for (const container of pod.spec.containers) {
        const requests = container.resources?.requests || {};
        const limits = container.resources?.limits || {};

        const gpuRequest = requests['nvidia.com/gpu'] || limits['nvidia.com/gpu'] || '0';
        podGpus += parseInt(gpuRequest, 10) || 0;

        const cpuRequest = requests.cpu || limits.cpu || '0';
        podCpu += parseCpu(cpuRequest);

        const memoryRequest = requests.memory || limits.memory || '0';
        podMemoryGi += parseMemory(memoryRequest);
      }

      const current = usage.get(pod.spec.nodeName) || { gpu: 0, cpu: 0, memoryGi: 0 };
      current.gpu += podGpus;
      current.cpu += podCpu;
      current.memoryGi += podMemoryGi;
      usage.set(pod.spec.nodeName, current);
    }
  } catch (err) {
    console.error('Error fetching pod resource usage:', err);
  }

  return usage;
}

function extractNodeInfo(node: K8sNode, usageByNode: Map<string, NodeResourceUsage>): NodeInfo | null {
  const capacity = node.status.capacity || {};
  const allocatable = node.status.allocatable || {};

  const gpuCount = parseInt(capacity['nvidia.com/gpu'] || '0', 10);
  if (gpuCount === 0) {
    return null;
  }

  const usage = usageByNode.get(node.metadata.name) || { gpu: 0, cpu: 0, memoryGi: 0 };

  const labels = node.metadata.labels || {};
  const gpuType =
    labels['nvidia.com/gpu.product'] ||
    labels['nvidia.com/gpu-product'] ||
    labels['gpu-type'] ||
    'Unknown GPU';

  const conditions = node.status.conditions || [];
  const readyCondition = conditions.find((c) => c.type === 'Ready');
  const healthy = readyCondition?.status === 'True';

  return {
    nodeId: node.metadata.uid,
    nodeName: node.metadata.name,
    gpuCount,
    gpuAllocatable: parseInt(allocatable['nvidia.com/gpu'] || '0', 10),
    gpuInUse: usage.gpu,
    cpuAllocatable: parseCpu(allocatable.cpu),
    cpuInUse: usage.cpu,
    memoryAllocatable: parseMemory(allocatable.memory),
    memoryInUse: usage.memoryGi,
    gpuType,
    healthy,
  };
}

function isNodeHealthy(node: K8sNode): boolean {
  const conditions = node.status.conditions || [];
  const readyCondition = conditions.find((c) => c.type === 'Ready');
  return readyCondition?.status === 'True';
}

function buildSummary(gpuNodes: NodeInfo[], allNodes: K8sNode[]) {
  const totalGpus = gpuNodes.reduce((sum, n) => sum + n.gpuCount, 0);
  const allocatableGpus = gpuNodes.reduce((sum, n) => sum + n.gpuAllocatable, 0);
  const gpusInUse = gpuNodes.reduce((sum, n) => sum + n.gpuInUse, 0);
  const cpuAllocatable = gpuNodes.reduce((sum, n) => sum + n.cpuAllocatable, 0);
  const cpuInUse = gpuNodes.reduce((sum, n) => sum + n.cpuInUse, 0);
  const memoryAllocatableGi = gpuNodes.reduce((sum, n) => sum + n.memoryAllocatable, 0);
  const memoryInUseGi = gpuNodes.reduce((sum, n) => sum + n.memoryInUse, 0);
  const gpuNodeCount = gpuNodes.length;
  const healthyGpuNodes = gpuNodes.filter((n) => n.healthy).length;

  return {
    totalGpus,
    allocatableGpus,
    gpusInUse,
    totalClusterNodes: allNodes.length,
    healthyClusterNodes: allNodes.filter(isNodeHealthy).length,
    gpuNodes: gpuNodeCount,
    healthyGpuNodes,
    // GPU-node counts kept for pages scoped to GPU nodes (Nodes table, charts)
    totalNodes: gpuNodeCount,
    healthyNodes: healthyGpuNodes,
    cpuAllocatable,
    cpuInUse,
    memoryAllocatableGi,
    memoryInUseGi,
  };
}

async function fetchGpuNodes(client: KubeClient) {
  const [nodeData, usageByNode] = await Promise.all([
    client.get<KubeList<K8sNode>>(K8S_API.nodes),
    getResourceUsageByNode(client),
  ]);

  const gpuNodes = nodeData.items
    .map((node) => extractNodeInfo(node, usageByNode))
    .filter((n): n is NodeInfo => n !== null);

  return { gpuNodes, allNodes: nodeData.items };
}

// GET /api/nodes
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);
    const { gpuNodes, allNodes } = await fetchGpuNodes(client);
    const summary = buildSummary(gpuNodes, allNodes);

    const gpuByType = new Map<string, { type: string; count: number }>();
    for (const node of gpuNodes) {
      const existing = gpuByType.get(node.gpuType) || { type: node.gpuType, count: 0 };
      existing.count += node.gpuCount;
      gpuByType.set(node.gpuType, existing);
    }

    res.json({
      nodes: gpuNodes,
      summary,
      gpuTypes: Array.from(gpuByType.values()),
    });
  } catch (err) {
    console.error('Error fetching nodes:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch nodes';
    res.status(500).json({ error: message });
  }
});

// GET /api/nodes/metrics - Combined cluster metrics
router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);
    const { gpuNodes, allNodes } = await fetchGpuNodes(client);
    const summary = buildSummary(gpuNodes, allNodes);

    let compute = percentUsed(summary.cpuInUse, summary.cpuAllocatable);
    let memory = percentUsed(summary.memoryInUseGi, summary.memoryAllocatableGi);

    const metricsServer = await fetchMetricsServerUtilization(
      client,
      gpuNodes.map((n) => n.nodeName),
      summary.cpuAllocatable,
      summary.memoryAllocatableGi
    );
    if (metricsServer) {
      compute = metricsServer.compute;
      memory = metricsServer.memory;
    }

    res.json({
      totalGpus: summary.totalGpus,
      allocatableGpus: summary.allocatableGpus,
      usedGpus: summary.gpusInUse,
      cpuAllocatable: summary.cpuAllocatable,
      cpuInUse: summary.cpuInUse,
      memoryAllocatableGi: summary.memoryAllocatableGi,
      memoryInUseGi: summary.memoryInUseGi,
      compute,
      memory,
    });
  } catch (err) {
    console.error('Error fetching metrics:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch metrics';
    res.status(500).json({ error: message });
  }
});

export default router;
