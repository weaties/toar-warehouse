import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { fetchOwners } from './supabase/owners';
import { fetchPets } from './supabase/pets';
import type { ContactExportRow, PetExportRow } from '@/types';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export async function exportContactsCsv(): Promise<void> {
  const owners = await fetchOwners();

  const headers = ['Name', 'Email', 'Phone', 'Address', 'Contact Type'];
  const rows: string[][] = owners.map((o) => {
    const row: ContactExportRow = {
      name: o.full_name ?? '',
      email: o.email ?? '',
      phone: o.phone_primary ?? '',
      address: [o.street_address, o.city, o.province, o.postal_code]
        .filter(Boolean)
        .join(', '),
      contact_type: (o.contact_type ?? []).join('; '),
    };
    return [row.name, row.email, row.phone, row.address, row.contact_type];
  });

  await writeCsvAndShare(rowsToCsv(headers, rows), 'oar-contacts');
}

export async function exportPetsCsv(): Promise<void> {
  const pets = await fetchPets();

  const headers = [
    'Pet Name',
    'Species',
    'Breed',
    'Status',
    'Owner Name',
    'Intake Type',
    'Intake Date',
  ];

  const rows: string[][] = pets.map((p) => {
    const row: PetExportRow = {
      name: p.name,
      species: p.species,
      breed: p.breed ?? '',
      status: p.current_status,
      owner_name: p.owner?.full_name ?? '',
      intake_type: p.intake_type ?? '',
      intake_date: format(new Date(p.created_at), 'yyyy-MM-dd'),
    };
    return [
      row.name,
      row.species,
      row.breed,
      row.status,
      row.owner_name,
      row.intake_type,
      row.intake_date,
    ];
  });

  await writeCsvAndShare(rowsToCsv(headers, rows), 'oar-pets');
}

async function writeCsvAndShare(csv: string, basename: string): Promise<void> {
  const filename = `${basename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;

  if (Platform.OS === 'web') {
    // Browser download via a temporary anchor element
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Native: write to device storage then share
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Export ${basename}`,
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    throw new Error('Sharing is not available on this device.');
  }
}
