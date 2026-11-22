import { t } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { Screen } from '../components/Screen';
import { RouteButton } from '../components/RouteButton';
export default function NotFoundScreen() {
  useLanguage();
  return <Screen title={t("Không tìm thấy màn hình")}><RouteButton href="/">{t("Về trang chủ")}</RouteButton></Screen>;
}
