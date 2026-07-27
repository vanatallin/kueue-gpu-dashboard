export function formatCpu(cores: number): string {
  if (Number.isInteger(cores)) return String(cores);
  return cores.toFixed(1);
}

export function formatMemoryGi(gi: number): string {
  if (gi >= 100) return Math.round(gi).toString();
  if (gi >= 10) return gi.toFixed(1);
  return gi.toFixed(2);
}

export function percentUsed(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((used / total) * 100);
}
