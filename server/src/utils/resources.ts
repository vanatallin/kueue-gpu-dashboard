// Parse Kubernetes resource quantities

/** Parse CPU quantity to cores (handles millicores, e.g. "8000m" → 8) */
export function parseCpu(q: string | undefined): number {
  if (!q) return 0;
  if (q.endsWith('m')) {
    return parseInt(q, 10) / 1000;
  }
  return parseFloat(q) || 0;
}

/** Parse memory quantity to GiB (handles Ki, Mi, Gi, Ti and plain bytes) */
export function parseMemory(q: string | undefined): number {
  if (!q) return 0;

  const suffixMatch = q.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);
  if (!suffixMatch) {
    const bytes = parseInt(q, 10);
    return Number.isNaN(bytes) ? 0 : bytes / (1024 ** 3);
  }

  const value = parseFloat(suffixMatch[1]);
  const suffix = suffixMatch[2] || '';

  switch (suffix) {
    case 'Ki':
    case 'K':
      return value / (1024 ** 2);
    case 'Mi':
    case 'M':
      return value / 1024;
    case 'Gi':
    case 'G':
      return value;
    case 'Ti':
    case 'T':
      return value * 1024;
    default:
      return value / (1024 ** 3);
  }
}

/** Parse generic quantity (cores or integer counts, e.g. GPU counts) */
export function parseQuantity(q: string | undefined): number {
  if (!q) return 0;
  if (q.endsWith('m')) {
    return parseInt(q, 10) / 1000;
  }
  return parseInt(q, 10) || 0;
}

export function percentUsed(used: number, allocatable: number): number {
  if (allocatable <= 0) return 0;
  return Math.round((used / allocatable) * 100);
}
