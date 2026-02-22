import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or anon key is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
  );
}

// Use placeholder values during static export / build to prevent createClient from throwing.
// Real credentials must be set in .env before running the app.
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
