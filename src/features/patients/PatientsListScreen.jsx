import { t, genderLabel } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { colors } from '../../constants/theme';
import { useAuth } from '../auth/AuthProvider';
import { listPatients } from '../../services/patientDatabase';

/** @typedef {import('../../services/patientDatabase').PatientRecord} PatientRecord */

/** @param {string} value */
function displayBirthDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/** @param {{ patient: PatientRecord }} props */
function PatientRowContent({ patient }) {
  useLanguage();
  return <Link href={`/patients/${patient.id}`} asChild>
    <Pressable accessibilityRole="button" accessibilityLabel={t("{0}, mã {1}, chạm để mở hồ sơ", [patient.name, patient.code])} style={styles.patientCard}>
      <View style={styles.rowTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{patient.name.trim().slice(0, 1).toLocaleUpperCase('vi')}</Text></View>
        <View style={styles.nameGroup}>
          <Text numberOfLines={1} style={styles.patientName}>{patient.name}</Text>
          <Text numberOfLines={1} style={styles.patientCode}>{t("Mã hồ sơ · ")}{patient.code}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <View style={styles.rowDetails}>
        <Text style={styles.patientMeta}>{patient.birth_date ? t("Ngày sinh {0}", [displayBirthDate(patient.birth_date)]) : t("Chưa có ngày sinh")}</Text>
        <View style={styles.genderBadge}><Text style={styles.genderBadgeText}>{patient.gender ? genderLabel(patient.gender) : t("Chưa chọn")}</Text></View>
      </View>
      {patient.notes ? <Text numberOfLines={1} style={styles.patientNotes}>{patient.notes}</Text> : null}
    </Pressable>
  </Link>;
}

const PatientRow = memo(PatientRowContent);

/** @param {{ item: PatientRecord }} info */
function renderPatientItem({ item }) {
  return <PatientRow patient={item} />;
}

function Separator() {
  useLanguage();
  return <View style={styles.separator} />;
}

export default function PatientsListScreen() {
  useLanguage();
  const auth = useAuth();
  const ownerId = auth.session?.user.id;
  const [search, setSearch] = useState('');
  const [patientData, setPatientData] = useState(/** @type {{ ownerId: string | undefined, items: PatientRecord[] }} */ ({ ownerId: undefined, items: [] }));
  const [loading, setLoading] = useState(Boolean(ownerId));
  const [error, setError] = useState('');

  const loadPatients = useCallback(async (query = search) => {
    if (!ownerId || !auth.isSignedIn) return;
    setLoading(true);
    setError('');
    try {
      setPatientData({ ownerId, items: await listPatients(ownerId, query) });
    } catch {
      setError(t("Chưa đọc được hồ sơ trên thiết bị. Hãy thử tải lại màn hình."));
    } finally {
      setLoading(false);
    }
  }, [ownerId, auth.isSignedIn, search]);

  useFocusEffect(useCallback(() => {
    if (!auth.isSignedIn) return undefined;
    const timer = setTimeout(() => { void loadPatients(search); }, search ? 180 : 0);
    return () => clearTimeout(timer);
  }, [auth.isSignedIn, loadPatients, search]));

  const patients = patientData.ownerId === ownerId ? patientData.items : [];
  const isLoading = auth.isSignedIn && (loading || patientData.ownerId !== ownerId);
  if (!auth.isSignedIn) {
    return <Screen title={t("Hồ sơ bệnh nhân")} subtitle={t("Hồ sơ mẫu chỉ được mở trong phiên đăng nhập.")}>
      <Notice>{t("Chế độ xem trước không đọc hoặc lưu hồ sơ. Đăng nhập để quản lý dữ liệu giả lập.")}</Notice>
      <Link href="/login" asChild><Pressable accessibilityRole="button" style={styles.loginButton}><Text style={styles.loginButtonText}>{t("Đăng nhập")}</Text></Pressable></Link>
      <Card title={t("Riêng tư")}>{t("Không nhập thông tin nhận dạng thật. SQLite trên thiết bị chưa được mã hóa và dữ liệu không đồng bộ lên Supabase.")}</Card>
    </Screen>;
  }

  const emptyContent = isLoading
    ? <View style={styles.emptyState}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.emptyDescription}>{t("Đang tải hồ sơ…")}</Text></View>
    : error
      ? <View style={styles.emptyState}><Notice error>{error}</Notice><Button secondary onPress={() => { void loadPatients(search); }}>{t("Tải lại danh sách")}</Button></View>
      : <View style={styles.emptyState}>
        <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>{search ? '⌕' : '+'}</Text></View>
        <Text style={styles.emptyTitle}>{search ? t("Không tìm thấy hồ sơ") : t("Danh sách đang trống")}</Text>
        <Text style={styles.emptyDescription}>{search ? t("Thử một phần tên hoặc mã khác.") : t("Chạm “Thêm” để tạo hồ sơ giả lập đầu tiên.")}</Text>
      </View>;

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
    <View style={styles.page}>
      <View style={styles.fixedHeader}>
        <Text style={styles.brand}>{t("VESTIBULAR SCREENING · ĐỒ ÁN")}</Text>
        <View style={styles.titleRow}>
          <View style={styles.headingGroup}>
            <Text accessibilityRole="header" style={styles.title}>{t("Hồ sơ bệnh nhân")}</Text>
            <Text style={styles.subtitle}>{t("Quản lý hồ sơ giả lập trên thiết bị")}</Text>
          </View>
          <Link href="/patients/new" asChild>
            <Pressable accessibilityRole="button" style={styles.addButton}>
              <Text style={styles.addButtonText}><Text style={styles.plus}>＋ </Text>{t("Thêm")}</Text>
            </Pressable>
          </Link>
        </View>
        <Link href="/patients/trash" asChild><Pressable accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>{t("Thùng rác · Khôi phục hồ sơ →")}</Text></Pressable></Link>
        <Text style={styles.privacyHint}>{t("Chỉ dùng dữ liệu giả lập · Chưa mã hóa hoặc đồng bộ đám mây")}</Text>
        <View style={styles.searchGroup}>
          <Text style={styles.searchLabel}>{t("Tìm nhanh")}</Text>
          <View style={styles.searchField}>
            <TextInput
              accessibilityLabel={t("Tìm hồ sơ theo tên hoặc mã")}
              value={search}
              onChangeText={setSearch}
              placeholder={t("Nhập tên hoặc mã hồ sơ")}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
              style={styles.searchInput}
            />
            {search ? <Pressable accessibilityRole="button" accessibilityLabel={t("Xóa nội dung tìm kiếm")} onPress={() => setSearch('')} style={styles.clearSearch}><Text style={styles.clearSearchText}>{t("×")}</Text></Pressable> : null}
          </View>
        </View>
      </View>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>{isLoading ? t("Đang tìm…") : error ? t("Danh sách") : search ? t("{0} kết quả", [patients.length]) : t("Danh sách hồ sơ")}</Text>
        {!isLoading && !error && patients.length >= 200 ? <Text style={styles.resultLimit}>{t("Tối đa 200")}</Text> : null}
      </View>
      <FlatList
        style={styles.list}
        data={isLoading || error ? [] : patients}
        keyExtractor={(item) => item.id}
        renderItem={renderPatientItem}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={emptyContent}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1 },
  fixedHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { color: colors.primary, fontSize: 12, lineHeight: 18, fontWeight: '700', letterSpacing: 0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingGroup: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 26, lineHeight: 33, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  addButton: { minHeight: 48, minWidth: 94, paddingHorizontal: 13, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  plus: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  privacyHint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  searchGroup: { gap: 6 },
  searchLabel: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  searchField: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  searchInput: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 15, paddingVertical: 11, color: colors.text, fontSize: 16 },
  clearSearch: { width: 46, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { color: colors.muted, fontSize: 28, lineHeight: 32 },
  listHeading: { minHeight: 48, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listTitle: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  resultLimit: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 22 },
  separator: { height: 11 },
  patientCard: { padding: 15, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 11 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  nameGroup: { flex: 1, minWidth: 0, gap: 2 },
  patientName: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  patientCode: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  chevron: { color: colors.primary, fontSize: 26, lineHeight: 30, fontWeight: '600' },
  rowDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  patientMeta: { flex: 1, color: colors.muted, fontSize: 14, lineHeight: 19 },
  genderBadge: { minWidth: 48, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', backgroundColor: colors.tint, borderRadius: 20 },
  genderBadgeText: { color: colors.primary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  patientNotes: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  emptyState: { flexGrow: 1, minHeight: 190, justifyContent: 'center', alignItems: 'center', gap: 9, padding: 24 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.primary, fontSize: 28, lineHeight: 34, fontWeight: '500' },
  emptyTitle: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  loginButton: { minHeight: 54, padding: 15, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 17, lineHeight: 25, fontWeight: '700' },
});
