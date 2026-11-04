import { createClient, processLock } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createChunkedStorage } from './chunkedStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const publicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

function hasPublicCredentials() {
  try {
    if (!url || !publicKey || url.includes('YOUR_PROJECT') || publicKey.includes('YOUR_PUBLIC')) return false;
    if (new URL(url).protocol !== 'https:') return false;
    if (publicKey.startsWith('sb_publishable_')) return true;
    // Legacy anon JWTs are supported; privileged service_role keys are rejected.
    const payload = publicKey.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    return Boolean(payload && JSON.parse(atob(payload)).role === 'anon');
  } catch {
    return false;
  }
}

export const isAuthConfigured = hasPublicCredentials();
export const sessionStorageKey = isAuthConfigured ? `sb-${new URL(url).hostname}-auth-token` : 'vestibular-unconfigured';
export const recoveryStorageKey = `${sessionStorageKey}.recovery`;
export const activityStorageKey = `${sessionStorageKey}.activity`;

const nativeStorage = createChunkedStorage({
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
});

// Web fallback is session-only in memory; the mobile app uses SecureStore.
const webValues = new Map();
/** @type {import('./chunkedStorage').KeyValueStore} */
export const sessionStorage = Platform.OS === 'web' ? {
  getItem: async (key) => webValues.get(key) ?? null,
  setItem: async (key, value) => { webValues.set(key, value); },
  removeItem: async (key) => { webValues.delete(key); },
} : nativeStorage;

export const supabase = isAuthConfigured ? createClient(url, publicKey, {
  auth: {
    storage: sessionStorage,
    storageKey: sessionStorageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
}) : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}
