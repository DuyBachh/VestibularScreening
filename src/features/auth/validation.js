/** @param {string} value */
export const normalizeEmail = (value) => value.trim().toLowerCase();

/** @param {string} value */
export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
    ? '' : 'Vui lòng nhập địa chỉ email hợp lệ.';
}

/** @param {string} password */
export function validatePassword(password) {
  return password.length >= 8 ? '' : 'Mật khẩu cần ít nhất 8 ký tự.';
}

/** @param {string} password @param {string} confirmation */
export function validateNewPassword(password, confirmation) {
  return validatePassword(password) || (password !== confirmation ? 'Hai mật khẩu chưa khớp nhau.' : '');
}

/** @param {string} token */
export function validateOtp(token) {
  return /^\d{6,10}$/.test(token.trim()) ? '' : 'Nhập đầy đủ mã xác nhận trong email (6–10 chữ số).';
}

/** @param {unknown} error */
export function authErrorMessage(error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  /** @type {Record<string, string>} */
  const messages = {
    invalid_credentials: 'Email hoặc mật khẩu chưa đúng.',
    email_not_confirmed: 'Email chưa được xác nhận. Vui lòng nhập mã xác nhận từ email.',
    user_already_exists: 'Không thể tạo tài khoản này. Hãy thử đăng nhập hoặc khôi phục mật khẩu.',
    weak_password: 'Mật khẩu chưa đạt chính sách bảo mật của dịch vụ. Hãy dùng mật khẩu dài hơn, gồm chữ và số.',
    over_email_send_rate_limit: 'Đã gửi quá nhiều email. Vui lòng đợi rồi thử lại.',
    over_request_rate_limit: 'Bạn thao tác quá nhanh. Vui lòng đợi rồi thử lại.',
    otp_expired: 'Mã không đúng hoặc đã hết hạn. Hãy yêu cầu gửi mã mới.',
    same_password: 'Mật khẩu mới cần khác mật khẩu cũ.',
    email_address_not_authorized: 'Dịch vụ email chưa cho phép gửi tới địa chỉ này. Kiểm tra cấu hình SMTP của Supabase.',
    signup_disabled: 'Đăng ký đang bị tắt trong cấu hình Supabase.',
    session_not_found: 'Phiên đã hết hạn. Vui lòng đăng nhập lại.',
  };
  return messages[code] || 'Không thể hoàn tất thao tác. Kiểm tra kết nối mạng và cấu hình Supabase rồi thử lại.';
}
