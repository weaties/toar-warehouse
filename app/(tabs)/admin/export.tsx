import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Snackbar } from 'react-native-paper';
import { exportContactsCsv, exportPetsCsv } from '@/lib/export';

export default function ExportScreen() {
  const [exporting, setExporting] = useState<'contacts' | 'pets' | null>(null);
  const [snack, setSnack] = useState('');

  async function doExport(type: 'contacts' | 'pets') {
    setExporting(type);
    try {
      if (type === 'contacts') {
        await exportContactsCsv();
      } else {
        await exportPetsCsv();
      }
      setSnack('Export complete!');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Export failed.';
      setSnack(message);
    } finally {
      setExporting(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={styles.intro}>
        Export data as CSV files to share or import into spreadsheet software.
      </Text>

      <Card style={styles.card}>
        <Card.Title
          title="Contacts List"
          subtitle="Owner names, emails, phones, addresses, and contact types"
          left={(props) => (
            <View {...props} style={styles.iconWrapper}>
              <Text style={styles.icon}>👤</Text>
            </View>
          )}
        />
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => doExport('contacts')}
            loading={exporting === 'contacts'}
            disabled={!!exporting}
            icon="download"
          >
            Export Contacts
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Pets List"
          subtitle="Pet names, species, breed, status, owner, intake type, and date"
          left={(props) => (
            <View {...props} style={styles.iconWrapper}>
              <Text style={styles.icon}>🐾</Text>
            </View>
          )}
        />
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => doExport('pets')}
            loading={exporting === 'pets'}
            disabled={!!exporting}
            icon="download"
          >
            Export Pets
          </Button>
        </Card.Actions>
      </Card>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack('')}
        duration={3000}
      >
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  intro: {
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: { marginBottom: 16, backgroundColor: '#fff' },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 24 },
});
