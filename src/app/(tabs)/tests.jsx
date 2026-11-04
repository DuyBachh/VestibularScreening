import { Screen } from '../../components/Screen';
import { RouteButton } from '../../components/RouteButton';
import { Card } from '../../components/Card';
import { testCatalog } from '../../features/tests/catalog';
export default function TestsScreen() {
  return <Screen title="Bài kiểm tra" subtitle="Chọn để xem hướng dẫn và phạm vi dự kiến. Stimulus chưa được triển khai.">
    {testCatalog.map((test) => <RouteButton key={test.id} href={{ pathname: '/tests/[id]', params: { id: test.id } }}>{test.name}</RouteButton>)}
    <Card title="Near Point of Convergence">Phát triển tương lai. Chưa hỗ trợ đo khoảng cách hội tụ.</Card>
  </Screen>;
}
