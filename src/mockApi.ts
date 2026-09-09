import { LogEntry } from './types';

// Simulates a backend API call — replace with real fetch() in production
export function uploadLog(_entry: LogEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.05 ? resolve() : reject(new Error('Network error'));
    }, 800);
  });
}