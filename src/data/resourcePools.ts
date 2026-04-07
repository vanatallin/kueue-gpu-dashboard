export const gpuEfficiencyScore = 60;

export const gpuUtilization = {
  allocated: 42,
  unallocated: 60,
  utilization: 30,
  healthy: 38,
  warning: 4,
};

export const gpuMemoryDevices: number[] = [
  92, 87, 75, 95, 60, 45,
  88, 70, 55, 30, 82, 98,
  15, 63, 78, 40, 90, 25,
  50, 85, 72, 10, 68, 93,
  35, 58, 80, 42, 76, 20,
];

export const topPools = [
  { name: 'RP-10', utilized: 95 },
  { name: 'RP-9', utilized: 78 },
  { name: 'RP-8', utilized: 65 },
  { name: 'RP-7', utilized: 58 },
  { name: 'RP-6', utilized: 55 },
];

export const bottomPools = [
  { name: 'RP-1', utilized: 10 },
  { name: 'RP-2', utilized: 15 },
  { name: 'RP-3', utilized: 22 },
  { name: 'RP-4', utilized: 28 },
  { name: 'RP-5', utilized: 35 },
];

export const gpuByType: { type: string; vendor: 'nvidia' | 'amd'; utilized: number }[] = [
  { type: 'L40', vendor: 'nvidia', utilized: 95 },
  { type: 'MI300X', vendor: 'amd', utilized: 92 },
  { type: 'T4', vendor: 'nvidia', utilized: 87 },
  { type: 'H100', vendor: 'nvidia', utilized: 82 },
  { type: 'A100', vendor: 'nvidia', utilized: 55 },
];
