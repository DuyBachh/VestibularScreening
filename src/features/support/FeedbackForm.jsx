import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { AccountField, AccountLink, AccountScreen, accountStyles } from '../auth/AccountUI';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { colors } from '../../constants/theme';
import { buildFeedbackMessage, feedbackErrors, FEEDBACK_LIMITS } from './feedbackData';

const EMPTY = { kind: 'bug', title: '', description: '', steps: '', expected: '' };

export function FeedbackForm() {
  useLanguage();
  const auth = useAuth();
  const [draft, setDraft] = useState({ ...EMPTY });
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [includeInfo, setIncludeInfo] = useState(true);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const active = useRef(false);
  const generation = useRef(0);
  const lock = useRef(false);
  useFocusEffect(useCallback(() => {
    active.current = true;
    if (!lock.current) setBusy(false);
    return () => { active.current = false; generation.current++; };
  }, []));
  /** @param {string} field @param {string} value */
  function change(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors({}); setError(''); setMessage('');
    auth.recordActivity();
  }
  function review() {
    Keyboard.dismiss(); auth.recordActivity();
    const found = feedbackErrors(draft);
    setErrors(found); setError(''); setMessage('');
    if (Object.keys(found).length) { setError(t("Hãy kiểm tra các ô có thông báo bên dưới.")); return; }
    setPreview(buildFeedbackMessage(draft, includeInfo ? { appVersion: Constants.expoConfig?.version, platform: Platform.OS, osVersion: Platform.Version } : null));
  }
  async function share() {
    if (lock.current || !preview || !active.current) return;
    lock.current = true; setBusy(true); setMessage(''); setError(''); auth.recordActivity();
    const token = generation.current;
    const isCurrent = () => active.current && generation.current === token;
    try {
      const result = await Share.share({ title: t("Phản hồi VestibularScreening"), message: preview }, { subject: draft.title.trim(), dialogTitle: t("Chia sẻ phản hồi") });
      if (isCurrent()) setMessage(result.action === Share.dismissedAction ? t("Đã đóng bảng chia sẻ. Nội dung vẫn được giữ để bạn chỉnh sửa.") : t("Đã đóng bảng chia sẻ. Ứng dụng không xác nhận phản hồi đã được gửi hoặc người nhận đã nhận."));
    } catch {
      if (isCurrent()) setError(t("Không mở được bảng chia sẻ. Bạn có thể chạm giữ nội dung để sao chép rồi thử lại."));
    } finally {
      lock.current = false;
      if (active.current) { setBusy(false); auth.recordActivity(); }
    }
  }
  function reset() {
    const token = generation.current;
    Alert.alert(t("Xóa nội dung phản hồi?"), t("Nội dung đang soạn sẽ bị bỏ. Các bản đã sao chép hoặc chia sẻ không thay đổi."), [
      { text: t("Giữ lại"), style: 'cancel' }, { text: t("Xóa nội dung"), style: 'destructive', onPress: () => { if (active.current && generation.current === token && !lock.current) { setDraft({ ...EMPTY }); setPreview(''); setErrors({}); setMessage(''); setError(''); setIncludeInfo(true); } } },
    ]);
  }
  if (preview) return <AccountScreen key="review" title={t("Xem lại phản hồi")} subtitle={t("Chưa gửi đến đâu. Bạn tự chọn người nhận khi chia sẻ; có thể chạm giữ nội dung để sao chép.")}>
    <Text selectable style={styles.preview}>{preview}</Text>
    <Notice error>{error}</Notice><Notice>{message}</Notice>
    {Platform.OS !== 'web' ? <Button loading={busy} onPress={() => { void share(); }}>{t("Chia sẻ phản hồi")}</Button> : <Text style={accountStyles.body}>{t("Chọn nội dung để sao chép. Chia sẻ trực tiếp được hỗ trợ trên điện thoại.")}</Text>}
    <Button secondary disabled={busy} onPress={() => { setPreview(''); setError(''); setMessage(''); }}>{t("Chỉnh sửa nội dung")}</Button>
    <AccountLink danger disabled={busy} onPress={reset}>{t("Xóa nội dung đang soạn")}</AccountLink>
    <Text style={styles.hint}>{t("Nội dung chỉ giữ trong màn hình này, không lưu vào tài khoản. Thoát màn hình hoặc khởi động lại ứng dụng sẽ bỏ bản soạn.")}</Text>
  </AccountScreen>;

  return <AccountScreen key="form" title={t("Báo lỗi và góp ý")} subtitle={t("Mô tả điều bạn gặp để việc kiểm tra và cải thiện ứng dụng dễ hơn.")}>
    <Text style={styles.hint}>{t("Không nhập mật khẩu, mã xác nhận, khóa bí mật hoặc dữ liệu bệnh nhân. Nội dung chỉ giữ trong màn hình này và mất khi thoát; chưa có hộp thư hỗ trợ tự động.")}</Text>
    <View style={styles.options}>{[['bug', t("Báo lỗi")], ['suggestion', t("Góp ý")]].map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: draft.kind === value }} onPress={() => change('kind', value)} style={[styles.option, draft.kind === value && styles.selected]}><Text style={[styles.optionText, draft.kind === value && styles.selectedText]}>{label}</Text></Pressable>)}</View>
    <View style={accountStyles.group}>
      <AccountField label={t("Tiêu đề *")} placeholder={t("Ví dụ: Không mở được báo cáo PDF")} value={draft.title} onChangeText={(value) => change('title', value)} maxLength={FEEDBACK_LIMITS.title} autoCapitalize="sentences" returnKeyType="done" />
      {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}
      <AccountField label={draft.kind === 'bug' ? t("Điều gì đã xảy ra? *") : t("Nội dung góp ý *")} placeholder={draft.kind === 'bug' ? t("Mô tả hiện tượng hoặc thông báo lỗi bạn thấy") : t("Bạn muốn cải thiện điều gì trong ứng dụng?")} multiline textAlignVertical="top" style={styles.multiline} value={draft.description} onChangeText={(value) => change('description', value)} maxLength={FEEDBACK_LIMITS.description} autoCapitalize="sentences" />
      <Text style={[styles.counter, errors.description && styles.error]}>{draft.description.length}/{FEEDBACK_LIMITS.description}{errors.description ? ` · ${errors.description}` : ''}</Text>
      <AccountField label={draft.kind === 'bug' ? t("Các bước dẫn đến lỗi *") : t("Tình huống sử dụng (không bắt buộc)")} placeholder={t("1. Mở màn hình…\n2. Bấm…\n3. Xuất hiện…")} multiline textAlignVertical="top" style={styles.multiline} value={draft.steps} onChangeText={(value) => change('steps', value)} maxLength={FEEDBACK_LIMITS.steps} autoCapitalize="sentences" />
      <Text style={[styles.counter, errors.steps && styles.error]}>{draft.steps.length}/{FEEDBACK_LIMITS.steps}{errors.steps ? ` · ${errors.steps}` : ''}</Text>
      <AccountField label={t("Kết quả mong đợi / đề xuất (không bắt buộc)")} placeholder={t("Bạn mong ứng dụng hoạt động như thế nào?")} multiline textAlignVertical="top" style={styles.multiline} value={draft.expected} onChangeText={(value) => change('expected', value)} maxLength={FEEDBACK_LIMITS.expected} autoCapitalize="sentences" />
      <Text style={styles.counter}>{draft.expected.length}/{FEEDBACK_LIMITS.expected}</Text>
    </View>
    <View style={styles.info}><View style={styles.infoText}><Text style={styles.label}>{t("Đính kèm thông tin ứng dụng")}</Text><Text style={styles.hint}>{t("Phiên bản ")}{Constants.expoConfig?.version || t("chưa xác định")} · {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'} {Platform.Version}{'\n'}{t("Không kèm email, mã tài khoản, hồ sơ hoặc lịch sử.")}</Text></View><Switch accessibilityLabel={t("Đính kèm phiên bản ứng dụng và hệ điều hành")} value={includeInfo} onValueChange={(value) => { setIncludeInfo(value); auth.recordActivity(); }} /></View>
    <Notice error>{error}</Notice>
    <Button onPress={review}>{t("Xem lại nội dung")}</Button>
    <AccountLink danger onPress={reset}>{t("Xóa nội dung đang soạn")}</AccountLink>
  </AccountScreen>;
}
const styles = StyleSheet.create({
  options: { flexDirection: 'row', gap: 10 }, option: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5DF', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 10 },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary }, optionText: { fontSize: 16, fontWeight: '600', color: colors.text }, selectedText: { color: '#FFFFFF' },
  hint: { fontSize: 13, lineHeight: 21, color: colors.muted }, multiline: { minHeight: 110, lineHeight: 24 },
  counter: { fontSize: 12, lineHeight: 19, color: colors.muted, marginTop: -10 }, error: { color: colors.danger, fontSize: 13, lineHeight: 21 },
  info: { padding: 14, gap: 12, borderRadius: 14, backgroundColor: colors.tint, flexDirection: 'row', alignItems: 'center' }, infoText: { flex: 1, gap: 5 }, label: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  preview: { fontSize: 15, lineHeight: 24, color: colors.text, backgroundColor: colors.surface, borderColor: '#CBD5DF', borderWidth: 1, borderRadius: 14, padding: 16 },
});
