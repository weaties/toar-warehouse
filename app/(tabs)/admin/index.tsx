import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { router } from 'expo-router';

export default function AdminIndexScreen() {
  return (
    <View style={styles.container}>
      <List.Item
        title="Export Data"
        description="Export contacts and pets as CSV files"
        left={(props) => <List.Icon {...props} icon="export" color="#2d6a4f" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/(tabs)/admin/export')}
        style={styles.item}
      />
      <Divider />
      <List.Item
        title="Settings"
        description="App configuration and Google Sheets sync"
        left={(props) => <List.Icon {...props} icon="cog" color="#2d6a4f" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/(tabs)/admin/settings')}
        style={styles.item}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  item: { backgroundColor: '#fff', paddingVertical: 8 },
});
