/**
 * Google Sheets push helpers.
 * Calls the push-to-sheets Supabase Edge Function which holds the
 * service account credentials — the API key never touches the client.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';

export const SHEET_ID_KEY = 'oar:google_sheet_id';

export async function getSavedSheetId(): Promise<string> {
  return (await AsyncStorage.getItem(SHEET_ID_KEY)) ?? '';
}

export async function pushToSheets(
  type: 'contacts' | 'pets',
  sheetId: string,
): Promise<{ rows: number }> {
  if (!sheetId.trim()) {
    throw new Error('No Google Sheet ID configured. Set it in Settings.');
  }

  const { data, error } = await supabase.functions.invoke('push-to-sheets', {
    body: { sheet_id: sheetId.trim(), type },
  });

  if (error) throw new Error(error.message ?? 'Edge function error');

  const result = data as { success: boolean; error?: string; rows?: number };
  if (!result.success) {
    throw new Error(result.error ?? 'Push to Sheets failed');
  }

  return { rows: result.rows ?? 0 };
}
