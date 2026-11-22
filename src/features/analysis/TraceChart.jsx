import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { t } from '../language/language.js';
import { traceSegments, traceChartDomain } from './eyeTrace.js';
import { traceNumber } from './analysisPresentation.js';

/** @param {{samples: import('./eyeTrace.js').TraceSample[]}} props */
export function TraceChart({ samples }) {
  const [width, setWidth] = useState(0);
  const domain = traceChartDomain(samples);
  const height = 180;
  /** @param {number} time */
  const x = (time) => (time - domain.start) / (domain.end - domain.start) * width;
  /** @param {number} value */
  const y = (value) => (domain.max - value) / (domain.max - domain.min) * height;
  return <View style={styles.group}>
    <Text accessibilityRole="header" style={styles.heading}>{t('Đồ thị vị trí theo thời gian')}</Text>
    <Text style={styles.body}>{t('Xanh đậm: mục tiêu · Cam: mắt · Góc (°)')}</Text>
    <Text style={styles.axis}>{traceNumber(domain.max, 1)}°</Text>
    <View accessible accessibilityRole="image" accessibilityLabel={t('Biểu đồ so sánh góc mắt và mục tiêu theo thời gian. Các đoạn mất mẫu được ngắt, không nội suy.')} style={styles.chart} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {[0, 0.5, 1].map((fraction) => <View key={fraction} style={[styles.grid, { top: height * fraction }]} />)}
      {width > 0 ? (['target', 'eye']).flatMap((field) => traceSegments(samples, /** @type {'eye' | 'target'} */ (field)).flatMap((segment, segmentIndex) => segment.slice(1).map((point, i) => {
        const previous = segment[i];
        const dx = x(point.time) - x(previous.time); const dy = y(point.value) - y(previous.value);
        const length = Math.hypot(dx, dy);
        return <View key={`${field}-${segmentIndex}-${i}`} style={[styles.line, { left: (x(previous.time) + x(point.time) - length) / 2, top: (y(previous.value) + y(point.value)) / 2 - 1, width: length, backgroundColor: field === 'eye' ? '#B45309' : colors.primary, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] }]} />;
      }))) : null}
    </View>
    <Text style={styles.axis}>{traceNumber(domain.min, 1)}°</Text>
    <View style={styles.legend}><Text style={styles.axis}>0 s</Text><Text style={styles.axis}>{traceNumber((domain.end - domain.start) / 1000, 1)} s</Text></View>
    <Text style={styles.body}>{t('Biểu đồ rút gọn điểm để hiển thị; tính toán dùng toàn bộ mẫu hợp lệ. Khoảng trống không được nối. Đây là vị trí nhập vào, không phải kết quả camera của ứng dụng.')}</Text>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: 8 }, heading: { fontSize: 18, lineHeight: 26, color: colors.text, fontWeight: '700' }, body: { fontSize: 13, lineHeight: 20, color: colors.muted },
  chart: { height: 180, position: 'relative', overflow: 'hidden', backgroundColor: '#F4F8FB', borderWidth: 1, borderColor: '#CBD5E1' }, grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#DCE4EB' },
  line: { position: 'absolute', height: 2 }, axis: { fontSize: 12, color: colors.muted }, legend: { flexDirection: 'row', justifyContent: 'space-between' },
});
