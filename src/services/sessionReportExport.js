import { t, getLanguage } from '../features/language/language.js';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { sessionDatabase } from './sessionDatabase';
import { getPatient } from './patientDatabase';
import { buildSessionReport } from '../features/tests/sessionReport';
import { shareGeneratedPdf } from '../features/tests/reportSharingFlow';
import { brandingDatabase } from './brandingDatabase';
import { activityDatabase } from './activityDatabase';

let busy = false;
function reportDirectory() { return new Directory(Paths.cache, 'session-reports'); }
function cleanReportCache() {
  const directory = reportDirectory();
  if (!directory.exists) return;
  for (const item of directory.list()) {
    if (item instanceof File && item.name.endsWith('.pdf')) item.delete();
  }
}

/** @param {{ownerId: string, sessionId: string, mode: 'print' | 'share', isCurrent: () => boolean, reporter?: import('../features/auth/reportBranding').ReportBranding}} options */
export async function exportSessionReport({ ownerId, sessionId, mode, isCurrent, reporter = {} }) {
  if (busy) throw new Error(t("Một báo cáo khác đang được xử lý. Hãy chờ rồi thử lại."));
  if (Platform.OS === 'web') throw new Error(t("Hãy xuất PDF trên ứng dụng điện thoại."));
  busy = true;
  const language = getLanguage();
  try {
    cleanReportCache();
    const session = await sessionDatabase.get(ownerId, sessionId);
    if (!session || !isCurrent()) throw new Error(t("Phiên không còn tồn tại hoặc tài khoản đã thay đổi."));
    const patient = session.patient_id ? await getPatient(ownerId, session.patient_id) : null;
    if (session.patient_id && !patient) throw new Error(t("Hồ sơ bệnh nhân đã bị xóa."));
    const logoData = await brandingDatabase.getLogo(ownerId);
    const html = buildSessionReport(session, patient, new Date(), { ...reporter, logoData }, language);
    if (!isCurrent()) return;
    if (mode === 'print') {
      await activityDatabase.appendReport(ownerId, 'pdf_preview_requested', sessionId);
      if (!isCurrent()) return;
      await Print.printAsync({ html, margins: { top: 36, bottom: 36, left: 36, right: 36 } });
    } else {
      if (!await Sharing.isAvailableAsync()) throw new Error(t("Thiết bị chưa hỗ trợ chia sẻ file PDF. Hãy dùng Xem / in báo cáo."));
      if (!isCurrent()) return;
      await shareGeneratedPdf({
        create: () => Print.printToFileAsync({ html, width: 595, height: 842, margins: { top: 36, bottom: 36, left: 36, right: 36 } }),
        isCurrent,
        share: async (uri) => {
          const file = new File(uri);
          if (!file.exists || file.size === 0) throw new Error(t("Không tạo được file PDF. Hãy thử lại."));
          if (!isCurrent()) return;
          await activityDatabase.appendReport(ownerId, 'pdf_created', sessionId);
          if (!isCurrent()) return;
          await activityDatabase.appendReport(ownerId, 'pdf_share_requested', sessionId);
          if (!isCurrent()) return;
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t("Lưu hoặc chia sẻ báo cáo PDF") });
        },
        remove: (uri) => {
          try { const file = new File(uri); if (file.exists) file.delete(); }
          catch { throw new Error(t("Đã đóng báo cáo nhưng chưa dọn được bản PDF tạm. Hãy thử lại.")); }
        },
      });
    }
  } finally {
    busy = false;
  }
}
