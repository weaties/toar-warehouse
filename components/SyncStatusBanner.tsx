import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import type { SyncStatus } from '@/types';

interface Props {
  status: SyncStatus;
  pendingCount: number;
}

export default function SyncStatusBanner({ status, pendingCount }: Props) {
  if (status === 'synced') return null;

  const backgroundColor =
    status === 'error' ? '#f4a261' : '#95d5b2';

  const message =
    status === 'pending'
      ? `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`
      : 'Sync error — will retry';

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      {status === 'pending' && (
        <ActivityIndicator size={12} color="#1b4332" style={styles.spinner} />
      )}
      <Text style={styles.text} variant="labelSmall">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  spinner: {
    marginRight: 6,
  },
  text: {
    color: '#1b4332',
    fontWeight: '600',
  },
});
