import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { RouteButton } from '../../components/RouteButton';
export default function LoginScreen() {
  return <Screen title="Đăng nhập"><Card title="Chưa kết nối Supabase">Xác thực thật sẽ được triển khai ở Giai đoạn 2. Hiện chỉ có thể duyệt các màn hình khung, không có phiên đăng nhập.</Card><RouteButton href="/register">Thông tin đăng ký</RouteButton><RouteButton href="/forgot-password">Thông tin khôi phục mật khẩu</RouteButton><RouteButton href="/">Về trang chủ</RouteButton></Screen>;
}
