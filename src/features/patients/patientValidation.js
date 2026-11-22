import { t } from '../language/language.js';
const GENDERS = ['Nam', 'Nữ'];

/** @param {string} value */
function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** @param {{ name: string, code: string, birthDate: string, gender: string, notes: string }} values */
export function validatePatient(values) {
  if (!values.name.trim()) return t("Vui lòng nhập họ và tên.");
  if (values.name.trim().length > 80) return t("Họ và tên không được dài quá 80 ký tự.");
  if (values.code.trim() && !/^[\p{L}\p{N}][\p{L}\p{N}_-]{0,31}$/u.test(values.code.trim())) {
    return t("Mã chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới; tối đa 32 ký tự.");
  }
  if (values.birthDate.trim()) {
    if (!isRealDate(values.birthDate.trim())) return t("Ngày sinh cần theo dạng YYYY-MM-DD, ví dụ 2000-05-21.");
    const today = new Date();
    const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (values.birthDate.trim() > todayText) return t("Ngày sinh không thể ở tương lai.");
  }
  if (!GENDERS.includes(values.gender)) return t("Vui lòng chọn Nam hoặc Nữ.");
  if (values.notes.length > 1000) return t("Ghi chú không được dài quá 1.000 ký tự.");
  return '';
}

export { GENDERS };
