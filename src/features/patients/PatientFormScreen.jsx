import { t, getLocale, genderLabel } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Screen } from '../../components/Screen';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { RouteButton } from '../../components/RouteButton';
import { Notice } from '../../components/Notice';
import { colors } from '../../constants/theme';
import { useAuth } from '../auth/AuthProvider';
import { createPatient, deletePatient, getPatient, isDuplicatePatientCode, updatePatient } from '../../services/patientDatabase';
import { GENDERS, validatePatient } from './patientValidation';

const emptyForm = { name: '', code: '', birthDate: '', gender: '', notes: '' };

/** @param {string} value */
function parseLocalDate(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** @param {Date} date */
function toDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** @param {string} value */
function formatDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function PatientFormScreen() {
  useLanguage();
  const params = useLocalSearchParams();
  const patientId = typeof params.id === 'string' ? params.id : '';
  const auth = useAuth();
  const ownerId = auth.session?.user.id;
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(new Date());
  const [confirmDeleteOnWeb, setConfirmDeleteOnWeb] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPatient() {
      if (!patientId || !ownerId) { setLoading(false); return; }
      try {
        const patient = await getPatient(ownerId, patientId);
        if (!active) return;
        if (!patient) {
          setError(t("Không tìm thấy hồ sơ đang sử dụng trong tài khoản này. Nếu đã xóa, hãy kiểm tra Thùng rác."));
        } else {
          setForm({ name: patient.name, code: patient.code, birthDate: patient.birth_date, gender: GENDERS.includes(patient.gender) ? patient.gender : '', notes: patient.notes });
        }
      } catch {
        if (active) setError(t("Chưa đọc được hồ sơ. Hãy quay lại danh sách và thử lại."));
      } finally { if (active) setLoading(false); }
    }
    void loadPatient();
    return () => { active = false; };
  }, [ownerId, patientId]);

  /** @param {'name' | 'code' | 'birthDate' | 'gender' | 'notes'} key @param {string} value */
  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function openDatePicker() {
    const initialDate = parseLocalDate(form.birthDate);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: 'date',
        display: 'default',
        maximumDate: new Date(),
        onValueChange: (_event, selectedDate) => {
          if (selectedDate) updateField('birthDate', toDateValue(selectedDate));
        },
      });
      return;
    }
    setDateDraft(initialDate);
    setShowDatePicker(true);
  }

  async function save() {
    const validationError = validatePatient(form);
    if (validationError) { setError(validationError); return; }
    if (!ownerId) { setError(t("Phiên đăng nhập đã kết thúc. Hãy đăng nhập lại.")); return; }
    setSaving(true);
    setError('');
    try {
      if (patientId) {
        const updated = await updatePatient(ownerId, patientId, form);
        if (!updated) { setError(t("Không tìm thấy hồ sơ để cập nhật.")); return; }
      } else {
        await createPatient(ownerId, form);
      }
      router.replace('/patients');
    } catch (saveError) {
      setError(isDuplicatePatientCode(saveError) ? t("Mã này đã được dùng trong tài khoản, kể cả hồ sơ trong thùng rác. Hãy khôi phục hồ sơ cũ hoặc chọn mã khác.") : t("Chưa lưu được hồ sơ trên thiết bị. Hãy thử lại."));
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!ownerId || !patientId) return;
    setSaving(true);
    setError('');
    try {
      const removed = await deletePatient(ownerId, patientId);
      if (!removed) { setError(t("Hồ sơ đã được xóa hoặc không tồn tại.")); return; }
      router.replace('/patients');
    } catch {
      setError(t("Chưa xóa được hồ sơ. Hãy thử lại."));
    } finally { setSaving(false); setConfirmDeleteOnWeb(false); }
  }

  function confirmDelete() {
    if (!patientId || saving) return;
    if (Platform.OS === 'web') {
      setConfirmDeleteOnWeb(true);
      return;
    }
    Alert.alert(
      t("Chuyển hồ sơ vào thùng rác?"),
      t("Hồ sơ và các phiên liên quan sẽ được chuyển vào thùng rác. Bạn có thể khôi phục trong 30 ngày."),
      [
        { text: t("Hủy"), style: 'cancel' },
        { text: t("Chuyển vào thùng rác"), style: 'destructive', onPress: () => { void remove(); } },
      ],
      { cancelable: true },
    );
  }

  if (!auth.isSignedIn) return <Screen title={t("Hồ sơ bệnh nhân")}><Notice>{t("Phiên đăng nhập không còn hoạt động. Hãy đăng nhập để tiếp tục.")}</Notice><Button onPress={() => router.replace('/login')}>{t("Đăng nhập")}</Button></Screen>;

  return <Screen title={patientId ? t("Chỉnh sửa hồ sơ") : t("Thêm bệnh nhân")} subtitle={t("Chỉ nhập dữ liệu giả lập cho đồ án.")}>
    <Notice error>{error}</Notice>
    {loading ? <Text style={styles.loading}>{t("Đang tải hồ sơ…")}</Text> : null}
    {!loading && !error.includes(t("Không tìm thấy")) ? <>
      {patientId ? <RouteButton href={{ pathname: '/patient-history/[id]', params: { id: patientId } }}>{t("Xem lịch sử kiểm tra của bệnh nhân")}</RouteButton> : null}
      <Field label={t("Họ và tên *")} value={form.name} onChangeText={(value) => updateField('name', value)} placeholder={t("Ví dụ: Nguyễn An")} maxLength={80} autoCapitalize="words" returnKeyType="next" />
      <Field label={t("Mã bệnh nhân")} value={form.code} onChangeText={(value) => updateField('code', value)} placeholder={t("Để trống để tự tạo mã")} maxLength={32} autoCapitalize="characters" returnKeyType="next" />
      {Platform.OS === 'web' ? <Field label={t("Ngày sinh")} value={form.birthDate} onChangeText={(value) => updateField('birthDate', value)} placeholder="YYYY-MM-DD" maxLength={10} keyboardType="numbers-and-punctuation" returnKeyType="next" /> : <View style={styles.dateGroup}>
          <Text style={styles.label}>{t("Ngày sinh")}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={form.birthDate ? t("Ngày sinh {0}, chạm để thay đổi", [formatDate(form.birthDate)]) : t("Chọn ngày sinh")} onPress={openDatePicker} style={styles.dateButton}>
            <Text style={[styles.dateText, !form.birthDate && styles.datePlaceholder]}>{form.birthDate ? formatDate(form.birthDate) : t("Chạm để chọn ngày sinh")}</Text>
            <Text style={styles.calendarIcon}>▦</Text>
          </Pressable>
          {form.birthDate ? <Pressable accessibilityRole="button" onPress={() => updateField('birthDate', '')} style={styles.clearDate}><Text style={styles.clearDateText}>{t("Xóa ngày sinh")}</Text></Pressable> : null}
          {showDatePicker ? <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>{t("Chọn ngày · tháng · năm")}</Text>
            <DateTimePicker value={dateDraft} mode="date" display="spinner" locale={getLocale()} maximumDate={new Date()} textColor={colors.text} onValueChange={(_event, selectedDate) => { if (selectedDate) setDateDraft(selectedDate); }} />
            <View style={styles.pickerActions}>
              <Pressable accessibilityRole="button" onPress={() => setShowDatePicker(false)} style={styles.pickerAction}><Text style={styles.cancelText}>{t("Hủy")}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { updateField('birthDate', toDateValue(dateDraft)); setShowDatePicker(false); }} style={[styles.pickerAction, styles.useDateAction]}><Text style={styles.useDateText}>{t("Dùng ngày này")}</Text></Pressable>
            </View>
          </View> : null}
        </View>}
      <View style={styles.genderGroup}>
        <Text style={styles.label}>{t("Giới tính *")}</Text>
        <View style={styles.genderOptions}>{GENDERS.map((gender) => {
          const selected = form.gender === gender;
          return <Pressable key={genderLabel(gender)} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => updateField('gender', gender)} style={[styles.genderOption, selected && styles.genderSelected]}><Text style={[styles.genderText, selected && styles.genderTextSelected]}>{genderLabel(gender)}</Text></Pressable>;
        })}</View>
        {!form.gender ? <Text style={styles.helper}>{t("Chọn một mục để tiếp tục.")}</Text> : null}
      </View>
      <Field label={t("Ghi chú")} value={form.notes} onChangeText={(value) => updateField('notes', value)} placeholder={t("Ghi chú học tập không định danh")} maxLength={1000} multiline textAlignVertical="top" style={styles.notesInput} />
      <Text style={styles.helper}>{t("Ngày sinh có thể để trống. Ghi chú tối đa 1.000 ký tự.")}</Text>
      <Button onPress={save} loading={saving} disabled={loading}>{patientId ? t("Lưu thay đổi") : t("Tạo hồ sơ")}</Button>
      <Button secondary onPress={() => router.back()} disabled={saving}>{t("Hủy")}</Button>
      {patientId ? <>
        <Button secondary onPress={confirmDelete} disabled={saving}>{t("Chuyển vào thùng rác")}</Button>
        {confirmDeleteOnWeb ? <View style={styles.deleteConfirmation}>
          <Notice error>{t("Hồ sơ và các phiên liên quan sẽ được giữ trong thùng rác 30 ngày. Bạn muốn chuyển vào thùng rác?")}</Notice>
          <Button onPress={remove} loading={saving}>{t("Xác nhận chuyển vào thùng rác")}</Button>
          <Button secondary onPress={() => setConfirmDeleteOnWeb(false)} disabled={saving}>{t("Giữ lại hồ sơ")}</Button>
        </View> : null}
      </> : null}
    </> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  loading: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  genderGroup: { gap: 8 },
  label: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  genderOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderOption: { minHeight: 46, minWidth: 76, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  genderSelected: { borderColor: colors.primary, backgroundColor: colors.tint },
  genderText: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  genderTextSelected: { color: colors.primary },
  dateGroup: { gap: 8 },
  dateButton: { minHeight: 54, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: colors.text, fontSize: 17, lineHeight: 25 },
  datePlaceholder: { color: colors.placeholder },
  calendarIcon: { color: colors.primary, fontSize: 22, lineHeight: 28 },
  clearDate: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 2 },
  clearDateText: { color: colors.primary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  pickerPanel: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  pickerTitle: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  pickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  pickerAction: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  useDateAction: { backgroundColor: colors.primary },
  useDateText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteConfirmation: { gap: 12 },
  notesInput: { minHeight: 120 },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});
