import { t } from '../features/language/language.js';
import { isReportLogo } from '../features/auth/reportBranding.js';
/** @param {string} owner */
function requireOwner(owner) { if (!owner?.trim()) throw new Error(t("Cần đăng nhập để quản lý logo.")); return owner; }
/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase */
export function createBrandingRepository(getDatabase) {
  return {
    /** @param {string} owner @returns {Promise<string>} */
    async getLogo(owner) {
      requireOwner(owner);
      const db = await getDatabase();
      const row = await db.getFirstAsync('SELECT logo_data FROM report_branding WHERE owner_id = ?', [owner]);
      return row && isReportLogo(row.logo_data) ? String(row.logo_data) : '';
    },
    /** @param {string} owner @param {string} logo */
    async setLogo(owner, logo) {
      requireOwner(owner);
      if (!isReportLogo(logo)) throw new Error(t("Logo không hợp lệ hoặc quá lớn. Hãy chọn ảnh khác."));
      const db = await getDatabase();
      await db.runAsync(`INSERT INTO report_branding (owner_id, logo_data, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(owner_id) DO UPDATE SET logo_data = excluded.logo_data, updated_at = excluded.updated_at`, [owner, logo, new Date().toISOString()]);
    },
    /** @param {string} owner */
    async removeLogo(owner) {
      requireOwner(owner);
      const db = await getDatabase();
      await db.runAsync('DELETE FROM report_branding WHERE owner_id = ?', [owner]);
    },
  };
}
