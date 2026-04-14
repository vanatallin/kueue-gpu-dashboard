import { Router, Request, Response } from 'express';
import { requireAuth, getToken } from '../middleware/auth.js';
import { createKubeClient, K8S_API, K8sNode, KubeList, KubeClient } from '../services/kube.js';

const router = Router();

interface GpuInfo {
  nodeId: string;
  nodeName: string;
  gpuCount: number;
  gpuAllocatable: number;
  gpuInUse: number;
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

// Calculate GPU usage per node from running pods
async function getGpuUsageByNode(client: KubeClient): Promise<Map<string, number>> {
  const usage = new Map<string, number>();

  try {
    const pods = await client.get<KubeList<K8sPod>>('/api/v1/pods?fieldSelector=status.phase=Running');

    for (const pod of pods.items) {
      if (!pod.spec.nodeName) continue;

      let podGpus = 0;
      for (const container of pod.spec.containers) {
        const gpuRequest = container.resources?.requests?.['nvidia.com/gpu'] ||
                          container.resources?.limits?.['nvidia.com/gpu'] || '0';
        podGpus += parseInt(gpuRequest, 10) || 0;
      }

      if (podGpus > 0) {
        const current = usage.get(pod.spec.nodeName) || 0;
        usage.set(pod.spec.nodeName, current + podGpus);
      }
    }
  } catch (err) {
    console.error('Error fetching pod GPU usage:', err);
  }

  return usage;
}

function extractGpuInfo(node: K8sNode, gpuUsageByNode: Map<string, number>): GpuInfo | null {
  const capacity = node.status.capacity || {};
  const allocatable = node.status.allocatable || {};

  const gpuCount = parseInt(capacity['nvidia.com/gpu'] || '0', 10);
  if (gpuCount === 0) {
    return null;
  }

  const gpuAllocatable = parseInt(allocatable['nvidia.com/gpu'] || '0', 10);
  const gpuInUse = gpuUsageByNode.get(node.metadata.name) || 0;

  // Try to determine GPU type from labels
  const labels = node.metadata.labels || {};
  const gpuType =
    labels['nvidia.com/gpu.product'] ||
    labels['nvidia.com/gpu-product'] ||
    labels['gpu-type'] ||
    'Unknown GPU';

  // Check if node is healthy
  const conditions = node.status.conditions || [];
  const readyCondition = conditions.find((c) => c.type === 'Ready');
  const healthy = readyCondition?.status === 'True';

  return {
    nodeId: node.metadata.uid,
    nodeName: node.metadata.name,
    gpuCount,
    gpuAllocatable,
    gpuInUse,
    gpuType,
    healthy,
  };
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

    // Fetch nodes and GPU usage in parallel
    const [nodeData, gpuUsageByNode] = await Promise.all([
      client.get<KubeList<K8sNode>>(K8S_API.nodes),
      getGpuUsageByNode(client),
    ]);

    const gpuNodes = nodeData.items
      .map((node) => extractGpuInfo(node, gpuUsageByNode))
      .filter((n): n is GpuInfo => n !== null);

    // Aggregate metrics
    const totalGpus = gpuNodes.reduce((sum, n) => sum + n.gpuCount, 0);
    const allocatableGpus = gpuNodes.reduce((sum, n) => sum + n.gpuAllocatable, 0);
    const gpusInUse = gpuNodes.reduce((sum, n) => sum + n.gpuInUse, 0);
    const healthyNodes = gpuNodes.filter((n) => n.healthy).length;

    // Group by GPU type
    const gpuByType = new Map<string, { type: string; count: number }>();
    for (const node of gpuNodes) {
      const existing = gpuByType.get(node.gpuType) || { type: node.gpuType, count: 0 };
      existing.count += node.gpuCount;
      gpuByType.set(node.gpuType, existing);
    }

    res.json({
      nodes: gpuNodes,
      summary: {
        totalGpus,
        allocatableGpus,
        gpusInUse,
        totalNodes: gpuNodes.length,
        healthyNodes,
      },
      gpuTypes: Array.from(gpuByType.values()),
    });
  } catch (err) {
    console.error('Error fetching nodes:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch nodes';
    res.status(500).json({ error: message });
  }
});

// GET /api/metrics - Combined cluster metrics
router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);

    // Fetch nodes and GPU usage in parallel
    const [nodeData, gpuUsageByNode] = await Promise.all([
      client.get<KubeList<K8sNode>>(K8S_API.nodes),
      getGpuUsageByNode(client),
    ]);

    const gpuNodes = nodeData.items
      .map((node) => extractGpuInfo(node, gpuUsageByNode))
      .filter((n): n is GpuInfo => n !== null);

    const totalGpus = gpuNodes.reduce((sum, n) => sum + n.gpuCount, 0);
    const allocatableGpus = gpuNodes.reduce((sum, n) => sum + n.gpuAllocatable, 0);
    const usedGpus = gpuNodes.reduce((sum, n) => sum + n.gpuInUse, 0);

    res.json({
      totalGpus,
      allocatableGpus,
      usedGpus,
      compute: 60, // Would need metrics-server for real values
      memory: 40,
    });
  } catch (err) {
    console.error('Error fetching metrics:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch metrics';
    res.status(500).json({ error: message });
  }
});

export default router;
