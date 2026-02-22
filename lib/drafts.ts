/**
 * Draft auto-save helpers using AsyncStorage.
 * Allows forms to persist in-progress data so nothing is lost if the app is backgrounded.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'oar:draft:';

export async function saveDraft<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // Non-critical — ignore storage errors
  }
}

export async function loadDraft<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function clearDraft(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // Non-critical
  }
}
