import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { t } from '../features/language/language.js';
import { shareGeneratedPdf } from '../features/tests/reportSharingFlow.js';

let busy = false;
/** @param {string} html @param {() => boolean} isCurrent */
export async function exportTraceReport(html, isCurrent) {
  if (busy) throw new Error(t('Một báo cáo khác đang được xử lý. Hãy chờ rồi thử lại.'));
  if (Platform.OS === 'web') throw new Error(t('Hãy xuất PDF trên ứng dụng điện thoại.'));
  busy = true;
  try {
    if (!await Sharing.isAvailableAsync()) throw new Error(t('Thiết bị chưa hỗ trợ chia sẻ file PDF. Hãy dùng Xem / in báo cáo.'));
    await shareGeneratedPdf({
      create: () => Print.printToFileAsync({ html, width: 595, height: 842, margins: { top: 36, bottom: 36, left: 36, right: 36 } }),
      isCurrent,
      share: async (uri) => {
        const file = new File(uri);
        if (!file.exists || file.size === 0) throw new Error(t('Không tạo được file PDF. Hãy thử lại.'));
        if (isCurrent()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('Lưu hoặc chia sẻ báo cáo PDF') });
      },
      remove: (uri) => { const file = new File(uri); if (file.exists) file.delete(); },
    });
  } finally { busy = false; }
}
