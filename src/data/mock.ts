import type { DemoState } from '../types/kueue';

function makeSlices(workloadId: string, count: number, type: 'compute' | 'memory' | 'mixed') {
  return Array.from({ length: count }, (_, i) => ({
    id: `${workloadId}-slice-${i}`,
    type,
    utilization: 0.7 + Math.random() * 0.25,
    workloadId,
  }));
}

export const DEMO_STATES: Record<1 | 2 | 3 | 4, DemoState> = {
  1: {
    step: 1,
    pools: [
      {
        name: 'Pool A',
        gpuCount: 8,
        usedGpus: 4,
        workloads: [
          {
            id: 'wl-a',
            name: 'data-preprocessing',
            team: 'Team A',
            priority: 'low',
            gpusRequested: 4,
            status: 'running',
            pool: 'Pool A',
            progress: 45,
            submittedAt: '10:00:00',
          },
        ],
        slices: makeSlices('wl-a', 4, 'compute'),
      },
    ],
    workloads: [
      {
        id: 'wl-a',
        name: 'data-preprocessing',
        team: 'Team A',
        priority: 'low',
        gpusRequested: 4,
        status: 'running',
        pool: 'Pool A',
        progress: 45,
        submittedAt: '10:00:00',
      },
    ],
    events: [
      {
        timestamp: '10:00:12',
        type: 'start',
        message: "Team A 'data-preprocessing' started on Pool A (4 GPUs)",
        workloadId: 'wl-a',
        team: 'Team A',
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        severity: 'info',
        message: 'Cluster running steady — 4 of 8 GPUs in use.',
        action: 'View',
      },
    ],
    metrics: { totalGpus: 8, usedGpus: 4, compute: 62, memory: 38 },
  },

  2: {
    step: 2,
    pools: [
      {
        name: 'Pool A',
        gpuCount: 8,
        usedGpus: 4,
        workloads: [
          {
            id: 'wl-a',
            name: 'data-preprocessing',
            team: 'Team A',
            priority: 'low',
            gpusRequested: 4,
            status: 'running',
            pool: 'Pool A',
            progress: 45,
            submittedAt: '10:00:00',
          },
        ],
        slices: makeSlices('wl-a', 4, 'compute'),
      },
    ],
    workloads: [
      {
        id: 'wl-a',
        name: 'data-preprocessing',
        team: 'Team A',
        priority: 'low',
        gpusRequested: 4,
        status: 'running',
        pool: 'Pool A',
        progress: 45,
        submittedAt: '10:00:00',
      },
      {
        id: 'wl-b',
        name: 'llm-finetune',
        team: 'Team B',
        priority: 'high',
        gpusRequested: 6,
        status: 'pending',
        pool: 'Pool A',
        progress: 0,
        submittedAt: '10:15:00',
      },
    ],
    events: [
      {
        timestamp: '10:00:12',
        type: 'start',
        message: "Team A 'data-preprocessing' started on Pool A (4 GPUs)",
        workloadId: 'wl-a',
        team: 'Team A',
      },
      {
        timestamp: '10:15:03',
        type: 'submit',
        message: "Team B 'llm-finetune' submitted — needs 6 GPUs, only 4 free",
        workloadId: 'wl-b',
        team: 'Team B',
      },
    ],
    recommendations: [
      {
        id: 'rec-2',
        severity: 'warning',
        message: "Team B 'llm-finetune' queued — needs 6 GPUs but only 4 free. Preemption required.",
        action: 'Preempt',
      },
    ],
    metrics: { totalGpus: 8, usedGpus: 4, compute: 62, memory: 38 },
  },

  3: {
    step: 3,
    pools: [
      {
        name: 'Pool A',
        gpuCount: 8,
        usedGpus: 6,
        workloads: [
          {
            id: 'wl-b',
            name: 'llm-finetune',
            team: 'Team B',
            priority: 'high',
            gpusRequested: 6,
            status: 'running',
            pool: 'Pool A',
            progress: 30,
            submittedAt: '10:15:00',
          },
        ],
        slices: makeSlices('wl-b', 6, 'mixed'),
      },
    ],
    workloads: [
      {
        id: 'wl-a',
        name: 'data-preprocessing',
        team: 'Team A',
        priority: 'low',
        gpusRequested: 4,
        status: 'preempted',
        pool: 'Pool A',
        progress: 45,
        submittedAt: '10:00:00',
      },
      {
        id: 'wl-b',
        name: 'llm-finetune',
        team: 'Team B',
        priority: 'high',
        gpusRequested: 6,
        status: 'running',
        pool: 'Pool A',
        progress: 30,
        submittedAt: '10:15:00',
      },
    ],
    events: [
      {
        timestamp: '10:00:12',
        type: 'start',
        message: "Team A 'data-preprocessing' started on Pool A (4 GPUs)",
        workloadId: 'wl-a',
        team: 'Team A',
      },
      {
        timestamp: '10:15:03',
        type: 'submit',
        message: "Team B 'llm-finetune' submitted — needs 6 GPUs, only 4 free",
        workloadId: 'wl-b',
        team: 'Team B',
      },
      {
        timestamp: '10:15:08',
        type: 'preempt',
        message: "PREEMPTION: Team A 'data-preprocessing' suspended — releasing 4 GPUs",
        workloadId: 'wl-a',
        team: 'Team A',
      },
      {
        timestamp: '10:15:10',
        type: 'start',
        message: "Team B 'llm-finetune' started on Pool A (6 GPUs)",
        workloadId: 'wl-b',
        team: 'Team B',
      },
    ],
    recommendations: [
      {
        id: 'rec-3',
        severity: 'critical',
        message: "Team A 'data-preprocessing' preempted. Will auto-resume when GPUs free up.",
        action: 'Details',
      },
    ],
    metrics: { totalGpus: 8, usedGpus: 6, compute: 85, memory: 58 },
  },

  4: {
    step: 4,
    pools: [
      {
        name: 'Pool A',
        gpuCount: 8,
        usedGpus: 4,
        workloads: [
          {
            id: 'wl-a',
            name: 'data-preprocessing',
            team: 'Team A',
            priority: 'low',
            gpusRequested: 4,
            status: 'running',
            pool: 'Pool A',
            progress: 45,
            submittedAt: '10:00:00',
          },
        ],
        slices: makeSlices('wl-a', 4, 'compute'),
      },
    ],
    workloads: [
      {
        id: 'wl-a',
        name: 'data-preprocessing',
        team: 'Team A',
        priority: 'low',
        gpusRequested: 4,
        status: 'running',
        pool: 'Pool A',
        progress: 45,
        submittedAt: '10:00:00',
      },
      {
        id: 'wl-b',
        name: 'llm-finetune',
        team: 'Team B',
        priority: 'high',
        gpusRequested: 6,
        status: 'completed',
        pool: 'Pool A',
        progress: 100,
        submittedAt: '10:15:00',
      },
    ],
    events: [
      {
        timestamp: '10:00:12',
        type: 'start',
        message: "Team A 'data-preprocessing' started on Pool A (4 GPUs)",
        workloadId: 'wl-a',
        team: 'Team A',
      },
      {
        timestamp: '10:15:03',
        type: 'submit',
        message: "Team B 'llm-finetune' submitted — needs 6 GPUs, only 4 free",
        workloadId: 'wl-b',
        team: 'Team B',
      },
      {
        timestamp: '10:15:08',
        type: 'preempt',
        message: "PREEMPTION: Team A 'data-preprocessing' suspended — releasing 4 GPUs",
        workloadId: 'wl-a',
        team: 'Team A',
      },
      {
        timestamp: '10:15:10',
        type: 'start',
        message: "Team B 'llm-finetune' started on Pool A (6 GPUs)",
        workloadId: 'wl-b',
        team: 'Team B',
      },
      {
        timestamp: '10:45:22',
        type: 'complete',
        message: "Team B 'llm-finetune' completed — 6 GPUs released",
        workloadId: 'wl-b',
        team: 'Team B',
      },
      {
        timestamp: '10:45:25',
        type: 'resume',
        message: "Team A 'data-preprocessing' resumed on Pool A (4 GPUs) — continuing from 45%",
        workloadId: 'wl-a',
        team: 'Team A',
      },
    ],
    recommendations: [
      {
        id: 'rec-4',
        severity: 'info',
        message: "Team B completed. Team A resumed at 45% progress. Cluster back to steady state.",
        action: 'View',
      },
    ],
    metrics: { totalGpus: 8, usedGpus: 4, compute: 58, memory: 35 },
  },
};

export const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Steady State',
  2: 'High-Priority Arrival',
  3: 'Preemption',
  4: 'Completion & Resume',
};
