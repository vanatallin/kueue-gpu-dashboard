import { Router, Request, Response } from 'express';
import { requireAuth, getToken } from '../middleware/auth.js';
import { createKubeClient, KUEUE_API, KueueWorkload, KubeList } from '../services/kube.js';
import { parseCpu, parseMemory } from '../utils/resources.js';

const router = Router();

// Extract workload type from owner references or name
function getWorkloadType(w: KueueWorkload): string {
  // Check owner references first (most reliable)
  const ownerRef = w.metadata.ownerReferences?.[0];
  if (ownerRef?.kind) {
    return ownerRef.kind;
  }

  // Fallback: try to infer from name patterns
  const name = w.metadata.name.toLowerCase();
  if (name.includes('pytorchjob') || name.includes('pytorch')) return 'PyTorchJob';
  if (name.includes('rayjob') || name.includes('ray')) return 'RayJob';
  if (name.includes('mpijob') || name.includes('mpi')) return 'MPIJob';
  if (name.includes('tfjob') || name.includes('tensorflow')) return 'TFJob';
  if (name.includes('xgboostjob')) return 'XGBoostJob';
  if (name.includes('paddlejob')) return 'PaddleJob';

  return 'Job'; // Default to Job
}

// Transform Kueue workload to frontend format
function transformWorkload(w: KueueWorkload) {
  const conditions = w.status?.conditions || [];
  const admittedCondition = conditions.find((c) => c.type === 'Admitted');
  const finishedCondition = conditions.find((c) => c.type === 'Finished');

  let status: 'running' | 'pending' | 'preempted' | 'completed' = 'pending';
  if (finishedCondition?.status === 'True') {
    status = 'completed';
  } else if (admittedCondition?.status === 'True') {
    status = 'running';
  } else if (conditions.some((c) => c.reason === 'Preempted')) {
    status = 'preempted';
  }

  // Calculate resource requests
  let gpusRequested = 0;
  let cpuRequested = 0;
  let memoryRequested = 0;
  for (const podSet of w.spec.podSets || []) {
    const count = podSet.count || 1;
    for (const container of podSet.template?.spec?.containers || []) {
      const requests = container.resources?.requests || {};
      const gpuRequest = requests['nvidia.com/gpu'] || '0';
      gpusRequested += count * parseInt(gpuRequest, 10);
      cpuRequested += count * parseCpu(requests.cpu);
      memoryRequested += count * parseMemory(requests.memory);
    }
  }

  return {
    id: w.metadata.uid,
    name: w.metadata.name,
    namespace: w.metadata.namespace,
    team: w.metadata.namespace, // Use namespace as team
    type: getWorkloadType(w),
    priority: w.spec.priority && w.spec.priority > 0 ? 'high' : 'low',
    gpusRequested,
    cpuRequested,
    memoryRequested,
    status,
    pool: w.status?.admission?.clusterQueue || w.spec.queueName || 'unknown',
    progress: status === 'completed' ? 100 : status === 'running' ? 50 : 0,
    submittedAt: w.metadata.creationTimestamp,
  };
}

// GET /api/workloads
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const client = createKubeClient(token);
    const data = await client.get<KubeList<KueueWorkload>>(KUEUE_API.workloads);

    const workloads = data.items.map(transformWorkload);
    res.json({ workloads });
  } catch (err) {
    console.error('Error fetching workloads:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch workloads';
    res.status(500).json({ error: message });
  }
});

export default router;
