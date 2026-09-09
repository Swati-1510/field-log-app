import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry } from './types';

const STORAGE_KEY = 'field-logs';

export async function loadLogs(): Promise<LogEntry[] | null> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

export async function saveLogs(logs: LogEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}