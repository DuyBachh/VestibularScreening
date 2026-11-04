import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { RouteButton } from '../../components/RouteButton';
import { useAuth } from '../../features/auth/AuthProvider';

export default function HomeScreen() {
  const auth = useAuth();
  return <Screen title="Sàng lọc tiền đình" subtitle="Không gian thực hành quy trình kiểm tra chuyển động mắt.">
    <Card title={auth.isSignedIn ? 'Đã đăng nhập' : 'Đang xem giao diện · Chưa đăng nhập'}>{auth.isSignedIn ? `Xin chào ${auth.session?.user.user_metadata.full_name || auth.session?.user.email}.` : 'Bạn đang xem các màn hình giới thiệu. Chế độ này không tạo hồ sơ hoặc lưu dữ liệu bệnh nhân.'}</Card>
    <RouteButton href="/tests">Khám phá bài kiểm tra</RouteButton>
    <RouteButton href="/patients">Hồ sơ bệnh nhân</RouteButton>
    <Card title="Hai bài kiểm tra ưu tiên">Smooth Pursuit và Horizontal Saccades. Chưa có phép đo hoặc kết quả lâm sàng.</Card>
    <RouteButton href="/settings">Cài đặt và hướng dẫn</RouteButton>
    <RouteButton href={auth.isSignedIn ? '/profile' : '/login'}>{auth.isSignedIn ? 'Thông tin tài khoản' : 'Đăng nhập / Đăng ký'}</RouteButton>
  </Screen>;
}
