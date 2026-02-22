/**
 * Offline sync layer using AsyncStorage as a queue.
 * When offline, write operations are queued here and replayed when connectivity is restored.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';
import type { SyncQueueItem, SyncTable, SyncOperation } from '@/types';

const QUEUE_KEY = 'oar:sync_queue';

export async function getQueue(): Promise<SyncQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: SyncQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
): Promise<void> {
  const queue = await getQueue();
  const item: SyncQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    table,
    operation,
    payload,
    created_at: new Date().toISOString(),
    retries: 0,
  };
  queue.push(item);
  await saveQueue(queue);
}

export async function flushQueue(): Promise<{
  succeeded: number;
  failed: number;
}> {
  const queue = await getQueue();
  if (queue.length === 0) return { succeeded: 0, failed: 0 };

  const remaining: SyncQueueItem[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await applyOperation(item);
      succeeded++;
    } catch (err) {
      console.warn(`Sync failed for item ${item.id}:`, err);
      item.retries++;
      if (item.retries < 5) {
        remaining.push(item);
      }
      failed++;
    }
  }

  await saveQueue(remaining);
  return { succeeded, failed };
}

async function applyOperation(item: SyncQueueItem): Promise<void> {
  const { table, operation, payload } = item;

  if (operation === 'insert') {
    const { error } = await supabase.from(table).upsert(payload as object);
    if (error) throw error;
  } else if (operation === 'update') {
    const { id, ...rest } = payload as { id: string } & Record<string, unknown>;
    const { error } = await supabase.from(table).update(rest).eq('id', id);
    if (error) throw error;
  } else if (operation === 'delete') {
    const { id } = payload as { id: string };
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }
}

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
