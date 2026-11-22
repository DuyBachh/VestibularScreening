import { t } from '../language/language.js';
/** @param {string} value */
export const normalizeEmail = (value) => value.trim().toLowerCase();

/** @param {string} value */
export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
    ? '' : t("Vui lòng nhập địa chỉ email hợp lệ.");
}

/** @param {string} password */
export function validatePassword(password) {
  return password.length >= 8 ? '' : t("Mật khẩu cần ít nhất 8 ký tự.");
}

/** @param {string} password @param {string} confirmation */
export function validateNewPassword(password, confirmation) {
  return validatePassword(password) || (password !== confirmation ? t("Hai mật khẩu chưa khớp nhau.") : '');
}

/** @param {string} token */
export function validateOtp(token) {
  return /^\d{6,10}$/.test(token.trim()) ? '' : t("Nhập đầy đủ mã xác nhận trong email (6–10 chữ số).");
}

/** @param {unknown} error */
export function authErrorMessage(error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
  const http = typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599 ? ` (HTTP ${status})` : '';
  /** @type {Record<string, string>} */
  const messages = {
    invalid_credentials: t("Email hoặc mật khẩu chưa đúng."),
    email_not_confirmed: t("Email chưa được xác nhận. Vui lòng nhập mã xác nhận từ email."),
    user_already_exists: t("Không thể tạo tài khoản này. Hãy thử đăng nhập hoặc khôi phục mật khẩu."),
    weak_password: t("Mật khẩu chưa đạt chính sách bảo mật của dịch vụ. Hãy dùng mật khẩu dài hơn, gồm chữ và số."),
    over_email_send_rate_limit: t("Đã gửi quá nhiều email. Vui lòng đợi rồi thử lại."),
    over_request_rate_limit: t("Bạn thao tác quá nhanh. Vui lòng đợi rồi thử lại."),
    otp_expired: t("Mã không đúng hoặc đã hết hạn. Hãy yêu cầu gửi mã mới."),
    same_password: t("Mật khẩu mới cần khác mật khẩu cũ."),
    email_address_not_authorized: t("Dịch vụ email chưa cho phép gửi tới địa chỉ này. Kiểm tra cấu hình SMTP của Supabase."),
    signup_disabled: t("Đăng ký đang bị tắt trong cấu hình Supabase."),
    session_not_found: t("Phiên đã hết hạn. Vui lòng đăng nhập lại."),
    email_address_invalid: t("Dịch vụ không chấp nhận địa chỉ email này. Hãy dùng địa chỉ email thật bạn có thể nhận thư."),
    email_provider_disabled: t("Đăng ký bằng email đang bị tắt trong Supabase. Kiểm tra Email trong Sign In / Providers."),
    email_exists: t("Không thể tạo tài khoản với email này. Hãy thử đăng nhập hoặc khôi phục mật khẩu."),
    captcha_failed: t("Xác minh CAPTCHA chưa thành công. Kiểm tra cấu hình CAPTCHA trong Supabase; bản ứng dụng này chưa tích hợp CAPTCHA."),
    request_timeout: t("Máy chủ phản hồi quá lâu. Kiểm tra mạng rồi thử lại sau."),
    unexpected_failure: t("Máy chủ Supabase gặp lỗi xử lý xác thực. Kiểm tra Auth Logs của project để xác định lỗi SMTP, mẫu email hoặc cơ sở dữ liệu. Mã: unexpected_failure."),
    validation_failed: t("Dữ liệu đăng ký chưa được dịch vụ chấp nhận. Kiểm tra email và chính sách mật khẩu trong Supabase."),
    session_expired: t("Phiên đã hết hạn. Vui lòng đăng nhập lại."),
  };
  if (Object.hasOwn(messages, code)) return `${messages[code]}${http}`;
  if (status === 401) return t("Supabase từ chối yêu cầu (HTTP 401). Kiểm tra Project URL và Publishable key có thuộc cùng project, rồi khởi động lại Expo.");
  if (status === 429) return t("Dịch vụ đang giới hạn số lần yêu cầu (HTTP 429). Vui lòng đợi rồi thử lại, không bấm gửi liên tục.");
  if (typeof status === 'number' && status >= 500 && status <= 599) {
    return t("Máy chủ xác thực gặp lỗi{0}. Kiểm tra Auth Logs trong Supabase để xác định nguyên nhân trước khi thử lại.", [http]);
  }
  if (name === 'AuthRetryableFetchError') {
    return t("Không thể liên lạc ổn định với Supabase. Kiểm tra Internet trên iPhone và thử lại sau.{0}", [http]);
  }
  return t("Không thể hoàn tất thao tác{0}. Kiểm tra mạng trên iPhone và cấu hình Supabase; nếu vẫn lỗi, xem Auth Logs của project.", [http]);
}
