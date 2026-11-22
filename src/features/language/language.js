import { english } from './english.js';

/** @type {'vi' | 'en'} */
let language = 'vi';
/** @type {Set<() => void>} */
const listeners = new Set();
export function getLanguage() { return language; }
export function getLocale() { return language === 'en' ? 'en-US' : 'vi-VN'; }
/** @param {unknown} value @returns {'vi' | 'en'} */
export function normalizeLanguage(value) { return value === 'en' ? 'en' : 'vi'; }
/** @param {unknown} value */
export function setLanguage(value) {
  const next = normalizeLanguage(value);
  if (next === language) return;
  language = next;
  listeners.forEach((listener) => listener());
}
/** @param {() => void} listener */
export function subscribeLanguage(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }

/** Translate authored UI only. Interpolated names/notes/IDs are never looked up.
 * @param {string} source @param {unknown[]} [args] @param {string} [locale] */
export function t(source, args = [], locale = language) {
  const key = source.trim();
  if (!key) return source;
  const translated = locale === 'en' && Object.hasOwn(english, key) ? english[key] : key;
  const text = source.slice(0, source.length - source.trimStart().length) + translated + source.slice(source.trimEnd().length);
  return text.replace(/\{(\d+)\}/g, (_, index) => String(args[Number(index)] ?? `{${index}}`));
}

/** Presentation of the two stored values; never write translated labels to SQLite.
 * @param {string} gender @param {string} [locale] */
export function genderLabel(gender, locale = language) {
  if (locale !== 'en') return gender;
  return gender === 'Nam' ? 'Male' : gender === 'Nữ' ? 'Female' : gender;
}
