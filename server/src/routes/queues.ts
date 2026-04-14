import { Router, Request, Response } from 'express';
import { requireAuth, getToken } from '../middleware/auth.js';
import {
  createKubeClient,
  KUEUE_API,
  KueueClusterQueue,
  KueueLocalQueue,
  KubeList,
} from '../services/kube.js';

const router = Router();

// Parse resource quantity (e.g., "8" or "8000m")
function parseQuantity(q: string | undefined): number {
  if (!q) return 0;
  if (q.endsWith('m')) {
    return parseInt(q, 10) / 1000;
  }
  return parseInt(q, 10) || 0;
}

// Transform ClusterQueue to frontend quota node format
function transformClusterQueue(cq: KueueClusterQueue) {
  let nominalGpus = 0;
  let usedGpus = 0;
  let borrowedGpus = 0;
  let borrowingLimit = 0;
  let lendingLimit = 0;

  // Sum up GPU quotas from all flavors
  for (const rg of cq.spec.resourceGroups || []) {
    for (const flavor of rg.flavors || []) {
      for (const resource of flavor.resources || []) {
        if (resource.name === 'nvidia.com/gpu') {
          nominalGpus += parseQuantity(resource.nominalQuota);
          borrowingLimit += parseQuantity(resource.borrowingLimit);
          lendingLimit += parseQuantity(resource.lendingLimit);
        }
      }
    }
  }

  // Get used GPUs and borrowed GPUs from status
  for (const fr of cq.status?.flavorsReservation || []) {
    for (const resource of fr.resources || []) {
      if (resource.name === 'nvidia.com/gpu') {
        usedGpus += parseQuantity(resource.total);
        borrowedGpus += parseQuantity(resource.borrowed);
      }
    }
  }

  return {
    id: cq.metadata.uid,
    name: cq.metadata.name,
    type: 'clusterQueue' as const,
    cohort: cq.spec.cohort,
    nominalGpus,
    usedGpus,
    borrowedGpus,
    borrowingLimit,
    lendingLimit,
    priority: 0,
    admittedWorkloads: cq.status?.admittedWorkloads || 0,
    pendingWorkloads: cq.status?.pendingWorkloads || 0,
  };
}

// Transform LocalQueue to frontend format
function transformLocalQueue(lq: KueueLocalQueue) {
  return {
    id: lq.metadata.uid,
    name: lq.metadata.name,
    namespace: lq.metadata.namespace,
    type: 'localQueue' as const,
    clusterQueue: lq.spec.clusterQueue,
    admittedWorkloads: lq.status?.admittedWorkloads || 0,
    pendingWorkloads: lq.status?.pendingWorkloads || 0,
  };
}

// GET /api/clusterqueues
router.get('/clusterqueues', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);
    const data = await client.get<KubeList<KueueClusterQueue>>(KUEUE_API.clusterQueues);

    const queues = data.items.map(transformClusterQueue);
    res.json({ clusterQueues: queues });
  } catch (err) {
    console.error('Error fetching cluster queues:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch cluster queues';
    res.status(500).json({ error: message });
  }
});

// GET /api/localqueues
router.get('/localqueues', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);
    const data = await client.get<KubeList<KueueLocalQueue>>(KUEUE_API.localQueues);

    const queues = data.items.map(transformLocalQueue);
    res.json({ localQueues: queues });
  } catch (err) {
    console.error('Error fetching local queues:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch local queues';
    res.status(500).json({ error: message });
  }
});

// GET /api/quotas - Combined quota hierarchy
router.get('/quotas', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);

    const [cqData, lqData] = await Promise.all([
      client.get<KubeList<KueueClusterQueue>>(KUEUE_API.clusterQueues),
      client.get<KubeList<KueueLocalQueue>>(KUEUE_API.localQueues),
    ]);

    const clusterQueues = cqData.items.map(transformClusterQueue);
    const localQueues = lqData.items.map(transformLocalQueue);

    // Build hierarchy: cohorts -> clusterQueues -> localQueues
    const cohortMap = new Map<string, typeof clusterQueues>();

    for (const cq of clusterQueues) {
      const cohort = cq.cohort || 'default';
      if (!cohortMap.has(cohort)) {
        cohortMap.set(cohort, []);
      }
      cohortMap.get(cohort)!.push(cq);
    }

    const hierarchy = Array.from(cohortMap.entries()).map(([cohortName, queues]) => ({
      id: `cohort-${cohortName}`,
      name: cohortName,
      type: 'cohort' as const,
      nominalGpus: queues.reduce((sum, q) => sum + q.nominalGpus, 0),
      usedGpus: queues.reduce((sum, q) => sum + q.usedGpus, 0),
      borrowingLimit: 0,
      lendingLimit: 0,
      priority: 0,
      children: queues.map((cq) => ({
        ...cq,
        children: localQueues
          .filter((lq) => lq.clusterQueue === cq.name)
          .map((lq) => ({
            id: lq.id,
            name: `${lq.namespace}/${lq.name}`,
            type: 'localQueue' as const,
            nominalGpus: 0,
            usedGpus: 0,
            borrowingLimit: 0,
            lendingLimit: 0,
            priority: 0,
            children: [],
          })),
      })),
    }));

    res.json({ quotas: hierarchy });
  } catch (err) {
    console.error('Error fetching quotas:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch quotas';
    res.status(500).json({ error: message });
  }
});

export default router;
