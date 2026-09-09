export type SyncStatus = 'pending' | 'synced' | 'failed';

export type LogEntry = {
  id: string;
  customerName: string;
  notes: string;
  timestamp: number;
  status: SyncStatus;
  imageUri?: string;
};