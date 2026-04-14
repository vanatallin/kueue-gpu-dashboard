import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { config } from '../config.js';

export interface KubeClient {
  get<T = unknown>(path: string): Promise<T>;
}

export function createKubeClient(token: string): KubeClient {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Accept self-signed certs (OpenShift clusters use them)
    ca: config.caCert,
  });

  const client: AxiosInstance = axios.create({
    baseURL: config.openshiftApiUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    httpsAgent,
  });

  return {
    async get<T = unknown>(path: string): Promise<T> {
      const response = await client.get<T>(path);
      return response.data;
    },
  };
}

// Kueue API paths
export const KUEUE_API = {
  workloads: '/apis/kueue.x-k8s.io/v1beta1/workloads',
  clusterQueues: '/apis/kueue.x-k8s.io/v1beta1/clusterqueues',
  localQueues: '/apis/kueue.x-k8s.io/v1beta1/localqueues',
  resourceFlavors: '/apis/kueue.x-k8s.io/v1beta1/resourceflavors',
};

export const K8S_API = {
  nodes: '/api/v1/nodes',
  namespaces: '/api/v1/namespaces',
};

// Type definitions for Kueue resources
export interface KueueWorkload {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
    ownerReferences?: Array<{
      apiVersion: string;
      kind: string;
      name: string;
      uid: string;
    }>;
  };
  spec: {
    queueName: string;
    priority?: number;
    priorityClassName?: string;
    podSets: Array<{
      name: string;
      count: number;
      template: {
        spec: {
          containers: Array<{
            resources?: {
              requests?: Record<string, string>;
            };
          }>;
        };
      };
    }>;
  };
  status?: {
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }>;
    admission?: {
      clusterQueue: string;
      podSetAssignments: Array<{
        name: string;
        flavors: Record<string, string>;
        resourceUsage: Record<string, string>;
      }>;
    };
  };
}

export interface KueueClusterQueue {
  metadata: {
    name: string;
    uid: string;
  };
  spec: {
    cohort?: string;
    resourceGroups?: Array<{
      coveredResources: string[];
      flavors: Array<{
        name: string;
        resources: Array<{
          name: string;
          nominalQuota: string;
          borrowingLimit?: string;
          lendingLimit?: string;
        }>;
      }>;
    }>;
    preemption?: {
      reclaimWithinCohort: string;
      withinClusterQueue: string;
    };
  };
  status?: {
    admittedWorkloads?: number;
    pendingWorkloads?: number;
    reservingWorkloads?: number;
    flavorsReservation?: Array<{
      name: string;
      resources: Array<{
        name: string;
        total: string;
        borrowed: string;
      }>;
    }>;
  };
}

export interface KueueLocalQueue {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
  };
  spec: {
    clusterQueue: string;
  };
  status?: {
    admittedWorkloads?: number;
    pendingWorkloads?: number;
  };
}

export interface K8sNode {
  metadata: {
    name: string;
    uid: string;
    labels: Record<string, string>;
  };
  status: {
    capacity: Record<string, string>;
    allocatable: Record<string, string>;
    conditions: Array<{
      type: string;
      status: string;
    }>;
  };
}

export interface KubeList<T> {
  items: T[];
}
