import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Snackbar, Divider } from 'react-native-paper';
import { exportContactsCsv, exportPetsCsv } from '@/lib/export';
import { pushToSheets, getSavedSheetId } from '@/lib/sheets';

type ExportAction = 'csv-contacts' | 'csv-pets' | 'sheets-contacts' | 'sheets-pets' | null;

export default function ExportScreen() {
  const [active, setActive] = useState<ExportAction>(null);
  const [snack, setSnack] = useState('');
  const [sheetId, setSheetId] = useState('');

  useEffect(() => {
    getSavedSheetId().then(setSheetId);
  }, []);

  async function doExport(action: ExportAction) {
    setActive(action);
    try {
      if (action === 'csv-contacts') {
        await exportContactsCsv();
        setSnack('Contacts exported.');
      } else if (action === 'csv-pets') {
        await exportPetsCsv();
        setSnack('Pets exported.');
      } else if (action === 'sheets-contacts') {
        const { rows } = await pushToSheets('contacts', sheetId);
        setSnack(`Pushed ${rows} contact${rows !== 1 ? 's' : ''} to Google Sheets.`);
      } else if (action === 'sheets-pets') {
        const { rows } = await pushToSheets('pets', sheetId);
        setSnack(`Pushed ${rows} pet${rows !== 1 ? 's' : ''} to Google Sheets.`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Export failed.';
      setSnack(message);
    } finally {
      setActive(null);
    }
  }

  const sheetsConfigured = !!sheetId.trim();

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={styles.intro}>
        Export data as CSV files or push to Google Sheets.
      </Text>

      {/* Contacts */}
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
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => doExport('csv-contacts')}
            loading={active === 'csv-contacts'}
            disabled={!!active}
            icon="download"
            compact
          >
            CSV
          </Button>
          <Button
            mode="contained"
            onPress={() => doExport('sheets-contacts')}
            loading={active === 'sheets-contacts'}
            disabled={!!active || !sheetsConfigured}
            icon="google-spreadsheet"
            compact
          >
            Push to Sheets
          </Button>
        </Card.Actions>
      </Card>

      {/* Pets */}
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
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => doExport('csv-pets')}
            loading={active === 'csv-pets'}
            disabled={!!active}
            icon="download"
            compact
          >
            CSV
          </Button>
          <Button
            mode="contained"
            onPress={() => doExport('sheets-pets')}
            loading={active === 'sheets-pets'}
            disabled={!!active || !sheetsConfigured}
            icon="google-spreadsheet"
            compact
          >
            Push to Sheets
          </Button>
        </Card.Actions>
      </Card>

      {!sheetsConfigured && (
        <Text style={styles.sheetsHint}>
          Set a Google Sheet ID in Settings to enable Sheets push.
        </Text>
      )}

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack('')}
        duration={4000}
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
  cardActions: { gap: 8, flexWrap: 'wrap' },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 24 },
  sheetsHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});
