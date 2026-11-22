import { t } from '../language/language.js';
/** Keep the native Print URI unchanged when handing it to Sharing (Expo Go scopes).
 * @param {{ create: () => Promise<{uri: string}>, share: (uri: string) => Promise<void>,
 * remove: (uri: string) => void | Promise<void>, isCurrent: () => boolean }} options */
export async function shareGeneratedPdf({ create, share, remove, isCurrent }) {
  let uri = '';
  try {
    if (!isCurrent()) return;
    const output = await create();
    uri = output.uri;
    if (!uri) throw new Error(t("Không tạo được file PDF. Hãy thử lại."));
    if (!isCurrent()) return;
    // Do not relocate to Paths.cache or reconstruct/decode the native URI.
    await share(uri);
  } finally {
    if (uri) await remove(uri);
  }
}
