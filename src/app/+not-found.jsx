import { Screen } from '../components/Screen';
import { RouteButton } from '../components/RouteButton';
export default function NotFoundScreen() {
  return <Screen title="Không tìm thấy màn hình"><RouteButton href="/">Về trang chủ</RouteButton></Screen>;
}
