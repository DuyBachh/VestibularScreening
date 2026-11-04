import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { testCatalog } from '../../features/tests/catalog';
export default function TestDetailScreen() {
  const { id } = useLocalSearchParams();
  const test = testCatalog.find((item) => item.id === id);
  return <Screen title={test?.name ?? 'Không tìm thấy bài kiểm tra'} subtitle={test?.phase}>
    <Card title="Hướng dẫn dự kiến">{test?.description ?? 'Quay lại danh sách để chọn bài kiểm tra hợp lệ.'}</Card>
    <Card title="Chưa thể bắt đầu">Màn hình khung của Giai đoạn 1. Chưa chạy stimulus, ghi video hoặc tính chỉ số. Không có kết quả bình thường/bất thường.</Card>
  </Screen>;
}
