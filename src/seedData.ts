import { LogEntry, SyncStatus } from './types';

// Used only on first-ever launch to demonstrate list performance with 100+ items
export function generateSeedLogs(count: number): LogEntry[] {
  const statuses: SyncStatus[] = ['synced', 'synced', 'synced', 'failed'];
  return Array.from({ length: count }, (_, i) => ({
    id: `seed-${i}`,
    customerName: `Customer ${count - i}`,
    notes: `Site visit log entry #${count - i}`,
    timestamp: Date.now() - (count - i) * 1000 * 60 * 60,
    status: statuses[i % statuses.length],
  }));
}