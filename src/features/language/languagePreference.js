import { normalizeLanguage } from './language.js';

export const LANGUAGE_KEY = 'vestibular.ui.language.v1';
/** @param {{getItem: (key: string) => Promise<string | null>, setItem: (key: string, value: string) => Promise<void>}} storage */
export function languagePreference(storage) {
  return {
    async load() { return normalizeLanguage(await storage.getItem(LANGUAGE_KEY)); },
    /** @param {'vi' | 'en'} value */
    async save(value) {
      if (value !== 'vi' && value !== 'en') throw new Error('Unsupported language');
      await storage.setItem(LANGUAGE_KEY, value);
      return value;
    },
  };
}
