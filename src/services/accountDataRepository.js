import { t } from '../features/language/language.js';
/** @typedef {{patients: number, trashed: number, sessions: number, logos: number}} AccountDataSummary */
/** @param {string} owner */
function requireOwner(owner) {
  if (typeof owner !== 'string' || !owner.trim()) throw new Error(t("Cần đăng nhập để quản lý dữ liệu."));
  return owner;
}
/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase */
export function createAccountDataRepository(getDatabase) {
  return {
    /** @param {string} owner @returns {Promise<AccountDataSummary>} */
    async summary(owner) {
      requireOwner(owner);
      const db = await getDatabase();
      const row = await db.getFirstAsync(`SELECT
        (SELECT COUNT(*) FROM patients WHERE owner_id = ? AND deleted_at IS NULL) AS patients,
        (SELECT COUNT(*) FROM patients WHERE owner_id = ? AND deleted_at IS NOT NULL) AS trashed,
        (SELECT COUNT(*) FROM test_sessions WHERE owner_id = ?) AS sessions,
        (SELECT COUNT(*) FROM report_branding WHERE owner_id = ?) AS logos`, [owner, owner, owner, owner]);
      if (!row) throw new Error(t("Không đọc được số lượng dữ liệu."));
      return row;
    },
    /** @param {string} owner @param {() => boolean} isCurrent */
    async clear(owner, isCurrent) {
      requireOwner(owner);
      function guard() { if (!isCurrent()) throw new Error(t("Tài khoản đã thay đổi. Chưa xóa dữ liệu.")); }
      guard();
      const db = await getDatabase();
      guard();
      await db.withExclusiveTransactionAsync(async (tx) => {
        guard();
        // Exclusive transactions use a new connection without inherited foreign_keys.
        // Delete every owned session explicitly, including unlinked and trashed-patient runs.
        await tx.runAsync('DELETE FROM test_sessions WHERE owner_id = ?', [owner]);
        guard();
        await tx.runAsync('DELETE FROM patients WHERE owner_id = ?', [owner]);
        guard();
        await tx.runAsync('DELETE FROM report_branding WHERE owner_id = ?', [owner]);
        guard();
        // Patient-delete triggers may append events; clear owned history last.
        await tx.runAsync('DELETE FROM activity_events WHERE owner_id = ?', [owner]);
        guard();
      });
    },
  };
}
