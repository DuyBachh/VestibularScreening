import { Notice } from '../../components/Notice';
import { useAuth } from './AuthProvider';

export function AuthSetupNotice() {
  const { isConfigured } = useAuth();
  return isConfigured ? null : <Notice>Chưa kết nối dịch vụ tài khoản. Bạn có thể xem giao diện, nhưng chưa thể đăng ký hoặc đăng nhập. Xem hướng dẫn cấu hình Supabase trong tài liệu dự án.</Notice>;
}
