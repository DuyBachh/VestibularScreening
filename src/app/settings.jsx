import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { RouteButton } from '../components/RouteButton';
export default function SettingsScreen() {
  return <Screen title="Cài đặt và hỗ trợ">
    <Card title="VestibularScreening · 1.0.0">Ngôn ngữ hiện tại: Tiếng Việt. Chưa có chuyển đổi ngôn ngữ hoặc chế độ Demo hoàn chỉnh.</Card>
    <Card title="Hướng dẫn bản hiện tại">Dùng bốn tab để khám phá các màn hình. Mở Kiểm tra để đọc hướng dẫn từng bài. Không cần nhập thông tin bệnh nhân hoặc cấp quyền camera ở giai đoạn này.</Card>
    <RouteButton href="/login">Tài khoản</RouteButton>
    <Card title="Giới hạn">Chưa tích hợp Apple Vision, hiệu chỉnh đồng tử, 240fps, mã hóa cơ sở dữ liệu hoặc đánh giá lâm sàng.</Card>
  </Screen>;
}
