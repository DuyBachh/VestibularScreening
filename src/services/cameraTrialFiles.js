import { File, Paths } from 'expo-file-system';

function manifest() { return new File(Paths.document, 'camera-trial-pending.json'); }

/** Delete only a camera result in this app's cache. @param {string} uri */
export function deleteTrialVideo(uri) {
  const file = new File(uri);
  if (!file.uri.startsWith(`${Paths.cache.uri.replace(/\/$/, '')}/`)) throw new Error('Invalid cache path');
  const pending = manifest();
  // Remember returned files so a failed deletion can be retried on the next visit.
  try { pending.writeSync(JSON.stringify(file.uri)); } catch { /* Still attempt deletion. */ }
  if (file.exists) file.delete();
  if (file.exists) throw new Error('Video still exists');
  if (pending.exists) pending.delete();
}

export function cleanPendingTrialVideo() {
  const pending = manifest();
  if (!pending.exists) return;
  const uri = JSON.parse(pending.textSync());
  if (typeof uri !== 'string') throw new Error('Invalid pending video');
  deleteTrialVideo(uri);
}
