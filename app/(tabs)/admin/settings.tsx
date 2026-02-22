import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Divider, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';

const SHEET_ID_KEY = 'oar:google_sheet_id';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [sheetId, setSheetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(SHEET_ID_KEY).then((v) => setSheetId(v ?? ''));
  }, []);

  async function saveSheetId() {
    setSaving(true);
    try {
      await AsyncStorage.setItem(SHEET_ID_KEY, sheetId.trim());
      setSnack('Sheet ID saved.');
    } catch {
      setSnack('Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account
        </Text>
        <Text variant="bodyMedium" style={styles.info}>
          Signed in as: {user?.email}
        </Text>
        <Button
          mode="outlined"
          onPress={signOut}
          textColor="#e63946"
          style={styles.signOutBtn}
        >
          Sign Out
        </Button>
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Google Sheets Sync (Stretch Goal)
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          Set your Google Spreadsheet ID to enable push-to-sheets export.
          Configure your service account credentials in the Supabase Edge
          Function environment.
        </Text>
        <TextInput
          label="Google Sheet ID"
          value={sheetId}
          onChangeText={setSheetId}
          mode="outlined"
          style={styles.input}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          autoCapitalize="none"
        />
        <Button
          mode="contained"
          onPress={saveSheetId}
          loading={saving}
          disabled={saving}
        >
          Save Sheet ID
        </Button>
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          About
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          OAR Rescue v0.1.0{'\n'}
          Built for Okanagan Animal Rescue volunteers.
        </Text>
      </View>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 48 },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: { fontWeight: '700', color: '#1b4332' },
  info: { color: '#555' },
  hint: { color: '#888', lineHeight: 20 },
  input: { backgroundColor: '#fff' },
  signOutBtn: { alignSelf: 'flex-start' },
});
