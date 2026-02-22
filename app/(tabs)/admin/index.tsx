import React from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { router } from 'expo-router';

function openIntakeForm() {
  if (Platform.OS === 'web') {
    window.open('/intake-form.html', '_blank');
  } else {
    // On native, link to the hosted web version (update URL after deployment)
    Linking.openURL('https://oar-rescue.ca/intake-form.html');
  }
}

export default function AdminIndexScreen() {
  return (
    <View style={styles.container}>
      <List.Item
        title="Export Data"
        description="Export contacts and pets as CSV or push to Google Sheets"
        left={(props) => <List.Icon {...props} icon="export" color="#2d6a4f" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/(tabs)/admin/export')}
        style={styles.item}
      />
      <Divider />
      <List.Item
        title="Print Intake Form"
        description="Open the paper form for clients to fill out in the field"
        left={(props) => <List.Icon {...props} icon="printer" color="#2d6a4f" />}
        right={(props) => <List.Icon {...props} icon="open-in-new" />}
        onPress={openIntakeForm}
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
