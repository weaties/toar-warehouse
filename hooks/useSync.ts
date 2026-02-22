import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushQueue, getPendingCount } from '@/lib/sync';
import type { SyncStatus } from '@/types';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const refresh = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
    if (count > 0) {
      setStatus('pending');
    } else {
      setStatus('synced');
    }
  }, []);

  const sync = useCallback(async () => {
    if (!isOnline) return;
    try {
      const { failed } = await flushQueue();
      if (failed > 0) {
        setStatus('error');
      } else {
        setStatus('synced');
        setPendingCount(0);
      }
    } catch {
      setStatus('error');
    }
  }, [isOnline]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      if (online) {
        sync();
      }
    });
    return () => unsubscribe();
  }, [sync]);

  return { status, pendingCount, isOnline, refresh, sync };
}
