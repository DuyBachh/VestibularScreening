import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { t, getLanguage } from '../features/language/language.js';
import { batteryDatabase } from './batteryDatabase';
import { brandingDatabase } from './brandingDatabase';
import { buildBatteryReport } from '../features/tests/batteryReport';
import { shareGeneratedPdf } from '../features/tests/reportSharingFlow';

let busy = false;
/** @param {{ownerId: string,batteryId: string,mode: 'print' | 'share',isCurrent: () => boolean,reporter?: import('../features/auth/reportBranding').ReportBranding}} options */
export async function exportBatteryReport({ ownerId, batteryId, mode, isCurrent, reporter = {} }) {
  if (busy) throw new Error(t('Một báo cáo khác đang được xử lý. Hãy chờ rồi thử lại.'));
  if (Platform.OS === 'web') throw new Error(t('Hãy xuất PDF trên ứng dụng điện thoại.'));
  busy = true;
  const language = getLanguage();
  try {
    if (!isCurrent()) return;
    const battery = await batteryDatabase.get(ownerId, batteryId);
    if (!battery || !isCurrent()) throw new Error(t('Chuỗi không còn tồn tại hoặc hồ sơ đã thay đổi.'));
    const logoData = await brandingDatabase.getLogo(ownerId);
    const html = buildBatteryReport(battery, { ...reporter, logoData }, language);
    if (!isCurrent()) return;
    if (mode === 'print') await Print.printAsync({ html, margins: { top: 36, bottom: 36, left: 36, right: 36 } });
    else {
      if (!await Sharing.isAvailableAsync()) throw new Error(t('Thiết bị chưa hỗ trợ chia sẻ file PDF. Hãy dùng Xem / in báo cáo.'));
      await shareGeneratedPdf({
        isCurrent,
        create: () => Print.printToFileAsync({ html, width: 595, height: 842, margins: { top: 36, bottom: 36, left: 36, right: 36 } }),
        share: async (uri) => {
          const file = new File(uri);
          if (!file.exists || file.size === 0) throw new Error(t('Không tạo được file PDF. Hãy thử lại.'));
          if (isCurrent()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('Lưu hoặc chia sẻ báo cáo PDF') });
        },
        remove: (uri) => { const file = new File(uri); if (file.exists) file.delete(); },
      });
    }
  } finally { busy = false; }
}
