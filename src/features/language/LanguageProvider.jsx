import { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getLanguage, setLanguage, subscribeLanguage } from './language';
import { languagePreference } from './languagePreference';

const preference = languagePreference({
  getItem: async (key) => Platform.OS === 'web' ? globalThis.localStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key),
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      if (!globalThis.localStorage) throw new Error('Storage unavailable');
      globalThis.localStorage.setItem(key, value);
    } else await SecureStore.setItemAsync(key, value);
  },
});
export function useLanguage() { return useSyncExternalStore(subscribeLanguage, getLanguage, () => 'vi'); }
/** @param {'vi' | 'en'} value */
export async function saveLanguage(value) { setLanguage(await preference.save(value)); }

/** Load before mounting account/navigation state; changing language never remounts it.
 * @param {{children: import('react').ReactNode}} props */
export function LanguageProvider({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void preference.load().then((value) => { if (live) setLanguage(value); }).catch(() => { /* Keep Vietnamese if the saved preference cannot be read. */ }).finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);
  return ready ? children : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F8FB' }}><ActivityIndicator accessibilityLabel="Loading language / Đang tải ngôn ngữ" /></View>;
}
