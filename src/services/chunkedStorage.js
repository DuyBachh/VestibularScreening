/** @typedef {{ getItem: (key: string) => Promise<string | null>, setItem: (key: string, value: string) => Promise<void>, removeItem: (key: string) => Promise<void> }} KeyValueStore */

class StorageCorruptionError extends Error {}

/**
 * Store sessions in small SecureStore values. Publish a manifest only after all
 * chunks are written, so an interrupted write never replaces a valid session.
 * @param {KeyValueStore} store
 * @returns {KeyValueStore}
 */
export function createChunkedStorage(store) {
  let sequence = 0;
  /** @param {string} key */
  async function readManifest(key) {
    const raw = await store.getItem(`${key}.manifest`);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      if (!value || typeof value.id !== 'string' || !/^[\w-]+$/.test(value.id) || !Number.isInteger(value.count) || value.count < 1 || value.count > 1000) {
        throw new StorageCorruptionError('Invalid session storage manifest');
      }
      return /** @type {{ id: string, count: number }} */ (value);
    } catch (error) {
      if (error instanceof SyntaxError) throw new StorageCorruptionError('Invalid session storage manifest');
      throw error;
    }
  }
  /** @param {string} key */
  async function manifestForWrite(key) {
    try { return await readManifest(key); }
    catch (error) {
      // Reading stays fail-closed. A fresh verified login or logout may replace
      // a corrupted pointer, but native permission/storage failures still throw.
      if (error instanceof StorageCorruptionError) return null;
      throw error;
    }
  }
  /** @param {string} key @param {{ id: string, count: number } | null} manifest */
  async function removeChunks(key, manifest) {
    if (!manifest) return;
    await Promise.all(Array.from({ length: manifest.count }, (_, index) => store.removeItem(`${key}.${manifest.id}.${index}`)));
  }
  return {
    async getItem(key) {
      const manifest = await readManifest(key);
      if (!manifest) return null;
      const chunks = await Promise.all(Array.from({ length: manifest.count }, (_, index) => store.getItem(`${key}.${manifest.id}.${index}`)));
      if (chunks.some((chunk) => chunk === null)) throw new Error('Incomplete stored session');
      return chunks.join('');
    },
    async setItem(key, value) {
      const previous = await manifestForWrite(key);
      const id = `${Date.now()}-${sequence++}`;
      // At most 1600 UTF-8 bytes per chunk, including non-ASCII metadata.
      const chunks = value.match(/[\s\S]{1,400}/gu) || [''];
      if (chunks.length > 1000) throw new Error('Session value is too large');
      const manifest = { id, count: chunks.length };
      try {
        for (let index = 0; index < chunks.length; index++) {
          await store.setItem(`${key}.${id}.${index}`, chunks[index]);
        }
        await store.setItem(`${key}.manifest`, JSON.stringify(manifest));
      } catch (error) {
        await removeChunks(key, manifest).catch(() => {});
        throw error;
      }
      // A stale generation can be cleaned without invalidating the new session.
      await removeChunks(key, previous).catch(() => {});
    },
    async removeItem(key) {
      const manifest = await manifestForWrite(key);
      await store.removeItem(`${key}.manifest`);
      await removeChunks(key, manifest);
    },
  };
}
