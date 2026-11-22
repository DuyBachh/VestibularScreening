import { t, genderLabel } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { listPatients } from '../../services/patientDatabase';
import { colors } from '../../constants/theme';

/** @param {{ ownerId: string, onSelect: (patient: import('../../services/patientDatabase').PatientRecord | null) => void, onClose: () => void }} props */
export function PatientPicker({ ownerId, onSelect, onClose }) {
  useLanguage();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(/** @type {import('../../services/patientDatabase').PatientRecord[]} */ ([]));
  const [message, setMessage] = useState(t("Đang tải…"));
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const patients = await listPatients(ownerId, query);
        if (live) { setItems(patients); setMessage(patients.length ? '' : t("Không có hồ sơ phù hợp. Hãy tạo hồ sơ trong tab Bệnh nhân hoặc chạy không gắn hồ sơ.")); }
      } catch { if (live) { setItems([]); setMessage(t("Không tải được hồ sơ. Hãy thử lại.")); } }
      finally { if (live) setLoading(false); }
    }, 180);
    return () => { live = false; clearTimeout(timer); };
  }, [ownerId, query, reload]);
  return <Modal visible presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaProvider><SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("Chọn bệnh nhân")}</Text>
        <Field label={t("Tìm theo tên hoặc mã")} value={query} onChangeText={(value) => { setQuery(value); setLoading(true); }} placeholder={t("Ví dụ: An hoặc BN-01")} />
        <Button secondary onPress={() => onSelect(null)}>{t("Không gắn hồ sơ")}</Button>
      </View>
      <FlatList data={loading ? [] : items} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.body}>{loading ? t("Đang tìm…") : message}</Text>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" style={styles.item} onPress={() => onSelect(item)}>
          <Text style={styles.name}>{item.name}</Text><Text style={styles.body}>{item.code} · {genderLabel(item.gender)}</Text>
        </Pressable>} />
      <View style={styles.header}><Text style={styles.body}>{t("Tối đa 200 hồ sơ mỗi lần tìm. Chỉ dùng dữ liệu giả lập.")}</Text>
        <Button secondary onPress={() => setReload((value) => value + 1)}>{t("Tải lại")}</Button><Button onPress={onClose}>{t("Đóng")}</Button>
      </View>
    </SafeAreaView></SafeAreaProvider>
  </Modal>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { padding: 18, gap: 12 },
  title: { fontSize: 25, fontWeight: '700', color: colors.text }, list: { paddingHorizontal: 18, gap: 10, paddingBottom: 18 },
  item: { padding: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, gap: 5 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
});
