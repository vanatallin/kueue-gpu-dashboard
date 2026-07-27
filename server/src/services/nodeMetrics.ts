import { K8S_API, KubeClient, KubeList } from './kube.js';
import { parseCpu, parseMemory, percentUsed } from '../utils/resources.js';

interface NodeMetricsItem {
  metadata: { name: string };
  usage: {
    cpu?: string;
    memory?: string;
  };
}

let metricsServerUnavailableLogged = false;

export async function fetchMetricsServerUtilization(
  client: KubeClient,
  nodeNames: string[],
  cpuCapacity: number,
  memoryCapacityGi: number
): Promise<{ compute: number; memory: number } | null> {
  if (nodeNames.length === 0 || (cpuCapacity <= 0 && memoryCapacityGi <= 0)) return null;

  try {
    const data = await client.get<KubeList<NodeMetricsItem>>(K8S_API.nodeMetrics);
    const nodeSet = new Set(nodeNames);

    let totalCpuUsage = 0;
    let totalMemoryUsageGi = 0;
    let matchedNodes = 0;

    for (const item of data.items) {
      if (!nodeSet.has(item.metadata.name)) continue;
      matchedNodes++;
      totalCpuUsage += parseCpu(item.usage.cpu);
      totalMemoryUsageGi += parseMemory(item.usage.memory);
    }

    if (matchedNodes === 0) return null;

    return {
      compute: percentUsed(totalCpuUsage, cpuCapacity),
      memory: percentUsed(totalMemoryUsageGi, memoryCapacityGi),
    };
  } catch (err) {
    if (!metricsServerUnavailableLogged) {
      console.warn('Metrics-server unavailable, using request/capacity utilization:', err instanceof Error ? err.message : err);
      metricsServerUnavailableLogged = true;
    }
    return null;
  }
}
