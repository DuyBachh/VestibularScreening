import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { RouteButton } from '../../components/RouteButton';

export default function HomeScreen() {
  return <Screen title="Sàng lọc tiền đình" subtitle="Không gian thực hành quy trình kiểm tra chuyển động mắt.">
    <Card title="Giai đoạn 1 · Nền tảng ứng dụng">Đã thiết lập giao diện và điều hướng. Chưa tích hợp xác thực, hồ sơ, camera hoặc theo dõi đồng tử.</Card>
    <RouteButton href="/tests">Khám phá bài kiểm tra</RouteButton>
    <RouteButton href="/patients">Hồ sơ bệnh nhân</RouteButton>
    <Card title="Hai bài kiểm tra ưu tiên">Smooth Pursuit và Horizontal Saccades. Chưa có phép đo hoặc kết quả lâm sàng.</Card>
    <RouteButton href="/settings">Cài đặt và hướng dẫn</RouteButton>
  </Screen>;
}
