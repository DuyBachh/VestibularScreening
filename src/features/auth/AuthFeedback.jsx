import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { Notice } from '../../components/Notice';
import { useAuth } from './AuthProvider';

export function AuthSetupNotice() {
  useLanguage();
  const { isConfigured } = useAuth();
  return isConfigured ? null : <Notice>{t("Dịch vụ tài khoản hiện chưa sẵn sàng. Vui lòng thử lại sau; bạn vẫn có thể dùng Demo từ màn đăng nhập.")}</Notice>;
}
