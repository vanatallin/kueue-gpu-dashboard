export function sumCohortBorrowedGpus(queues: Array<{ borrowedGpus?: number }>): number {
  return queues.reduce((sum, q) => sum + (q.borrowedGpus ?? 0), 0);
}
