import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
export default function PatientsScreen() {
  return <Screen title="Hồ sơ bệnh nhân" subtitle="Quản lý thông tin giả lập phục vụ đồ án."><Card title="Chưa có hồ sơ">Giai đoạn 3 sẽ bổ sung tạo, tìm kiếm, chỉnh sửa, xóa có xác nhận và lưu hồ sơ bằng SQLite. Hiện chưa có cơ sở dữ liệu.</Card></Screen>;
}
