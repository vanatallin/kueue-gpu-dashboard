import { Router, Request, Response } from 'express';
import { requireAuth, getToken } from '../middleware/auth.js';
import {
  createKubeClient,
  KUEUE_API,
  KueueClusterQueue,
  KueueLocalQueue,
  KueueResourceFlavor,
  KubeList,
} from '../services/kube.js';
import { parseQuantity, parseCpu, parseMemory } from '../utils/resources.js';

const router = Router();

function parseResourceQuota(name: string, q: string | undefined): number {
  if (name === 'cpu') return parseCpu(q);
  if (name === 'memory') return parseMemory(q);
  return parseQuantity(q);
}

// Transform ClusterQueue to frontend quota node format
function transformClusterQueue(cq: KueueClusterQueue, resourceFlavors: Map<string, KueueResourceFlavor>) {
  let nominalGpus = 0;
  let usedGpus = 0;
  let borrowedGpus = 0;
  let borrowingLimit = 0;
  let lendingLimit = 0;
  let nominalCpu = 0;
  let usedCpu = 0;
  let nominalMemory = 0;
  let usedMemory = 0;

  // Extract flavor information
  const flavors: Array<{
    name: string;
    nodeLabels: Record<string, string> | null;
    nodeTaints: Array<{ key: string; value?: string; effect: string }> | null;
    resources: Array<{
      name: string;
      nominalQuota: number;
      nominalQuotaRaw: string;
      borrowingLimit: number;
      borrowingLimitRaw: string;
      lendingLimit: number;
      lendingLimitRaw: string;
    }>;
  }> = [];

  // Sum up GPU quotas from all flavors
  for (const rg of cq.spec.resourceGroups || []) {
    for (const flavor of rg.flavors || []) {
      const flavorResources: typeof flavors[0]['resources'] = [];
      for (const resource of flavor.resources || []) {
        const nominal = parseResourceQuota(resource.name, resource.nominalQuota);
        const bLimit = parseResourceQuota(resource.name, resource.borrowingLimit);
        const lLimit = parseResourceQuota(resource.name, resource.lendingLimit);

        flavorResources.push({
          name: resource.name,
          nominalQuota: nominal,
          nominalQuotaRaw: resource.nominalQuota || '0',
          borrowingLimit: bLimit,
          borrowingLimitRaw: resource.borrowingLimit || '0',
          lendingLimit: lLimit,
          lendingLimitRaw: resource.lendingLimit || '0',
        });

        if (resource.name === 'nvidia.com/gpu') {
          nominalGpus += nominal;
          borrowingLimit += bLimit;
          lendingLimit += lLimit;
        } else if (resource.name === 'cpu') {
          nominalCpu += nominal;
        } else if (resource.name === 'memory') {
          nominalMemory += nominal;
        }
      }

      // Get the ResourceFlavor spec
      const resourceFlavor = resourceFlavors.get(flavor.name);
      flavors.push({
        name: flavor.name,
        nodeLabels: resourceFlavor?.spec?.nodeLabels || null,
        nodeTaints: resourceFlavor?.spec?.nodeTaints || null,
        resources: flavorResources,
      });
    }
  }

  // Get used GPUs and borrowed GPUs from status
  for (const fr of cq.status?.flavorsReservation || []) {
    for (const resource of fr.resources || []) {
      if (resource.name === 'nvidia.com/gpu') {
        usedGpus += parseQuantity(resource.total);
        borrowedGpus += parseQuantity(resource.borrowed);
      } else if (resource.name === 'cpu') {
        usedCpu += parseCpu(resource.total);
      } else if (resource.name === 'memory') {
        usedMemory += parseMemory(resource.total);
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
    nominalCpu,
    usedCpu,
    nominalMemory,
    usedMemory,
    borrowedGpus,
    borrowingLimit,
    lendingLimit,
    priority: 0,
    admittedWorkloads: cq.status?.admittedWorkloads || 0,
    pendingWorkloads: cq.status?.pendingWorkloads || 0,
    // Configuration
    config: {
      queueingStrategy: cq.spec.queueingStrategy || 'BestEffortFIFO',
      flavors,
      flavorFungibility: cq.spec.flavorFungibility || null,
      preemption: cq.spec.preemption || null,
    },
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

    // Fetch both ClusterQueues and ResourceFlavors
    const [cqData, rfData] = await Promise.all([
      client.get<KubeList<KueueClusterQueue>>(KUEUE_API.clusterQueues),
      client.get<KubeList<KueueResourceFlavor>>(KUEUE_API.resourceFlavors),
    ]);

    // Create a map of ResourceFlavors by name
    const resourceFlavors = new Map<string, KueueResourceFlavor>();
    for (const rf of rfData.items) {
      resourceFlavors.set(rf.metadata.name, rf);
    }

    const queues = cqData.items.map((cq) => transformClusterQueue(cq, resourceFlavors));
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

    const [cqData, lqData, rfData] = await Promise.all([
      client.get<KubeList<KueueClusterQueue>>(KUEUE_API.clusterQueues),
      client.get<KubeList<KueueLocalQueue>>(KUEUE_API.localQueues),
      client.get<KubeList<KueueResourceFlavor>>(KUEUE_API.resourceFlavors),
    ]);

    // Create a map of ResourceFlavors by name
    const resourceFlavors = new Map<string, KueueResourceFlavor>();
    for (const rf of rfData.items) {
      resourceFlavors.set(rf.metadata.name, rf);
    }

    const clusterQueues = cqData.items.map((cq) => transformClusterQueue(cq, resourceFlavors));
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
      nominalCpu: queues.reduce((sum, q) => sum + q.nominalCpu, 0),
      usedCpu: queues.reduce((sum, q) => sum + q.usedCpu, 0),
      nominalMemory: queues.reduce((sum, q) => sum + q.nominalMemory, 0),
      usedMemory: queues.reduce((sum, q) => sum + q.usedMemory, 0),
      borrowedGpus: queues.reduce((sum, q) => sum + q.borrowedGpus, 0),
      borrowingLimit: 0,
      lendingLimit: 0,
      priority: 0,
      children: queues.map((cq) => ({
        id: cq.id,
        name: cq.name,
        type: 'clusterQueue' as const,
        nominalGpus: cq.nominalGpus,
        usedGpus: cq.usedGpus,
        nominalCpu: cq.nominalCpu,
        usedCpu: cq.usedCpu,
        nominalMemory: cq.nominalMemory,
        usedMemory: cq.usedMemory,
        borrowedGpus: cq.borrowedGpus,
        borrowingLimit: cq.borrowingLimit,
        lendingLimit: cq.lendingLimit,
        priority: cq.priority,
        children: localQueues
          .filter((lq) => lq.clusterQueue === cq.name)
          .map((lq) => ({
            id: lq.id,
            name: `${lq.namespace}/${lq.name}`,
            type: 'localQueue' as const,
            nominalGpus: 0,
            usedGpus: 0,
            nominalCpu: 0,
            usedCpu: 0,
            nominalMemory: 0,
            usedMemory: 0,
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
