export const BRANDING_SCHEMA = `CREATE TABLE IF NOT EXISTS report_branding (
  owner_id TEXT PRIMARY KEY NOT NULL, logo_data TEXT NOT NULL, updated_at TEXT NOT NULL
);`;
export const MAX_LOGO_LENGTH = 220000;
/** @param {unknown} value */
export function isReportLogo(value) {
  return typeof value === 'string' && value.length <= MAX_LOGO_LENGTH && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
/** @typedef {{fullName?: string, specialty?: string, workplace?: string, logoData?: string}} ReportBranding */
/** @param {ReportBranding} input */
export function normalizeReportBranding(input = {}) {
  return { fullName: String(input.fullName || '').trim().slice(0, 100), specialty: String(input.specialty || '').trim().slice(0, 120),
    workplace: String(input.workplace || '').trim().slice(0, 160), logoData: isReportLogo(input.logoData) ? input.logoData : '' };
}
