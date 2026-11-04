import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { RouteButton } from '../components/RouteButton';
import { Button } from '../components/Button';
import { useAuth } from '../features/auth/AuthProvider';
export default function SettingsScreen() {
  const auth = useAuth();
  return <Screen title="Cài đặt và hỗ trợ">
    <Card title="VestibularScreening · 1.0.0">Ngôn ngữ hiện tại: Tiếng Việt. Chưa có chuyển đổi ngôn ngữ hoặc chế độ Demo hoàn chỉnh.</Card>
    <Card title="Hướng dẫn bản hiện tại">Đăng ký tài khoản, nhập mã xác nhận từ email rồi đăng nhập. Quên mật khẩu dùng mã khôi phục trong email để đặt mật khẩu mới. Các bài kiểm tra và quản lý bệnh nhân hiện vẫn là màn hình giới thiệu.</Card>
    <RouteButton href={auth.isSignedIn ? '/profile' : '/login'}>{auth.isSignedIn ? 'Tài khoản của tôi' : 'Đăng nhập / Đăng ký'}</RouteButton>
    {auth.preview ? <Button secondary onPress={auth.exitPreview}>Thoát xem giao diện</Button> : null}
    <Card title="Giới hạn">Chưa tích hợp Apple Vision, hiệu chỉnh đồng tử, 240fps, mã hóa cơ sở dữ liệu hoặc đánh giá lâm sàng.</Card>
  </Screen>;
}
