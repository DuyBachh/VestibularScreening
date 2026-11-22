import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { colors } from '../../constants/theme';
import { brandingDatabase } from '../../services/brandingDatabase';
import { useAuth } from './AuthProvider';
import { isReportLogo } from './reportBranding';

/** @param {{ownerId: string, disabled?: boolean}} props */
export function ProfileLogo({ ownerId, disabled = false }) {
  useLanguage();
  const auth = useAuth();
  const [logo, setLogo] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const generation = useRef(0);
  const active = useRef(false);
  const lock = useRef(false);
  useFocusEffect(useCallback(() => {
    const token = ++generation.current;
    active.current = auth.isSignedIn && !auth.endingSession && auth.session?.user.id === ownerId;
    setReady(false);
    if (active.current) void brandingDatabase.getLogo(ownerId).then((value) => {
      if (active.current && generation.current === token) { setLogo(value); setReady(true); }
    }).catch(() => {
      if (active.current && generation.current === token) setError(t("Không đọc được logo. Hãy mở lại màn hình để thử lại."));
    });
    return () => { active.current = false; generation.current++; };
  }, [auth.isSignedIn, auth.endingSession, auth.session?.user.id, ownerId]));

  /** @param {boolean} remove */
  async function update(remove) {
    if (lock.current || disabled || !ready || !active.current) return;
    lock.current = true;
    const token = generation.current;
    const current = () => active.current && generation.current === token;
    setBusy(true); setError(''); setMessage(''); auth.recordActivity();
    const temporary = [];
    try {
      let next = '';
      if (!remove) {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
        if (result.canceled) return;
        const asset = result.assets[0];
        temporary.push(asset.uri);
        if (!current()) return;
        const context = ImageManipulator.manipulate(asset.uri);
        let rendered;
        try {
          context.resize(asset.width >= asset.height ? { width: Math.min(asset.width, 192) } : { height: Math.min(asset.height, 192) });
          rendered = await context.renderAsync();
          const output = await rendered.saveAsync({ format: SaveFormat.PNG, base64: true });
          temporary.push(output.uri);
          next = `data:image/png;base64,${output.base64 || ''}`;
        } finally { rendered?.release(); context.release(); }
        if (!isReportLogo(next)) throw new Error(t("Ảnh này quá lớn hoặc không đọc được. Hãy chọn logo khác."));
      }
      if (!current()) return;
      if (remove) await brandingDatabase.removeLogo(ownerId);
      else await brandingDatabase.setLogo(ownerId, next);
      if (current()) { setLogo(next); setMessage(remove ? t("Đã gỡ logo trên thiết bị này.") : t("Đã lưu logo trên thiết bị này.")); }
    } catch (failure) {
      if (current()) setError(failure instanceof Error ? failure.message : t("Không cập nhật được logo. Hãy thử lại."));
    } finally {
      for (const uri of temporary) {
        try { if (uri.startsWith(Paths.cache.uri)) { const file = new File(uri); if (file.exists) file.delete(); } } catch { /* Cache is also reclaimed by the operating system. */ }
      }
      lock.current = false;
      if (active.current) { setBusy(false); auth.recordActivity(); }
    }
  }
  function confirmRemove() {
    auth.recordActivity();
    Alert.alert(t("Gỡ logo cơ sở?"), t("Báo cáo xuất sau đó sẽ không có logo. Các PDF đã lưu vẫn giữ nguyên."), [
      { text: t("Giữ lại"), style: 'cancel' }, { text: t("Gỡ logo"), style: 'destructive', onPress: () => { void update(true); } },
    ]);
  }
  return <View style={styles.panel}>
    <Text style={styles.title}>{t("Logo cơ sở")}</Text>
    <Text style={styles.body}>{t("Hiển thị trên báo cáo PDF. Logo được lưu riêng cho tài khoản này trên thiết bị, chưa đồng bộ sang máy khác.")}</Text>
    <View style={styles.preview}>{logo ? <Image source={{ uri: logo }} style={styles.image} resizeMode="contain" accessibilityLabel={t("Logo cơ sở đã lưu")} /> : <Text style={styles.body}>{t("Chưa có logo")}</Text>}</View>
    <Button secondary loading={busy} disabled={disabled || !ready} onPress={() => { void update(false); }}>{logo ? t("Đổi logo") : t("Chọn logo từ ảnh")}</Button>
    {logo ? <Button secondary disabled={busy || disabled || !ready} onPress={confirmRemove}>{t("Gỡ logo")}</Button> : null}
    <Notice error>{error}</Notice><Notice>{message}</Notice>
  </View>;
}
const styles = StyleSheet.create({
  panel: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, gap: 12, backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' }, body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  preview: { height: 112, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  image: { width: '90%', height: 88 },
});
